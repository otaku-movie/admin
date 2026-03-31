'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Button, Form, Spin, Steps, Typography, message } from 'antd'
import dayjs from 'dayjs'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '@/app/[lng]/layout'
import type {
  PresaleTicket,
  PresaleSpecification,
  MubitikeTicketType
} from '@/store/usePricingStrategyStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { MovieModal } from '@/dialog/movieModal'
import type { Movie } from '@/type/api'
import {
  getPresaleDetail,
  savePresale,
  buildPresaleSaveBody
} from '@/api/request/presale'
import {
  TICKET_TO_DELIVERY,
  type PresaleFormValues,
  type SpecificationFormItem
} from './types'
import { StepMedia } from './steps/one'
import { StepBasic } from './steps/two'
import { StepSpecifications } from './steps/three'
import { StepUsage } from './steps/four'
import { StepExtra } from './steps/five'

const { Title } = Typography

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

  const idParam = searchParams.get('id')
  const editingId = useMemo(() => {
    if (!idParam) return undefined
    const idNum = Number(idParam)
    return Number.isNaN(idNum) ? undefined : idNum
  }, [idParam])
  const isEditing = editingId !== undefined

  const [editingTicket, setEditingTicket] = useState<PresaleTicket | undefined>(undefined)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailFetched, setDetailFetched] = useState(false)

  const [form] = Form.useForm<PresaleFormValues>()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [movieModalOpen, setMovieModalOpen] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<{
    value: number
    label: string
    startDate?: string
    endDate?: string
  } | null>(null)

  useEffect(() => {
    if (!isEditing || editingId == null) {
      setDetailFetched(true)
      if (!isEditing) setEditingTicket(undefined)
      return
    }
    setDetailLoading(true)
    setDetailFetched(false)
    getPresaleDetail(editingId)
      .then((data) => {
        setEditingTicket(data ?? undefined)
      })
      .catch(() => {
        setEditingTicket(undefined)
      })
      .finally(() => {
        setDetailLoading(false)
        setDetailFetched(true)
      })
  }, [isEditing, editingId])

  useEffect(() => {
    if (isEditing && editingTicket) {
      const specifications =
        editingTicket.specifications && editingTicket.specifications.length > 0
          ? editingTicket.specifications.map((spec) => ({
              ...spec,
              deliveryType:
                spec.deliveryType ?? editingTicket.deliveryType ?? 'virtual',
              bonusIncluded: spec.bonusIncluded !== false,
              priceItems:
                Array.isArray(spec.priceItems) && spec.priceItems.length > 0
                  ? spec.priceItems.map((pi) => ({
                      label: typeof (pi as { label?: string })?.label === 'string' ? (pi as { label: string }).label : '',
                      price: typeof (pi as { price?: number })?.price === 'number' ? (pi as { price: number }).price : undefined
                    }))
                  : [{ label: '', price: undefined }],
              images: (spec.images?.length ?? 0) > 0 ? spec.images : []
            }))
          : [
              {
                deliveryType: editingTicket.deliveryType ?? 'virtual',
                bonusIncluded: true,
                priceItems: [{ label: '', price: undefined }]
              }
            ]
      form.setFieldsValue({
        code: editingTicket.code,
        title: editingTicket.title,
        type: 'presale',
        deliveryType: editingTicket.deliveryType,
        discountMode: editingTicket.discountMode,
        mubitikeType: editingTicket.mubitikeType,
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
        perUserLimit: editingTicket.perUserLimit === 0 ? undefined : editingTicket.perUserLimit,
        pickupNotes: editingTicket.pickupNotes,
        movieId: editingTicket.movieIds?.[0],
        cover: editingTicket.cover || undefined,
        gallery: editingTicket.gallery || [],
        specifications
      })
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
        specifications: [{ deliveryType: 'virtual', bonusIncluded: true, priceItems: [{ label: '', price: undefined }] }]
      })
      setSelectedMovie(null)
    }
  }, [editingTicket, form, isEditing])

  useEffect(() => {
    if (detailFetched && isEditing && idParam && editingTicket == null) {
      message.warning(t('presale.message.deleteConfirm'))
      router.replace(`/${lng}/pricingStrategy/presale`)
    }
  }, [detailFetched, editingTicket, idParam, isEditing, lng, router, t])

  // 结束发售时间 = 影院上映前一天；使用开始 = 上映当天；使用结束 = 上映结束（有 endDate 用 endDate，否则上映+60天）
  useEffect(() => {
    if (!selectedMovie?.startDate) return
    const release = dayjs(selectedMovie.startDate)
    if (!release.isValid()) return
    const endOfSale = release
      .subtract(1, 'day')
      .set('hour', 23)
      .set('minute', 59)
      .set('second', 59)
    const currentEnd = form.getFieldValue('endTime') as dayjs.Dayjs | undefined
    if (!currentEnd || !currentEnd.isSame(endOfSale)) {
      form.setFieldsValue({ endTime: endOfSale })
    }
    const usageStartDay = release.startOf('day')
    const currentUsageStart = form.getFieldValue('usageStart') as
      | dayjs.Dayjs
      | undefined
    if (!currentUsageStart) {
      form.setFieldsValue({ usageStart: usageStartDay })
    }
    const usageEndDay = selectedMovie.endDate
      ? dayjs(selectedMovie.endDate).endOf('day')
      : release.add(60, 'day').endOf('day')
    const currentUsageEnd = form.getFieldValue('usageEnd') as
      | dayjs.Dayjs
      | undefined
    if (!currentUsageEnd) {
      form.setFieldsValue({ usageEnd: usageEndDay })
    }
  }, [form, selectedMovie])

  const handleBack = () => {
    form.resetFields()
    router.back()
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const values = form.getFieldsValue(true) as PresaleFormValues
        const galleryValues = (values.gallery ?? []).filter(Boolean)
        const normalizedSpecifications: PresaleSpecification[] = (
          values.specifications ?? []
        )
          .filter((item): item is SpecificationFormItem => !!item)
          .map((item) => {
            const priceItems = (item.priceItems ?? [])
              .map((pi) => {
                const label = typeof pi?.label === 'string' ? pi.label.trim() : ''
                const rawPrice = (pi as { price?: unknown })?.price
                const price =
                  typeof rawPrice === 'number' && !Number.isNaN(rawPrice)
                    ? rawPrice
                    : Number(rawPrice)
                return { label, price }
              })
              .filter(
                (pi): pi is { label: string; price: number } =>
                  pi.label.length > 0 &&
                  typeof pi.price === 'number' &&
                  !Number.isNaN(pi.price) &&
                  pi.price >= 0
              )
            const mainPrice = priceItems.length > 0 ? priceItems[0]!.price : 0
            return {
            id: item.id,
            name: item.name?.trim() || undefined,

            ticketType: item.ticketType,
            deliveryType:
              TICKET_TO_DELIVERY[item.ticketType ?? 'online'] ?? 'virtual',
            price: mainPrice,
            priceItems,
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
            images: Array.isArray(item.images)
              ? item.images.filter(Boolean).map((u) => String(u).trim())
              : undefined,
            bonusTitle: item.bonusTitle?.trim() || undefined,
            bonusImages: Array.isArray(item.bonusImages) ? item.bonusImages.filter(Boolean) : undefined,
            bonusDescription: item.bonusDescription?.trim() || undefined,
            bonusQuantity: item.bonusQuantity ?? undefined,
            bonusIncluded: item.bonusIncluded !== false
          }})

        if (normalizedSpecifications.length === 0) {
          message.error(t('presale.form.specifications.required'))
          setLoading(false)
          return
        }

        const totalQuantity = normalizedSpecifications
          .filter((s) => s.deliveryType === 'physical')
          .reduce((sum, s) => sum + (s.stock ?? 0), 0)

        const deliveryType =
          (normalizedSpecifications[0]?.deliveryType ||
            'virtual') as PresaleTicket['deliveryType']
        const mubitikeType =
          (normalizedSpecifications[0]?.ticketType ??
            editingTicket?.mubitikeType ??
            'online') as MubitikeTicketType
        const saveBody = buildPresaleSaveBody({
          id: isEditing && editingTicket ? editingTicket.id : undefined,
          code:
            isEditing && editingTicket
              ? values.code || editingTicket.code
              : values.code || undefined,
          title:
            values.title?.trim() ||
            editingTicket?.title ||
            t('presale.form.title.fallback'),
          deliveryType,
          discountMode: (values.discountMode || 'fixed') as PresaleTicket['discountMode'],
          mubitikeType,
          amount: values.amount,
          totalQuantity,
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
          perUserLimit: values.perUserLimit != null ? Number(values.perUserLimit) : 0,
          movieId: selectedMovie?.value,
          pickupNotes: values.pickupNotes?.trim(),
          cover: values.cover,
          gallery: galleryValues,
          specifications: normalizedSpecifications.map((s) => ({
            id:
              typeof s.id === 'number'
                ? s.id
                : typeof s.id === 'string' && /^\d+$/.test(s.id)
                  ? Number(s.id)
                  : undefined,
            name: s.name,

            ticketType: s.ticketType as MubitikeTicketType | undefined,
            deliveryType: (s.deliveryType ?? deliveryType) as PresaleTicket['deliveryType'],
            priceItems: s.priceItems,
            stock: s.stock,
            points: s.points,
            shipDays: s.shipDays,
            images: Array.isArray(s.images) ? s.images.filter(Boolean) : undefined,
            bonusTitle: s.bonusTitle,
            bonusImages: s.bonusImages,
            bonusDescription: s.bonusDescription,
            bonusQuantity: s.bonusQuantity,
            bonusIncluded: s.bonusIncluded !== false
          }))
        })
        await savePresale(saveBody)
        message.success(t('presale.message.saveSuccess'))
        handleBack()
    } catch (err) {
      console.error('Save presale failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Spin spinning={detailLoading}>
      <section
        style={{
          padding: '0 24px 100px',
          maxWidth: 960,
          margin: '0 auto',
          minHeight: '100%'
        }}
      >
        <header style={{ marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>{t('tabs.presale')}</Title>
        </header>
        <Form form={form} layout="vertical">
        <Steps
          current={currentStep}
          onChange={setCurrentStep}
          style={{ marginBottom: 24 }}
          items={[
            { title: t('presale.form.steps.media') },
            { title: t('presale.form.steps.basic') },
            { title: t('presale.form.steps.specifications') },
            { title: t('presale.form.steps.usage') },
            { title: t('presale.form.steps.extra') }
          ]}
        />
        <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
          <StepMedia form={form} t={t} common={common} />
        </div>
        <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
          <StepBasic
            form={form}
            t={t}
            common={common}
            selectedMovieLabel={selectedMovie?.label ?? ''}
            onOpenMovieModal={() => setMovieModalOpen(true)}
          />
        </div>
        <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
          <StepSpecifications form={form} t={t} common={common} />
        </div>
        <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
          <StepUsage form={form} t={t} common={common} />
        </div>
        <div style={{ display: currentStep === 4 ? 'block' : 'none' }}>
          <StepExtra form={form} t={t} common={common} />
        </div>
      </Form>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          padding: '16px 24px',
          background: 'rgba(255, 255, 255, 0.98)',
          borderTop: '1px solid #f0f0f0',
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.06)'
        }}
      >
        <Button onClick={handleBack}>{common('button.cancel')}</Button>
        {currentStep > 0 && (
          <Button onClick={() => setCurrentStep(currentStep - 1)}>
            {t('presale.form.steps.prev')}
          </Button>
        )}
        {currentStep < 4 ? (
          <Button
            type="primary"
            onClick={() => setCurrentStep(currentStep + 1)}
          >
            {t('presale.form.steps.next')}
          </Button>
        ) : (
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            {common('button.save')}
          </Button>
        )}
      </div>
      <MovieModal
        show={movieModalOpen}
        data={{}}
        initialMovieId={selectedMovie?.value}
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
            startDate: movie.startDate,
            endDate: movie.endDate
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
              const usageEnd = movie.endDate
                ? dayjs(movie.endDate).endOf('day')
                : release.add(60, 'day').endOf('day')
              form.setFieldsValue({
                usageStart: release.startOf('day'),
                usageEnd
              })
            }
          }
        }}
      />
      </section>
    </Spin>
  )
}
