'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Spin,
  Typography,
  Flex,
  Row,
  Col,
  Modal,
  Cascader,
  Tag,
  Transfer
} from 'antd'
import { useRouter, useSearchParams } from 'next/navigation'
import { LeftOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import http from '@/api/index'
import { getMovieDetail } from '@/api/request/movie'
import {
  getAddressTreeList,
  type AddressTreeListResponse
} from '@/api/request/cinema'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '@/app/[lng]/layout'
import { CheckPermission } from '@/components/checkPermission'
import { Query, QueryItem } from '@/components/query'
import { CustomAntImage } from '@/components/CustomAntImage'
import { MovieModal } from '@/dialog/movieModal'
import { Upload as ImageUpload } from '@/components/upload/Upload'
import { useCommonStore } from '@/store/useCommonStore'
import { DictCode } from '@/enum/dict'
import { formatNumber } from '@/utils'

interface BenefitDetail {
  id: number
  movieId: number
  movieName?: string
  name: string
  description?: string
  images?: string[]
  startDate: string
  endDate: string
  orderNum?: number
  /** 影院限定：限定影院 id 列表，空为不限定 */
  cinemaLimitIds?: number[]
  /** 放映类型限定：限定放映类型 code 列表（2D/3D 等），空为不限定 */
  limitDimensionTypes?: number[]
  /** 特效场次限定：限定规格 id 列表（来自 cinema/spec/list，如 IMAX 等），空为不限定 */
  limitSpecIds?: number[]
  /** 特典数量 */
  quantity?: number
  /** 剩余数量，不填=未知，0=已经没有了 */
  remaining?: number | null
}

export default function BenefitDetailPage ({
  params: { lng }
}: Readonly<PageProps>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const idParam = searchParams.get('id')
  const benefitId = idParam ? parseInt(idParam, 10) : null
  const movieIdParam = searchParams.get('movieId')

  const [detail, setDetail] = useState<BenefitDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [phaseForm] = Form.useForm()
  const [createMovie, setCreateMovie] = useState<{
    id: number
    name: string
  } | null>(null)
  const [movieModalOpen, setMovieModalOpen] = useState(false)
  const [cinemaOptions, setCinemaOptions] = useState<
    { id: number; name: string }[]
  >([])
  const [specOptions, setSpecOptions] = useState<
    { id: number; name: string }[]
  >([])
  const [brandOptions, setBrandOptions] = useState<
    { id: number; name: string }[]
  >([])
  const isCreate = benefitId == null || Number.isNaN(benefitId)

  // 影院限定弹窗
  const [cinemaModalOpen, setCinemaModalOpen] = useState(false)
  const [cinemaModalList, setCinemaModalList] = useState<
    { id: number; name: string }[]
  >([])
  const [cinemaModalSelected, setCinemaModalSelected] = useState<number[]>([])
  const [cinemaModalAreaId, setCinemaModalAreaId] = useState<number[]>([])
  const [cinemaModalSpecId, setCinemaModalSpecId] = useState<number>()
  const [cinemaModalBrandId, setCinemaModalBrandId] = useState<number>()
  const [cinemaNameMap, setCinemaNameMap] = useState<Record<number, string>>({})
  const [addressTree, setAddressTree] = useState<AddressTreeListResponse[]>([])

  const { t: common } = useTranslation(lng, 'common')
  const { t: tCinemaDetail } = useTranslation(lng, 'cinemaDetail')
  const commonStore = useCommonStore()
  const dimensionOptions = commonStore.dict?.[DictCode.DIMENSION_TYPE] || []
  const cinemaLimitIds: number[] =
    Form.useWatch('cinemaLimitIds', phaseForm) ?? []

  const mergeCinemaNames = (list: { id: number; name: string }[]) => {
    setCinemaNameMap(prev => {
      const next = { ...prev }
      list.forEach(c => {
        next[c.id] = c.name
      })
      return next
    })
  }

  const quantityUnits = [
    { value: 1e8, unit: common('unit.billion') },
    { value: 1e4, unit: common('unit.million') },
    { value: 1e3, unit: common('unit.thousand') }
  ]
  const quantityValue = Form.useWatch('quantity', phaseForm)
  const remainingValue = Form.useWatch('remaining', phaseForm)
  const quantityFormatted =
    quantityValue != null &&
    quantityValue !== '' &&
    !Number.isNaN(Number(quantityValue))
      ? formatNumber(Number(quantityValue), quantityUnits)
      : null

  useEffect(() => {
    commonStore.getDict()
  }, [])

  // 新建时若 URL 带 movieId，预选该电影
  useEffect(() => {
    if (!movieIdParam) return
    getMovieDetail({
      id: Number(movieIdParam)
    })
      .then((res: any) => {
        const list = res?.data ?? res
        const movie = Array.isArray(list) && list.length > 0 ? list[0] : list
        if (movie?.id && movie?.name) {
          setCreateMovie({ id: movie.id, name: movie.name })
        }
      })
      .catch(() => {})
  }, [movieIdParam])

  useEffect(() => {
    if (isCreate) {
      setLoading(false)
      setDetail(null)
      return
    }
    setLoading(true)
    http({
      url: 'admin/benefit/detail',
      method: 'get',
      params: { id: benefitId }
    })
      .then((res: any) => {
        const d = res.data ?? res
        setDetail(d ? { ...d, images: d.imageUrls ?? d.images ?? [] } : null)
        if (d) {
          phaseForm.setFieldsValue({
            name: d.name,
            description: d.description ?? '',
            images: d.imageUrls ?? d.images ?? [],
            startDate: d.startDate ? dayjs(d.startDate) : null,
            endDate: d.endDate ? dayjs(d.endDate) : null,
            orderNum: d.orderNum ?? 0,
            cinemaLimitIds: d.cinemaIds ?? d.cinemaLimitIds ?? [],
            limitDimensionTypes: d.limitDimensionTypes ?? [],
            limitSpecIds: d.limitSpecIds ?? [],
            quantity: d.quantity ?? undefined,
            remaining: d.remaining ?? undefined
          })
        }
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [benefitId, isCreate])

  useEffect(() => {
    http({
      url: 'cinema/list',
      method: 'post',
      data: { page: 1, pageSize: 2000 }
    })
      .then((res: any) => {
        const d = res.data ?? res
        const list = d.list ?? d ?? []
        const mapped = (Array.isArray(list) ? list : []).map((c: any) => ({
          id: c.id,
          name: c.name || ''
        }))
        setCinemaOptions(mapped)
        mergeCinemaNames(mapped)
      })
      .catch(() => setCinemaOptions([]))
  }, [])

  useEffect(() => {
    getAddressTreeList()
      .then(res => {
        setAddressTree((res.data as unknown as AddressTreeListResponse[]) ?? [])
      })
      .catch(() => setAddressTree([]))
  }, [])

  useEffect(() => {
    http({
      url: 'cinema/spec/list',
      method: 'post',
      data: { page: 1, pageSize: 200 }
    })
      .then((res: any) => {
        const d = res.data ?? res
        const list = d.list ?? d ?? []
        setSpecOptions(
          (Array.isArray(list) ? list : []).map((s: any) => ({
            id: s.id,
            name: s.name || ''
          }))
        )
      })
      .catch(() => setSpecOptions([]))
  }, [])

  useEffect(() => {
    http({ url: 'brand/list', method: 'post', data: { page: 1, pageSize: 200 } })
      .then((res: any) => {
        const d = res.data ?? res
        const list = d.list ?? d ?? []
        setBrandOptions(
          (Array.isArray(list) ? list : []).map((b: any) => ({
            id: b.id,
            name: b.name || ''
          }))
        )
      })
      .catch(() => setBrandOptions([]))
  }, [])

  const loadCinemaModalList = (
    areaIds?: (number | null)[],
    specId?: number,
    keyword?: string,
    brandId?: number
  ) => {
    const payload: Record<string, unknown> = { page: 1, pageSize: 2000 }
    if (areaIds?.length) {
      if (areaIds[0] != null) payload.regionId = areaIds[0]
      if (areaIds[1] != null) payload.prefectureId = areaIds[1]
      if (areaIds[2] != null) payload.cityId = areaIds[2]
    }
    if (specId != null) payload.specId = specId
    if (brandId != null) payload.brandId = brandId
    if (keyword?.trim()) payload.name = keyword.trim()
    http({ url: 'cinema/list', method: 'post', data: payload })
      .then((res: any) => {
        const d = res.data ?? res
        const list = d.list ?? d ?? []
        const mapped = (Array.isArray(list) ? list : []).map((c: any) => ({
          id: c.id,
          name: c.name || ''
        }))
        setCinemaModalList(mapped)
        mergeCinemaNames(mapped)
      })
      .catch(() => setCinemaModalList([]))
  }

  const openCinemaModal = () => {
    setCinemaModalSelected(cinemaLimitIds)
    setCinemaModalAreaId([])
    setCinemaModalSpecId(undefined)
    setCinemaModalBrandId(undefined)
    setCinemaModalList(cinemaOptions)
    setCinemaModalOpen(true)
  }

  const confirmCinemaModal = () => {
    phaseForm.setFieldsValue({ cinemaLimitIds: cinemaModalSelected })
    setCinemaModalOpen(false)
  }

  const removeCinemaLimit = (id: number) => {
    phaseForm.setFieldsValue({
      cinemaLimitIds: cinemaLimitIds.filter(v => v !== id)
    })
  }

  const cinemaTransferData = useMemo(() => {
    const map = new Map<number, string>()
    cinemaModalList.forEach(c => map.set(c.id, c.name))
    cinemaModalSelected.forEach(id => {
      if (!map.has(id)) map.set(id, cinemaNameMap[id] ?? `#${id}`)
    })
    return Array.from(map, ([id, name]) => ({ key: String(id), title: name }))
  }, [cinemaModalList, cinemaModalSelected, cinemaNameMap])

  const handleSavePhase = () => {
    const movieId = isCreate ? createMovie?.id : detail?.movieId
    if (!movieId) {
      message.warning(common('benefit.form.selectMovieWarning'))
      return
    }
    phaseForm.validateFields().then(values => {
      const payload = {
        id: benefitId ?? undefined,
        movieId,
        name: values.name,
        description: values.description || undefined,
        imageUrls: Array.isArray(values.images) ? values.images : [],
        startDate: values.startDate
          ? dayjs(values.startDate).format('YYYY-MM-DD')
          : '',
        endDate: values.endDate
          ? dayjs(values.endDate).format('YYYY-MM-DD')
          : '',
        orderNum: values.orderNum ?? 0,
        cinemaLimitIds: values.cinemaLimitIds ?? [],
        limitDimensionTypes: values.limitDimensionTypes ?? [],
        limitSpecIds: values.limitSpecIds ?? [],
        quantity:
          values.quantity != null && values.quantity !== ''
            ? Number(values.quantity)
            : undefined,
        remaining:
          values.remaining != null && values.remaining !== ''
            ? Number(values.remaining)
            : undefined
      }
      http({ url: 'admin/benefit/save', method: 'post', data: payload }).then(
        (res: any) => {
          message.success(common('message.save'))
          const returnedId = res.data
          if (isCreate && returnedId != null) {
            router.back()
          }
          if (benefitId) {
            http({
              url: 'admin/benefit/detail',
              method: 'get',
              params: { id: benefitId }
            }).then((r: any) => {
              const next = r.data ?? r
              setDetail(
                next
                  ? { ...next, images: next.imageUrls ?? next.images ?? [] }
                  : null
              )
            })
          }
        }
      )
    })
  }

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size='large' />
      </div>
    )
  }

  if (benefitId && !detail && !loading) {
    return (
      <Card>
        <Typography.Text type='secondary'>{common('benefit.form.phaseNotFound')}</Typography.Text>
        <Button
          type='link'
          onClick={() => router.push(`/${lng}/movie/benefitList`)}
        >
          {common('benefit.form.backToList')}
        </Button>
      </Card>
    )
  }

  const phaseFormContent = (
    <Form form={phaseForm} layout='vertical'>
      <Row gutter={24}>
        <Col span={24}>
          {isCreate ? (
            <Form.Item label={common('benefit.table.movieName')} required>
              <Flex align='center' gap={8}>
                <span
                  style={{
                    flex: 1,
                    color: createMovie ? undefined : 'rgba(0,0,0,0.25)'
                  }}
                >
                  {createMovie?.name ?? common('benefit.form.selectMoviePlaceholder')}
                </span>
                <Button type='primary' onClick={() => setMovieModalOpen(true)}>
                  {common('benefit.button.selectMovie')}
                </Button>
              </Flex>
            </Form.Item>
          ) : (
            <Form.Item label={common('benefit.table.movieName')}>
              <Input value={detail?.movieName} disabled />
            </Form.Item>
          )}
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name='name'
            label={common('benefit.detail.benefitName')}
            rules={[{ required: true }]}
          >
            <Input placeholder={common('benefit.form.nameExample')} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name='quantity'
            label={common('benefit.detail.quantity')}
            extra={
              quantityFormatted ? (
                <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                  约 {quantityFormatted}
                </span>
              ) : undefined
            }
          >
            <Input type='number' min={0} placeholder={common('benefit.form.quantityPlaceholder')} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name='remaining'
            label={common('benefit.detail.remaining')}
            extra={
              remainingValue === 0 || remainingValue === '0' ? (
                <span style={{ color: 'var(--ant-color-error)', fontSize: 12 }}>
                  {common('benefit.detail.soldOut')}
                </span>
              ) : undefined
            }
          >
            <Input
              type='number'
              min={0}
              placeholder={common('benefit.detail.remainingPlaceholder')}
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            name='description'
            label={common('benefit.detail.description')}
          >
            <Input.TextArea rows={3} placeholder={common('benefit.form.descriptionPlaceholder')} />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            name='images'
            label={common('benefit.detail.images')}
            getValueFromEvent={(v: string[]) => v ?? []}
          >
            <ImageUpload
              multiple
              value={phaseForm.getFieldValue('images') ?? []}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name='cinemaLimitIds' hidden>
            <Input type='hidden' />
          </Form.Item>
          <Form.Item
            label={common('benefit.detail.cinemaLimit')}
            extra={
              <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                {cinemaLimitIds.length > 0
                  ? common('benefit.limit.selectedCount', {
                      count: cinemaLimitIds.length
                    })
                  : common('benefit.limit.unlimitedTip')}
              </span>
            }
          >
            <div
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: 6,
                padding: '4px 8px',
                minHeight: 32,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap'
              }}
            >
              <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {cinemaLimitIds.length === 0 ? (
                  <span style={{ color: 'rgba(0,0,0,0.25)' }}>
                    {common('benefit.limit.unlimited')}
                  </span>
                ) : (
                  cinemaLimitIds.map(id => (
                    <Tag
                      key={id}
                      closable
                      onClose={e => {
                        e.preventDefault()
                        removeCinemaLimit(id)
                      }}
                      style={{ marginInlineEnd: 0 }}
                    >
                      {cinemaNameMap[id] ?? id}
                    </Tag>
                  ))
                )}
              </div>
              <Button size='small' onClick={openCinemaModal}>
                {common('benefit.button.selectCinema')}
              </Button>
            </div>
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name='limitDimensionTypes'
            label={common('benefit.limit.dimensionType')}
          >
            <Select
              mode='multiple'
              allowClear
              placeholder={common('benefit.limit.unlimited')}
              showSearch
              optionFilterProp='label'
              options={dimensionOptions.map((d: any) => ({
                value: Number(d.code),
                label: d.name
              }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name='limitSpecIds'
            label={common('benefit.detail.specialEffectSessionLimit')}
          >
            <Select
              mode='multiple'
              allowClear
              placeholder={common('benefit.limit.unlimited')}
              showSearch
              optionFilterProp='label'
              options={specOptions.map(s => ({ value: s.id, label: s.name }))}
              filterOption={(input, opt) =>
                (opt?.label ?? '')
                  .toString()
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name='startDate'
            label={common('benefit.table.startDate')}
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name='endDate' label={common('benefit.table.endDate')}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name='orderNum' label={common('benefit.table.orderNum')}>
            <Input type='number' min={0} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  )

  const cinemaModal = (
    <Modal
      title={common('benefit.button.selectCinema')}
      open={cinemaModalOpen}
      onOk={confirmCinemaModal}
      onCancel={() => setCinemaModalOpen(false)}
      width={800}
      maskClosable={false}
      destroyOnClose
      zIndex={1100}
    >
      {cinemaModalOpen ? (
        <>
          <Query
            showClear
            onSearch={() =>
              loadCinemaModalList(
                cinemaModalAreaId,
                cinemaModalSpecId,
                undefined,
                cinemaModalBrandId
              )
            }
            onClear={() => {
              setCinemaModalAreaId([])
              setCinemaModalSpecId(undefined)
              setCinemaModalBrandId(undefined)
              loadCinemaModalList([], undefined, undefined, undefined)
            }}
          >
            <QueryItem label={common('benefit.table.area')}>
              <Cascader
                fieldNames={{ label: 'name', value: 'id' }}
                options={addressTree}
                value={cinemaModalAreaId.length ? cinemaModalAreaId : undefined}
                onChange={(value: (number | null)[] | undefined) => {
                  const ids = (value ?? []).filter((v): v is number => v != null)
                  setCinemaModalAreaId(ids)
                }}
                placeholder={tCinemaDetail('form.areaId.required')}
                style={{ width: '100%' }}
                allowClear
              />
            </QueryItem>
            <QueryItem label={common('benefit.table.brand')}>
              <Select
                allowClear
                placeholder={common('benefit.placeholder.selectBrand')}
                value={cinemaModalBrandId}
                onChange={(value: number | undefined) =>
                  setCinemaModalBrandId(value)
                }
                options={brandOptions.map(b => ({ value: b.id, label: b.name }))}
                style={{ width: '100%' }}
              />
            </QueryItem>
            <QueryItem label={common('benefit.limit.spec')}>
              <Select
                allowClear
                placeholder={common('benefit.placeholder.selectSpec')}
                value={cinemaModalSpecId}
                onChange={(value: number | undefined) => setCinemaModalSpecId(value)}
                options={specOptions.map(s => ({ value: s.id, label: s.name }))}
                style={{ width: '100%' }}
              />
            </QueryItem>
          </Query>
          <Transfer
            dataSource={cinemaTransferData}
            titles={[
              common('benefit.transfer.available'),
              common('benefit.transfer.selected')
            ]}
            showSearch
            filterOption={(input, item) =>
              (item.title ?? '')
                .toLowerCase()
                .includes(input.trim().toLowerCase())
            }
            targetKeys={cinemaModalSelected.map(String)}
            onChange={keys =>
              setCinemaModalSelected((keys as React.Key[]).map(key => Number(key)))
            }
            render={item => item.title ?? ''}
            listStyle={{ width: '50%', height: 360 }}
          />
        </>
      ) : null}
    </Modal>
  )

  const fixedSaveBar = (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 250,
        right: 0,
        zIndex: 100,
        padding: '16px 24px',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 -1px 4px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'flex-end'
        }}
      >
        <CheckPermission code='benefit.save'>
          <Button type='primary' size='large' onClick={handleSavePhase}>
            {common('button.save')}
          </Button>
        </CheckPermission>
      </div>
    </div>
  )

  if (isCreate) {
    return (
      <div style={{ padding: 24, paddingBottom: 80 }}>
        <Button
          type='text'
          icon={<LeftOutlined />}
          onClick={() => router.back()}
          style={{ marginBottom: 16 }}
        >
          {common('benefit.form.backToList')}
        </Button>
        <Card
          title={common('benefit.button.addBenefit')}
          style={{ marginBottom: 24 }}
        >
          {phaseFormContent}
        </Card>
        {fixedSaveBar}
        <MovieModal
          show={movieModalOpen}
          zIndex={1100}
          initialMovieId={createMovie?.id}
          onConfirm={movie => {
            setCreateMovie({ id: movie.id, name: movie.name })
            setMovieModalOpen(false)
          }}
          onCancel={() => setMovieModalOpen(false)}
        />
        {cinemaModal}
      </div>
    )
  }

  return (
    <div style={{ padding: 24, paddingBottom: 80 }}>
      <Button
        type='text'
        icon={<LeftOutlined />}
        onClick={() => router.back()}
        style={{ marginBottom: 16 }}
      >
        {common('benefit.form.backToList')}
      </Button>

      <Card
        title={common('benefit.detail.phaseInfo')}
        style={{ marginBottom: 24 }}
      >
        {phaseFormContent}
      </Card>
      {fixedSaveBar}
      {cinemaModal}
    </div>
  )
}
