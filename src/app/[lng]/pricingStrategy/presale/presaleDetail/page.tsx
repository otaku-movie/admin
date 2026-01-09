'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Col,
  Space,
  Typography,
  Upload,
  Tag,
  Select,
  Table,
  message
} from 'antd'
import type {
  UploadFile,
  UploadFileStatus,
  RcFile
} from 'antd/es/upload/interface'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '@/app/[lng]/layout'
import {
  usePricingStrategyStore,
  type PresaleTicket,
  type PresaleSpecification,
  type MubitikeBonusType,
  type MubitikeTicketType,
  type PresaleAudienceType
} from '@/store/usePricingStrategyStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { MovieModal } from '@/dialog/movieModal'
import type { Movie } from '@/type/api'

const { Title } = Typography

type SpecificationFormItem = {
  id?: string
  name?: string
  skuCode?: string
  ticketType?: MubitikeTicketType
  audienceType?: PresaleAudienceType
  deliveryType?: PresaleSpecification['deliveryType']
  price?: number
  stock?: number
  points?: number
  shipDays?: number
  image?: string
}

interface PresaleFormValues {
  type?: 'presale'
  code?: string
  title?: string
  cover?: string
  gallery?: string[]
  deliveryType?: PresaleTicket['deliveryType']
  discountMode?: PresaleTicket['discountMode']
  mubitikeType?: MubitikeTicketType
  price?: number
  amount?: number
  extraFee?: string
  totalQuantity?: number
  launchTime?: dayjs.Dayjs
  endTime?: dayjs.Dayjs
  usageStart?: dayjs.Dayjs
  usageEnd?: dayjs.Dayjs
  perUserLimit?: number
  remark?: string
  description?: string
  pickupNotes?: string
  bonusTitle?: string
  bonusType?: MubitikeBonusType
  bonusDelivery?: PresaleTicket['bonusDelivery']
  bonusDescription?: string
  movieId?: number
  benefits?: string[]
  specifications?: SpecificationFormItem[]
}

export default function PresaleFormPage({ params: { lng } }: PageProps) {
  const { t } = useTranslation(
    lng as 'zh-CN' | 'ja' | 'en-US',
    'pricingStrategy'
  )
  const { t: common } = useTranslation(
    lng as 'zh-CN' | 'ja' | 'en-US',
    'common'
  )
  const router = useRouter()
  const searchParams = useSearchParams()

  const addPresale = usePricingStrategyStore((state) => state.addPresale)
  const updatePresale = usePricingStrategyStore((state) => state.updatePresale)
  const presales = usePricingStrategyStore((state) => state.presales)

  const idParam = searchParams.get('id')
  const editingId = useMemo(() => {
    if (!idParam) return undefined
    const idNum = Number(idParam)
    return Number.isNaN(idNum) ? undefined : idNum
  }, [idParam])
  const isEditing = editingId !== undefined

  const editingTicket = useMemo(() => {
    if (!isEditing) return undefined
    return presales.find((item) => item.id === editingId)
  }, [presales, editingId, isEditing])

  const [form] = Form.useForm<PresaleFormValues>()
  const [coverList, setCoverList] = useState<UploadFile[]>([])
  const [galleryList, setGalleryList] = useState<UploadFile[]>([])
  const [loading, setLoading] = useState(false)
  const [movieModalOpen, setMovieModalOpen] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<{
    value: number
    label: string
    startDate?: string
  } | null>(null)
  const MAX_GALLERY_COUNT = 8

  useEffect(() => {
    if (isEditing && editingTicket) {
      const specifications =
        editingTicket.specifications && editingTicket.specifications.length > 0
          ? editingTicket.specifications.map((spec) => ({
              ...spec,
              deliveryType:
                spec.deliveryType ?? editingTicket.deliveryType ?? 'virtual'
            }))
          : [{ deliveryType: editingTicket.deliveryType ?? 'virtual' }]
      form.setFieldsValue({
        code: editingTicket.code,
        title: editingTicket.title,
        type: 'presale',
        deliveryType: editingTicket.deliveryType,
        discountMode: editingTicket.discountMode,
        mubitikeType: editingTicket.mubitikeType,
        price: editingTicket.price,
        amount: editingTicket.amount,
        extraFee: editingTicket.extraFee,
        totalQuantity: editingTicket.totalQuantity,
        launchTime: editingTicket.launchTime
          ? dayjs(editingTicket.launchTime)
          : undefined,
        endTime: editingTicket.endTime
          ? dayjs(editingTicket.endTime)
          : undefined,
        usageStart: editingTicket.usageStart
          ? dayjs(editingTicket.usageStart)
          : undefined,
        usageEnd: editingTicket.usageEnd
          ? dayjs(editingTicket.usageEnd)
          : undefined,
        perUserLimit: editingTicket.perUserLimit,
        remark: editingTicket.remark,
        description: editingTicket.description,
        pickupNotes: editingTicket.pickupNotes,
        bonusTitle: editingTicket.bonusTitle,
        bonusType: editingTicket.bonusType,
        bonusDelivery: editingTicket.bonusDelivery,
        bonusDescription: editingTicket.bonusDescription,
        movieId: editingTicket.movieIds?.[0],
        benefits: editingTicket.benefits || [],
        specifications
      })
      if (editingTicket.cover) {
        setCoverList([
          {
            uid: `${editingTicket.id}`,
            name: editingTicket.code,
            status: 'done',
            url: editingTicket.cover
          }
        ])
      }
      if (editingTicket.gallery && editingTicket.gallery.length > 0) {
        setGalleryList(
          editingTicket.gallery.map((url, index) => ({
            uid: `gallery-${editingTicket.id}-${index}`,
            name: `${editingTicket.code}-${index}`,
            status: 'done' as UploadFileStatus,
            url
          }))
        )
      } else {
        setGalleryList([])
      }
      if (editingTicket.movieIds && editingTicket.movieIds[0]) {
        const movieId = editingTicket.movieIds[0]
        const name = editingTicket.movieNames?.[0] || `${movieId}`
        setSelectedMovie({ value: movieId, label: name })
      }
    } else if (!isEditing) {
      form.setFieldsValue({
        type: 'presale',
        deliveryType: 'virtual',
        discountMode: 'fixed',
        mubitikeType: 'online',
        movieId: undefined,
        benefits: [],
        specifications: [{ deliveryType: 'virtual' }]
      })
      setCoverList([])
      setGalleryList([])
      setSelectedMovie(null)
    }
  }, [editingTicket, form, isEditing])

  useEffect(() => {
    if (isEditing && idParam && !editingTicket) {
      message.warning(t('presale.message.deleteConfirm'))
      router.replace(`/${lng}/pricingStrategy/presale`)
    }
  }, [editingTicket, idParam, isEditing, lng, router, t])

  useEffect(() => {
    if (!selectedMovie?.startDate) return
    const release = dayjs(selectedMovie.startDate)
    if (!release.isValid()) return
    const computedEnd = release
      .subtract(1, 'day')
      .set('hour', 23)
      .set('minute', 59)
      .set('second', 59)
    const currentEnd = form.getFieldValue('endTime') as dayjs.Dayjs | undefined
    if (!currentEnd || !currentEnd.isSame(computedEnd)) {
      form.setFieldsValue({ endTime: computedEnd })
    }
    const currentUsageStart = form.getFieldValue('usageStart') as
      | dayjs.Dayjs
      | undefined
    if (!currentUsageStart) {
      form.setFieldsValue({ usageStart: release.startOf('day') })
    }
    const currentUsageEnd = form.getFieldValue('usageEnd') as
      | dayjs.Dayjs
      | undefined
    if (!currentUsageEnd) {
      form.setFieldsValue({
        usageEnd: release.add(60, 'day').endOf('day')
      })
    }
  }, [form, selectedMovie])

  const handleBack = () => {
    form.resetFields()
    router.back()
  }

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        setLoading(true)
        const galleryValues = galleryList
          .map((item) => item.url)
          .filter((url): url is string => Boolean(url))
        if (galleryValues.length === 0) {
          message.error(t('presale.form.gallery.required'))
          setLoading(false)
          return
        }
        const normalizedSpecifications: PresaleSpecification[] = (
          values.specifications ?? []
        )
          .filter(
            (
              item
            ): item is Required<
              Pick<
                SpecificationFormItem,
                'price' | 'deliveryType' | 'ticketType'
              >
            > &
              SpecificationFormItem =>
              !!item &&
              typeof item.price === 'number' &&
              !!item.deliveryType &&
              !!item.ticketType
          )
          .map((item) => ({
            id: item.id,
            name: item.name?.trim() || undefined,
            skuCode: item.skuCode?.trim() || undefined,
            ticketType: item.ticketType,
            audienceType: item.audienceType,
            deliveryType:
              item.deliveryType ??
              values.deliveryType ??
              editingTicket?.deliveryType ??
              'virtual',
            price: item.price as number,
            stock:
              item.stock === undefined || item.stock === null
                ? undefined
                : item.stock,
            points:
              item.points === undefined || item.points === null
                ? undefined
                : item.points,
            shipDays:
              item.shipDays === undefined || item.shipDays === null
                ? undefined
                : item.shipDays,
            image: item.image?.trim() || undefined
          }))

        if (normalizedSpecifications.length === 0) {
          message.error(t('presale.form.specifications.required'))
          return
        }

        const payload: PresaleTicket = {
          id:
            isEditing && editingTicket
              ? editingTicket.id
              : Date.now() + Math.floor(Math.random() * 1000),
          code:
            isEditing && editingTicket
              ? values.code || editingTicket.code
              : (
                  values.code || `CP-${Date.now().toString(36).toUpperCase()}`
                ).toString(),
          title:
            values.title?.trim() ||
            editingTicket?.title ||
            t('presale.form.title.fallback'),
          type: 'presale',
          deliveryType:
            normalizedSpecifications[0]?.deliveryType ||
            values.deliveryType ||
            'virtual',
          discountMode: values.discountMode || 'fixed',
          mubitikeType:
            values.mubitikeType || editingTicket?.mubitikeType || 'online',
          price: normalizedSpecifications[0]?.price ?? values.price!,
          amount: values.amount!,
          extraFee: values.extraFee,
          totalQuantity: values.totalQuantity!,
          launchTime: values.launchTime
            ? values.launchTime.format('YYYY-MM-DD HH:mm:ss')
            : undefined,
          endTime: values.endTime
            ? values.endTime.format('YYYY-MM-DD HH:mm:ss')
            : undefined,
          usageStart: values.usageStart
            ? values.usageStart.format('YYYY-MM-DD HH:mm:ss')
            : undefined,
          usageEnd: values.usageEnd
            ? values.usageEnd.format('YYYY-MM-DD HH:mm:ss')
            : undefined,
          perUserLimit: values.perUserLimit!,
          remark: values.remark,
          pickupNotes: values.pickupNotes?.trim(),
          cover: values.cover!,
          gallery: galleryValues,
          description: values.description,
          movieIds: selectedMovie ? [selectedMovie.value] : [],
          movieNames: selectedMovie ? [selectedMovie.label] : [],
          benefits: values.benefits?.filter(Boolean),
          updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
          bonusTitle: values.bonusTitle?.trim(),
          bonusType: values.bonusType,
          bonusDelivery:
            values.bonusDelivery ??
            (normalizedSpecifications[0]?.deliveryType ||
              values.deliveryType ||
              editingTicket?.deliveryType),
          bonusDescription: values.bonusDescription?.trim(),
          specifications: normalizedSpecifications
        }

        if (isEditing && editingTicket) {
          updatePresale(payload)
        } else {
          addPresale(payload)
        }

        message.success(t('presale.message.saveSuccess'))
        handleBack()
      })
      .finally(() => setLoading(false))
  }

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        minHeight: '100%',
        paddingBottom: 80
      }}
    >
      <header>
        <Title level={3}>{t('tabs.presale')}</Title>
      </header>
      <Form form={form} layout="vertical">
        <Row gutter={[24, 0]}>
          <Col span={24}>
            <Title level={4} style={{ marginBottom: 16 }}>
              {t('presale.form.section.media')}
            </Title>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col span={24}>
            <Form.Item
              label={t('presale.form.cover.label')}
              name="cover"
              rules={[
                { required: true, message: t('presale.form.cover.required') }
              ]}
            >
              <Upload
                listType="picture-card"
                fileList={coverList}
                beforeUpload={(file) => {
                  const reader = new FileReader()
                  reader.onload = (e) => {
                    const result = e.target?.result as string
                    setCoverList([
                      {
                        uid: file.uid,
                        name: file.name,
                        status: 'done',
                        url: result
                      }
                    ])
                    form.setFieldsValue({ cover: result })
                  }
                  reader.readAsDataURL(file)
                  return false
                }}
                onRemove={() => {
                  setCoverList([])
                  form.setFieldsValue({ cover: undefined })
                }}
                maxCount={1}
              >
                {coverList.length >= 1 ? null : (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>
                      {t('presale.form.cover.upload')}
                    </div>
                  </div>
                )}
              </Upload>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col span={24}>
            <Form.Item label={t('presale.form.gallery.label')}>
              <Upload
                listType="picture-card"
                fileList={galleryList}
                multiple
                maxCount={MAX_GALLERY_COUNT}
                beforeUpload={(file: RcFile) => {
                  const reader = new FileReader()
                  reader.onload = (e) => {
                    const url = e.target?.result as string
                    setGalleryList((prev) => {
                      const next: UploadFile[] = [
                        ...prev,
                        {
                          uid: file.uid,
                          name: file.name,
                          status: 'done' as UploadFileStatus,
                          url
                        }
                      ]
                      return next
                    })
                  }
                  reader.readAsDataURL(file)
                  return false
                }}
                onRemove={(file) => {
                  setGalleryList((prev) =>
                    prev.filter((item) => item.uid !== file.uid)
                  )
                  return true
                }}
              >
                {galleryList.length >= MAX_GALLERY_COUNT ? null : (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>
                      {t('presale.form.gallery.upload')}
                    </div>
                  </div>
                )}
              </Upload>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col span={24}>
            <Title level={4} style={{ marginBottom: 16 }}>
              {t('presale.form.section.basic')}
            </Title>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col xs={24} md={12}>
            <Form.Item label={t('presale.form.code.label')} name="code">
              <Input disabled placeholder={t('presale.form.code.generated')} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label={t('presale.form.type.label')} name="type">
              <Select
                disabled
                options={[
                  { value: 'presale', label: t('presale.type.presale') }
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col xs={24} md={14}>
            <Form.Item
              label={t('presale.form.title.label')}
              name="title"
              rules={[
                { required: true, message: t('presale.form.title.required') }
              ]}
            >
              <Input placeholder={t('presale.form.title.placeholder')} />
            </Form.Item>
          </Col>
          <Col xs={24} md={10}>
            <Form.Item
              label={t('presale.form.mubitikeType.label')}
              name="mubitikeType"
              rules={[
                {
                  required: true,
                  message: t('presale.form.mubitikeType.required')
                }
              ]}
            >
              <Select
                options={[
                  { value: 'online', label: t('presale.mubitikeType.online') },
                  { value: 'card', label: t('presale.mubitikeType.card') },
                  { value: 'combo', label: t('presale.mubitikeType.combo') }
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col span={24}>
            <Form.Item shouldUpdate>
              {() => (
                <Form.Item
                  label={t('presale.form.movie.label')}
                  name="movieId"
                  rules={
                    selectedMovie
                      ? []
                      : [
                          {
                            required: true,
                            message: t('presale.form.movie.required')
                          }
                        ]
                  }
                >
                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                  >
                    <Space wrap>
                      {selectedMovie && (
                        <Tag
                          closable
                          onClose={(e) => {
                            e.preventDefault()
                            setSelectedMovie(null)
                            form.setFieldsValue({ movieId: undefined })
                          }}
                        >
                          {selectedMovie.label}
                        </Tag>
                      )}
                    </Space>
                    {!selectedMovie && (
                      <Button
                        type="dashed"
                        onClick={() => setMovieModalOpen(true)}
                        style={{ width: 200 }}
                      >
                        {common('button.select')}
                      </Button>
                    )}
                  </div>
                  <Form.Item name="movieId" noStyle>
                    <Input hidden />
                  </Form.Item>
                </Form.Item>
              )}
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col span={24}>
            <Title level={4} style={{ margin: '24px 0 16px' }}>
              {t('presale.form.section.sales')}
            </Title>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={t('presale.form.deliveryType.label')}
              name="deliveryType"
            >
              <Select
                options={[
                  {
                    value: 'virtual',
                    label: t('presale.deliveryType.virtual')
                  },
                  {
                    value: 'physical',
                    label: t('presale.deliveryType.physical')
                  }
                ]}
              />
            </Form.Item>
          </Col>

        </Row>
        <Row gutter={[24, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={t('presale.form.price.label')}
              name="price"
              rules={[
                { required: true, message: t('presale.form.price.required') }
              ]}
            >
              <InputNumber style={{ width: '100%' }} min={0} precision={0} />
            </Form.Item>
          </Col>

        </Row>
        <Row gutter={[24, 0]}>
          <Col span={24}>
            <Title level={4} style={{ margin: '24px 0 16px' }}>
              {t('presale.form.section.specifications')}
            </Title>
          </Col>
        </Row>
        <Form.List
          name="specifications"
          rules={[
            {
              validator: async (_, value) => {
                if (!value || value.length === 0) {
                  return Promise.reject(
                    new Error(t('presale.form.specifications.required'))
                  )
                }
                const hasEmptyPrice = value.some(
                  (item: SpecificationFormItem) =>
                    !item || item.price === undefined || item.price === null
                )
                if (hasEmptyPrice) {
                  return Promise.reject(
                    new Error(t('presale.form.specifications.priceRequired'))
                  )
                }
                const hasEmptyDelivery = value.some(
                  (item: SpecificationFormItem) =>
                    !item ||
                    !item.deliveryType ||
                    (item.deliveryType !== 'virtual' &&
                      item.deliveryType !== 'physical')
                )
                if (hasEmptyDelivery) {
                  return Promise.reject(
                    new Error(t('presale.form.specifications.deliveryRequired'))
                  )
                }
                return Promise.resolve()
              }
            }
          ]}
        >
          {(fields, { add, remove }, { errors }) => {
            const skuColumns = [
              {
                title: t('presale.form.specifications.groupLabel'),
                dataIndex: 'name',
                width: 200,
                render: (_: unknown, record: (typeof fields)[number]) => (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Form.Item name={[record.name, 'id']} hidden>
                      <Input hidden />
                    </Form.Item>
                    <Form.Item
                      name={[record.name, 'name']}
                      style={{ marginBottom: 0 }}
                    >
                      <Input
                        placeholder={t(
                          'presale.form.specifications.groupPlaceholder'
                        )}
                      />
                    </Form.Item>
                    <Form.Item
                      name={[record.name, 'skuCode']}
                      style={{ marginBottom: 0 }}
                    >
                      <Input
                        placeholder={t(
                          'presale.form.specifications.skuPlaceholder'
                        )}
                      />
                    </Form.Item>
                  </Space>
                )
              },
              {
                title: t('presale.form.specifications.ticketType'),
                dataIndex: 'ticketType',
                width: 160,
                render: (_: unknown, record: (typeof fields)[number]) => (
                  <Form.Item
                    name={[record.name, 'ticketType']}
                    rules={[
                      {
                        required: true,
                        message: t(
                          'presale.form.specifications.ticketTypeRequired'
                        )
                      }
                    ]}
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      options={[
                        {
                          value: 'online',
                          label: t('presale.mubitikeType.online')
                        },
                        {
                          value: 'card',
                          label: t('presale.mubitikeType.card')
                        },
                        {
                          value: 'combo',
                          label: t('presale.mubitikeType.combo')
                        }
                      ]}
                      placeholder={t(
                        'presale.form.specifications.ticketTypePlaceholder'
                      )}
                    />
                  </Form.Item>
                )
              },
              {
                title: t('presale.form.specifications.deliveryType'),
                dataIndex: 'deliveryType',
                width: 160,
                render: (_: unknown, record: (typeof fields)[number]) => (
                  <Form.Item
                    name={[record.name, 'deliveryType']}
                    rules={[
                      {
                        required: true,
                        message: t(
                          'presale.form.specifications.deliveryRequired'
                        )
                      }
                    ]}
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      options={[
                        {
                          value: 'virtual',
                          label: t('presale.deliveryType.virtual')
                        },
                        {
                          value: 'physical',
                          label: t('presale.deliveryType.physical')
                        }
                      ]}
                      placeholder={t(
                        'presale.form.specifications.deliveryPlaceholder'
                      )}
                    />
                  </Form.Item>
                )
              },

              {
                title: t('presale.form.specifications.price'),
                dataIndex: 'price',
                width: 140,
                render: (_: unknown, record: (typeof fields)[number]) => (
                  <Form.Item
                    name={[record.name, 'price']}
                    rules={[
                      {
                        required: true,
                        message: t('presale.form.specifications.priceRequired')
                      }
                    ]}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber
                      min={0}
                      precision={0}
                      style={{ width: '100%' }}
                      placeholder={t(
                        'presale.form.specifications.pricePlaceholder'
                      )}
                    />
                  </Form.Item>
                )
              },
              {
                title: t('presale.form.specifications.stock'),
                dataIndex: 'stock',
                width: 120,
                render: (_: unknown, record: (typeof fields)[number]) => (
                  <Form.Item
                    name={[record.name, 'stock']}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber
                      min={0}
                      precision={0}
                      style={{ width: '100%' }}
                      placeholder={t(
                        'presale.form.specifications.stockPlaceholder'
                      )}
                    />
                  </Form.Item>
                )
              },
              {
                title: t('presale.form.specifications.image'),
                dataIndex: 'image',
                width: 220,
                render: (_: unknown, record: (typeof fields)[number]) => (
                  <Form.Item
                    name={[record.name, 'image']}
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      placeholder={t(
                        'presale.form.specifications.imagePlaceholder'
                      )}
                    />
                  </Form.Item>
                )
              },
              {
                title: common('table.action'),
                dataIndex: 'action',
                width: 120,
                render: (_: unknown, record: (typeof fields)[number]) => (
                  <Button
                    type="link"
                    danger
                    onClick={() => remove(record.name)}
                  >
                    {common('button.remove')}
                  </Button>
                )
              }
            ]

            return (
              <Row gutter={[24, 0]}>
                <Col span={24}>
                  <Form.Item
                    label={t('presale.form.specifications.label')}
                    required={false}
                    style={{ width: '100%' }}
                  >
                    <Table
                      columns={skuColumns}
                      dataSource={fields}
                      rowKey={(field) => field.key}
                      pagination={false}
                      size="small"
                      scroll={{ x: 1200 }}
                    />
                    <Button
                      type="dashed"
                      onClick={() =>
                        add({
                          deliveryType:
                            form.getFieldValue('deliveryType') || 'virtual',
                          ticketType:
                            form.getFieldValue('mubitikeType') || 'online'
                        })
                      }
                      style={{ width: 240, marginTop: 16 }}
                    >
                      {t('presale.form.specifications.add')}
                    </Button>
                    <Form.ErrorList errors={errors} />
                  </Form.Item>
                </Col>
              </Row>
            )
          }}
        </Form.List>
        <Row gutter={[24, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={t('presale.form.quantity.label')}
              name="totalQuantity"
              rules={[
                { required: true, message: t('presale.form.quantity.required') }
              ]}
            >
              <InputNumber style={{ width: '100%' }} min={1} precision={0} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label={t('presale.form.perUserLimit.label')}
              name="perUserLimit"
              rules={[
                {
                  required: true,
                  message: t('presale.form.perUserLimit.required')
                }
              ]}
            >
              <InputNumber style={{ width: '100%' }} min={1} precision={0} />
            </Form.Item>
          </Col>
        </Row>

        <Form.List name="benefits">
          {(fields, { add, remove }) => (
            <Row gutter={[24, 0]}>
              <Col span={24}>
                <Form.Item
                  label={t('presale.form.benefits.label')}
                  required={false}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {fields.map((field) => (
                      <Space
                        key={field.key}
                        align="baseline"
                        style={{ width: '100%' }}
                      >
                        <Form.Item
                          {...field}
                          name={field.name}
                          fieldKey={field.fieldKey}
                          style={{ flex: 1, marginBottom: 0 }}
                          rules={[
                            {
                              required: true,
                              message: t('presale.form.benefits.required')
                            }
                          ]}
                        >
                          <Input
                            placeholder={t('presale.form.benefits.placeholder')}
                          />
                        </Form.Item>
                        <Button
                          type="link"
                          danger
                          onClick={() => remove(field.name)}
                        >
                          {common('button.remove')}
                        </Button>
                      </Space>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      style={{ width: 200 }}
                    >
                      {t('presale.form.benefits.add')}
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form.List>
        <Row gutter={[24, 0]}>
          <Col span={24}>
            <Title level={4} style={{ margin: '24px 0 16px' }}>
              {t('presale.form.section.usage')}
            </Title>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={t('presale.form.usageStart.label')}
              name="usageStart"
              rules={[
                {
                  required: true,
                  message: t('presale.form.usageStart.required')
                }
              ]}
            >
              <DatePicker
                format="YYYY-MM-DD HH:mm"
                showTime={{ format: 'HH:mm' }}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label={t('presale.form.usageEnd.label')}
              name="usageEnd"
              rules={[
                {
                  required: true,
                  message: t('presale.form.usageEnd.required')
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const start = getFieldValue('usageStart') as
                      | dayjs.Dayjs
                      | undefined
                    if (!value || !start) {
                      return Promise.resolve()
                    }
                    if (value.isAfter(start) || value.isSame(start)) {
                      return Promise.resolve()
                    }
                    return Promise.reject(t('presale.form.usageEnd.afterStart'))
                  }
                })
              ]}
            >
              <DatePicker
                format="YYYY-MM-DD HH:mm:ss"
                showTime={{ format: 'HH:mm:ss' }}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={t('presale.form.launchTime.label')}
              name="launchTime"
              rules={[
                {
                  required: true,
                  message: t('presale.form.launchTime.required')
                }
              ]}
            >
              <DatePicker
                showTime={{ format: 'HH:mm' }}
                format="YYYY-MM-DD HH:mm"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label={t('presale.form.endTime.label')}
              name="endTime"
              rules={[
                {
                  required: true,
                  message: t('presale.form.endTime.required')
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const launch = getFieldValue('launchTime') as
                      | dayjs.Dayjs
                      | undefined
                    if (!value || !launch) {
                      return Promise.resolve()
                    }
                    if (value.isAfter(launch)) {
                      return Promise.resolve()
                    }
                    return Promise.reject(t('presale.form.endTime.afterLaunch'))
                  }
                })
              ]}
            >
              <DatePicker
                showTime={{ format: 'HH:mm:ss' }}
                format="YYYY-MM-DD HH:mm:ss"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col span={24}>
            <Title level={4} style={{ margin: '24px 0 16px' }}>
              {t('presale.form.section.bonus')}
            </Title>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={t('presale.form.bonusTitle.label')}
              name="bonusTitle"
            >
              <Input placeholder={t('presale.form.bonusTitle.placeholder')} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label={t('presale.form.bonusType.label')}
              name="bonusType"
            >
              <Select
                allowClear
                options={[
                  { value: 'digital', label: t('presale.bonusType.digital') },
                  { value: 'physical', label: t('presale.bonusType.physical') },
                  { value: 'voucher', label: t('presale.bonusType.voucher') }
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={t('presale.form.bonusDelivery.label')}
              name="bonusDelivery"
            >
              <Select
                allowClear
                options={[
                  {
                    value: 'virtual',
                    label: t('presale.deliveryType.virtual')
                  },
                  {
                    value: 'physical',
                    label: t('presale.deliveryType.physical')
                  }
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label={t('presale.form.pickupNotes.label')}
              name="pickupNotes"
            >
              <Input.TextArea
                rows={3}
                placeholder={t('presale.form.pickupNotes.placeholder')}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col span={24}>
            <Form.Item
              label={t('presale.form.bonusDescription.label')}
              name="bonusDescription"
            >
              <Input.TextArea
                rows={3}
                placeholder={t('presale.form.bonusDescription.placeholder')}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[24, 0]}>
          <Col span={24}>
            <Form.Item label={t('presale.form.remark.label')} name="remark">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          padding: '16px 24px',
          margin: '0 -24px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderTop: '1px solid #f0f0f0',
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(3px)'
        }}
      >
        <Button onClick={handleBack}>{common('button.cancel')}</Button>
        <Button type="primary" loading={loading} onClick={handleSubmit}>
          {common('button.save')}
        </Button>
      </div>
      <MovieModal
        show={movieModalOpen}
        data={{}}
        onCancel={() => setMovieModalOpen(false)}
        onConfirm={(movie: Movie) => {
          if (!movie?.id) {
            message.warning(t('presale.form.movie.required'))
            return
          }
          setMovieModalOpen(false)
          const displayName = movie.name || movie.originalName || `${movie.id}`
          setSelectedMovie({
            value: movie.id,
            label: displayName,
            startDate: movie.startDate
          })
          form.setFieldsValue({ movieId: movie.id })
          if (movie.startDate) {
            const release = dayjs(movie.startDate)
            if (release.isValid()) {
              form.setFieldsValue({
                endTime: release
                  .subtract(1, 'day')
                  .set('hour', 23)
                  .set('minute', 59)
                  .set('second', 59)
              })
              form.setFieldsValue({
                usageStart: release.startOf('day'),
                usageEnd: release.add(60, 'day').endOf('day')
              })
            }
          }
        }}
      />
    </section>
  )
}
