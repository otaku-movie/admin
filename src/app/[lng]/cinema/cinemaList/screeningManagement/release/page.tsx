'use client'

/**
 * 发布场次页：四步流程（基础信息 → 定时公开与开放购票 → 定价 → 预览确认），提交 admin/movie_show_time/save
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Form,
  Steps,
  Button,
  message,
  Typography,
  Spin
} from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import { useTranslation } from '@/app/i18n/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageProps } from '@/app/[lng]/layout'
import http from '@/api'
import { getMovieVersions } from '@/api/request/movie'
import { useCommonStore } from '@/store/useCommonStore'
import { DictCode } from '@/enum/dict'
import { MovieModal } from '@/dialog/movieModal'
import { processPath } from '@/config/router'
import dayjs from 'dayjs'
import type { ReleaseFormState, PromotionWithRules } from './types'
import { PRICING_MODE_NONE } from './types'
import { Step1Basic } from './steps/Step1Basic'
import { Step2Publish } from './steps/Step2Publish'
import { Step3Pricing } from './steps/Step3Pricing'
import { Step4Preview } from './steps/Step4Preview'

const STEP_ITEMS = [
  { key: '1', titleKey: 'releasePage.step1.title' },
  { key: '2', titleKey: 'releasePage.step2.title' },
  { key: '3', titleKey: 'releasePage.step3.title' },
  { key: '4', titleKey: 'releasePage.step4.title' }
]

export default function ReleaseShowTimePage({ params: { lng } }: Readonly<PageProps>) {
  const { t } = useTranslation(lng as 'zh-CN' | 'ja' | 'en-US', 'showTime')
  const { t: common } = useTranslation(lng as 'zh-CN' | 'ja' | 'en-US', 'common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const cinemaIdParam = searchParams.get('id') ?? searchParams.get('cinemaId')
  const cinemaId = cinemaIdParam ? Number(cinemaIdParam) : undefined
  const showTimeIdParam = searchParams.get('showTimeId')
  const showTimeId = showTimeIdParam ? Number(showTimeIdParam) : undefined

  const commonStore = useCommonStore()

  const [currentStep, setCurrentStep] = useState(0)
  const [formState, setFormState] = useState<ReleaseFormState>({ open: true, allowPresale: true })
  const [movieModalOpen, setMovieModalOpen] = useState(false)
  const [movieData, setMovieData] = useState<{ id: number; name: string }[]>([])
  const [theaterHallData, setTheaterHallData] = useState<{ id: number; name: string; cinemaSpecName?: string }[]>([])
  const [languageData, setLanguageData] = useState<{ id: number; name: string }[]>([])
  const [movieVersionData, setMovieVersionData] = useState<any[]>([])
  const [specList, setSpecList] = useState<{ id: number; name: string; cinemaSpecName?: string }[]>([])
  const [showTimeTagData, setShowTimeTagData] = useState<{ id: number; name: string }[]>([])
  const [promotionList, setPromotionList] = useState<PromotionWithRules[]>([])
  const [movieDuration, setMovieDuration] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [form] = Form.useForm()

  /** 拉取影院下的放映规格列表，供 Step1 放映规格多选 */
  const getCinemaSpec = (cid: number) => {
    http({
      url: 'cinema/spec',
      method: 'get',
      params: { cinemaId: cid }
    }).then((res) => setSpecList(res.data ?? []))
  }

  /** 影院选定后拉取影厅、促销、放映规格 */
  useEffect(() => {
    if (cinemaId) {
      setFormState((prev) => ({ ...prev, cinemaId }))
      http({
        url: 'theater/hall/list',
        method: 'post',
        data: { cinemaId, page: 1, pageSize: 100 }
      }).then((res) => setTheaterHallData(res.data?.list ?? []))
      getPromotionListForCinema(cinemaId)
      getCinemaSpec(cinemaId)
    }
  }, [cinemaId])

  /** 编辑场次：有 showTimeId 时拉取详情并回填表单 */
  useEffect(() => {
    if (!cinemaId || !showTimeId || Number.isNaN(showTimeId)) return
    setLoadingDetail(true)
    http({
      url: 'movie_show_time/detail',
      method: 'get',
      params: { id: showTimeId }
    })
      .then((res: any) => {
        const d = res.data
        if (!d) {
          setLoadingDetail(false)
          return
        }
        const start = d.startTime ? dayjs(d.startTime) : undefined
        const end = d.endTime ? dayjs(d.endTime) : undefined
        const screeningDate = start ? start.startOf('day') : undefined
        const publishAt = d.publishAt ? dayjs(d.publishAt) : undefined
        const saleOpenAt = d.saleOpenAt ? dayjs(d.saleOpenAt) : undefined
        const overrides = d.ticketTypeOverrides
          ? Object.fromEntries(
              Object.entries(d.ticketTypeOverrides).map(([k, v]) => [Number(k), Number(v)])
            )
          : undefined
        const enabled = d.ticketTypeEnabled
          ? Object.fromEntries(
              Object.entries(d.ticketTypeEnabled).map(([k, v]) => [Number(k), Boolean(v)])
            )
          : undefined
        setFormState((prev) => ({
          ...prev,
          id: d.id,
          cinemaId: d.cinemaId ?? cinemaId,
          movieId: d.movieId,
          movieName: d.movieName,
          theaterHallId: d.theaterHallId,
          screeningDate,
          startTime: start,
          endTime: end,
          dimensionType: d.dimensionType != null ? Number(d.dimensionType) : undefined,
          subtitleId: Array.isArray(d.subtitleId) ? d.subtitleId : undefined,
          specIds: Array.isArray(d.specIds) ? d.specIds : undefined,
          showTimeTagId: Array.isArray(d.movieShowTimeTagsId) ? d.movieShowTimeTagsId : undefined,
          movieVersionId: d.movieVersionId,
          open: d.open !== false,
          publishMode: d.publishAt ? 'scheduled' : 'immediate',
          publishAt: publishAt ?? undefined,
          enableSaleOpenAt: !!d.saleOpenAt,
          saleOpenAt: saleOpenAt ?? undefined,
          pricingMode: d.pricingMode != null ? Number(d.pricingMode) : undefined,
          fixedAmount: d.fixedAmount != null ? Number(d.fixedAmount) : undefined,
          surcharge: d.surcharge != null ? Number(d.surcharge) : undefined,
          allowPresale: d.allowPresale !== false,
          ticketTypeOverrides: overrides,
          ticketTypeEnabled: enabled
        }))
        if (d.movieId) {
          http({ url: 'movie/detail', method: 'get', params: { id: d.movieId } }).then((movieRes: any) => {
            if (movieRes.data?.time) setMovieDuration(Number(movieRes.data.time))
          })
          getMovieVersionData(d.movieId)
        }
        getMovieData()
        setLoadingDetail(false)
      })
      .catch(() => setLoadingDetail(false))
  }, [cinemaId, showTimeId])

  const getMovieData = () => {
    http({
      url: 'movie/list',
      method: 'post',
      data: { releaseStatus: 2, page: 1, pageSize: 50 }
    }).then((res) => setMovieData(res.data?.list ?? []))
  }

  const getShowTimeTagData = () => {
    http({
      url: 'showTimeTag/list',
      method: 'post',
      data: { page: 1, pageSize: 200 }
    }).then((res) => setShowTimeTagData(res.data?.list ?? []))
  }

  const getLanguageData = () => {
    http({
      url: 'language/list',
      method: 'post',
      data: {}
    }).then((res) => setLanguageData(res.data?.list ?? []))
  }

  const getMovieVersionData = async (movieId?: number) => {
    if (!movieId) {
      setMovieVersionData([])
      return
    }
    try {
      const res = await getMovieVersions(movieId)
      const list = (res?.data as unknown as any[]) ?? []
      const dictList = commonStore.dict?.[DictCode.DUBBING_VERSION] ?? []
      const versions = list.map((v: any) => {
        const dictItem = dictList.find((d: any) => d.code === v.versionCode)
        return {
          id: v.id,
          name: dictItem?.name ?? v.versionCode,
          startDate: v.startDate,
          endDate: v.endDate
        }
      })
      setMovieVersionData(versions)
    } catch {
      setMovieVersionData([])
    }
  }

  /** 拉取影院活动规则列表，用 useCallback 稳定引用，避免 Step3 内 useEffect 无限触发 */
  const getPromotionListForCinema = useCallback((cid: number) => {
    http({
      url: '/admin/promotion/list',
      method: 'post',
      data: { cinemaId: cid, page: 1, pageSize: 100 }
    })
      .then((res: any) => setPromotionList(res?.data?.list ?? res?.list ?? []))
      .catch(() => setPromotionList([]))
  }, [])

  /** 当前步点击「下一步」前的校验：Step0 必填 + 结束≥开始 + 间隔≥电影时长 + 2D/3D 必选 */
  const validateStep = (step: number): boolean => {
    if (step === 0) {
      if (!formState.movieId) {
        message.warning(t('showTimeModal.form.movie.required'))
        return false
      }
      if (!formState.screeningDate) {
        message.warning(t('showTimeModal.form.showTime.required'))
        return false
      }
      if (!formState.theaterHallId) {
        message.warning(t('showTimeModal.form.theaterHall.required'))
        return false
      }
      if (!formState.startTime) {
        message.warning(t('showTimeModal.form.showTime.required'))
        return false
      }
      if (!formState.endTime) {
        message.warning(t('showTimeModal.form.showTime.required'))
        return false
      }
      if (formState.endTime && formState.startTime && !formState.endTime.isAfter(formState.startTime)) {
        message.warning(t('showTimeModal.form.showTime.startAfterEnd'))
        return false
      }
      if (
        formState.endTime &&
        formState.startTime &&
        movieDuration > 0 &&
        formState.endTime.diff(formState.startTime, 'minute') < movieDuration
      ) {
        message.warning(t('showTimeModal.form.showTime.endBeforeMovieDuration'))
        return false
      }
      if (formState.dimensionType == null) {
        message.warning(t('showTimeModal.form.dimension.required'))
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) return
    if (currentStep < 3) setCurrentStep((s) => s + 1)
  }

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1)
  }

  /** 提交场次：startTime/endTime 转 24h 字符串，dimensionType 传字典 code（1=2D 2=3D），与 DB/App 约定一致 */
  const handleSubmit = () => {
    if (!cinemaId || !formState.movieId || !formState.theaterHallId || !formState.screeningDate || !formState.startTime || !formState.endTime) {
      message.warning(t('showTimeModal.form.showTime.required'))
      return
    }
    const startDateTime = formState.startTime!
    const endDateTime = formState.endTime!
    if (endDateTime.isBefore(startDateTime) || endDateTime.isSame(startDateTime)) {
      message.warning(t('showTimeModal.form.showTime.startAfterEnd'))
      return
    }
    if (movieDuration > 0 && endDateTime.diff(startDateTime, 'minute') < movieDuration) {
      message.warning(t('showTimeModal.form.showTime.endBeforeMovieDuration'))
      return
    }

    const dimensionDictList = commonStore.dict?.[DictCode.DIMENSION_TYPE] || []
    const dimensionTypeCode = formState.dimensionType != null
      ? Number(formState.dimensionType)
      : dimensionDictList[0] != null ? Number(dimensionDictList[0].code) : undefined

    setSubmitting(true)
    http({
      url: 'admin/movie_show_time/save',
      method: 'post',
      data: {
        ...(formState.id != null ? { id: formState.id } : {}),
        cinemaId,
        movieId: formState.movieId,
        theaterHallId: formState.theaterHallId,
        startTime: startDateTime.format('YYYY-MM-DD HH:mm:ss'),
        endTime: endDateTime.format('YYYY-MM-DD HH:mm:ss'),
        dimensionType: dimensionTypeCode,
        open: formState.open !== false,
        publishAt: formState.publishMode === 'scheduled' && formState.publishAt
          ? formState.publishAt.format('YYYY-MM-DD HH:mm:ss')
          : undefined,
        saleOpenAt: formState.enableSaleOpenAt !== false && formState.saleOpenAt
          ? formState.saleOpenAt.format('YYYY-MM-DD HH:mm:ss')
          : undefined,
        pricingMode: formState.pricingMode ?? PRICING_MODE_NONE,
        activityId: undefined,
        activityIds: undefined,
        fixedAmount: formState.fixedAmount,
        surcharge: formState.surcharge,
        allowPresale: formState.allowPresale !== false,
        subtitleId: formState.subtitleId,
        movieVersionId: formState.movieVersionId,
        specIds: formState.specIds,
        specId: formState.specIds?.[0],
        showTimeTagId: formState.showTimeTagId,
        ticketTypeOverrides:
          formState.pricingMode === PRICING_MODE_NONE && formState.ticketTypeOverrides
            ? formState.ticketTypeOverrides
            : undefined,
        ticketTypeEnabled:
          formState.pricingMode === PRICING_MODE_NONE && formState.ticketTypeEnabled
            ? formState.ticketTypeEnabled
            : undefined
      }
    })
      .then(() => {
        message.success(common('message.save'))
        router.push(processPath({ name: 'screeningManagement', query: { id: cinemaId } }))
      })
      .finally(() => setSubmitting(false))
  }

  const onMovieSelect = (movie: { id: number; name: string }) => {
    setFormState((prev) => ({ ...prev, movieId: movie.id, movieName: movie.name }))
    form.setFieldValue('movieId', movie.id)
    http({ url: 'movie/detail', method: 'get', params: { id: movie.id } }).then((res) => {
      if (res.data?.time) setMovieDuration(Number(res.data.time))
      getMovieVersionData(movie.id)
    })
    setMovieModalOpen(false)
  }

  if (cinemaId == null || Number.isNaN(cinemaId)) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
        <Button type="text" icon={<LeftOutlined />} onClick={() => router.back()} style={{ marginBottom: 16 }}>
          {common('button.cancel')}
        </Button>
        <Typography.Paragraph type="secondary">{t('showTimeModal.form.cinema.required')}</Typography.Paragraph>
      </div>
    )
  }

  if (loadingDetail) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
        <Button type="text" icon={<LeftOutlined />} onClick={() => router.back()} style={{ marginBottom: 16 }}>
          {common('button.cancel')}
        </Button>
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
          <Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>
            {common('message.loading') || '加载中…'}
          </Typography.Paragraph>
        </div>
      </div>
    )
  }

  /** 多选活动名称，用于预览展示 */
  const activityNames =
    formState.activityIds?.length
      ? formState.activityIds
          .map((id) => promotionList.find((p) => p.id === id)?.name)
          .filter(Boolean)
          .join('、') ?? undefined
      : undefined
  const dimensionLabel =
    formState.dimensionType != null
      ? commonStore.dict?.[DictCode.DIMENSION_TYPE]?.find(
          (d: any) => Number(d.code) === Number(formState.dimensionType)
        )?.name
      : undefined

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <Button
        type="text"
        icon={<LeftOutlined />}
        onClick={() => router.back()}
        style={{ marginBottom: 16 }}
      >
        {common('button.cancel')}
      </Button>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>
        {t('releasePage.pageTitle')}
      </Typography.Title>

      <Steps
        current={currentStep}
        onChange={(step) => setCurrentStep(step)}
        style={{ marginBottom: 32 }}
      >
        {STEP_ITEMS.map((s) => (
          <Steps.Step key={s.key} title={t(s.titleKey)} />
        ))}
      </Steps>

      <Form form={form} layout="vertical" initialValues={formState}>
        {currentStep === 0 && (
          <Step1Basic
            form={formState}
            setForm={setFormState}
            t={t}
            common={common}
            movieData={movieData}
            theaterHallData={theaterHallData}
            movieVersionData={movieVersionData}
            specList={specList}
            languageData={languageData}
            showTimeTagData={showTimeTagData}
            movieDuration={movieDuration}
            timeDisplayMode="30h"
            baseDate={formState.screeningDate}
            onSelectMovie={() => {
              getMovieData()
              setMovieModalOpen(true)
            }}
            getMovieVersionData={getMovieVersionData}
            getLanguageData={getLanguageData}
            getShowTimeTagData={getShowTimeTagData}
          />
        )}
        {currentStep === 1 && (
          <Step2Publish
            form={formState}
            setForm={setFormState}
            t={t}
            common={common}
            timeDisplayMode="30h"
            baseDate={formState.screeningDate}
          />
        )}
        {currentStep === 2 && (
          <Step3Pricing
            form={formState}
            setForm={setFormState}
            t={t}
            common={common}
          />
        )}
        {currentStep === 3 && (
          <Step4Preview
            form={formState}
            t={t}
            common={common}
            movieData={movieData}
            theaterHallData={theaterHallData}
            languageData={languageData}
            movieVersionData={movieVersionData}
            specList={specList}
            showTimeTagData={showTimeTagData}
            activityName={activityNames}
            dimensionLabel={dimensionLabel}
          />
        )}
      </Form>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={handlePrev} disabled={currentStep === 0}>
          {common('button.prev')}
        </Button>
        {currentStep < 3 ? (
          <Button type="primary" onClick={handleNext}>
            {common('button.next')}
          </Button>
        ) : (
          <Button type="primary" loading={submitting} onClick={handleSubmit}>
            {t('releasePage.step4.confirmPublish')}
          </Button>
        )}
      </div>

      <MovieModal
        show={movieModalOpen}
        data={{}}
        onCancel={() => setMovieModalOpen(false)}
        onConfirm={onMovieSelect}
      />
    </div>
  )
}
