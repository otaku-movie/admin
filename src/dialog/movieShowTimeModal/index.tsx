'use client'

import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import {
  Form,
  Modal,
  Steps,
  Button,
  message
} from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import dayjs from 'dayjs'
import { Cinema, theaterHall } from '@/type/api'
import { MovieModal } from '../movieModal'
import { getMovieVersions } from '@/api/request/movie'
import { getPromotionList } from '@/api/request/promotion'
import { useCommonStore } from '@/store/useCommonStore'
import { DictCode } from '@/enum/dict'
import type { MovieShowTimeQuery, MovieShowTimeStepContext } from './types'
import { StepOne } from './steps/StepOne'
import { StepTwo } from './steps/StepTwo'
import { StepThree } from './steps/StepThree'

export interface MovieShowTimeModalProps {
  readonly type: 'create' | 'edit'
  readonly show: boolean
  readonly data: Record<string, unknown>
  readonly fromScreeningManagement?: boolean
  readonly onConfirm?: () => void
  readonly onCancel?: () => void
}

const STEPS = [
  { key: 'one', titleKey: 'showTimeModal.steps.one' },
  { key: 'two', titleKey: 'showTimeModal.steps.two' },
  { key: 'three', titleKey: 'showTimeModal.steps.three' }
]

export default function MovieShowTimeModal(props: MovieShowTimeModalProps) {
  const { t } = useTranslation(navigator.language as languageType, 'showTime')
  const { t: common } = useTranslation(
    navigator.language as languageType,
    'common'
  )
  const commonStore = useCommonStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [movieData, setMovieData] = useState<any[]>([])
  const [specList, setSpecList] = useState<any[]>([])
  const [languageData, setLanguageData] = useState([])
  const [showTimeTagData, setShowTimeTagData] = useState([])
  const [reReleaseData, setReReleaseData] = useState<any[]>([])
  const [movieVersionData, setMovieVersionData] = useState<any[]>([])
  const [cinemaData, setCinemaData] = useState<Cinema[]>([])
  const [theaterHallData, setTheaterHallData] = useState<theaterHall[]>([])
  const [promotionList, setPromotionList] = useState<{ id: number; name: string }[]>([])
  const [form] = Form.useForm()
  const [time, setTime] = useState(0)
  const [query, setQuery] = useState<MovieShowTimeQuery>({
    startTime: undefined,
    endTime: undefined
  })
  const [movieModal, setMovieModal] = useState({ show: false })

  const getMovieData = (name: string = '', id: number | undefined = undefined) => {
    http({
      url: 'movie/list',
      method: 'post',
      data: { id, name, releaseStatus: 2, page: 1, pageSize: 10 }
    }).then((res) => setMovieData(res.data?.list))
  }
  const getTheaterHallData = (id: number) => {
    http({
      url: 'theater/hall/list',
      method: 'post',
      data: { cinemaId: id, page: 1, pageSize: 100 }
    }).then((res) => setTheaterHallData(res.data.list))
  }
  const getLanguageData = (name: string = '', id: number | undefined = undefined) => {
    http({
      url: 'language/list',
      method: 'post',
      data: { name, id }
    }).then((res) => setLanguageData(res.data.list))
  }
  const getShowTimeTagData = (name: string = '', id: number | undefined = undefined) => {
    http({
      url: 'showTimeTag/list',
      method: 'post',
      data: { name, id }
    }).then((res) => setShowTimeTagData(res.data.list))
  }
  const getCinemaData = (name: string = '', id: number | undefined = undefined) => {
    http({
      url: 'cinema/list',
      method: 'post',
      data: { id, name, page: 1, pageSize: 10 }
    }).then((res) => setCinemaData(res.data.list))
  }
  const getCinemaSpec = (cinemaId: number) => {
    http({
      url: 'cinema/spec',
      method: 'get',
      params: { cinemaId }
    }).then((res) => setSpecList(res.data))
  }
  const getPromotionListForCinema = (cinemaId: number) => {
    getPromotionList({ cinemaId, page: 1, pageSize: 100 })
      .then((res) => {
        setPromotionList((res?.list ?? []).map((l) => ({ id: l.id, name: l.name })))
      })
      .catch(() => setPromotionList([]))
  }
  const getReReleaseData = (movieId?: number) => {
    if (!movieId) {
      setReReleaseData([])
      return
    }
    http({
      url: 'movie/reRelease/list',
      method: 'post',
      data: { movieId, page: 1, pageSize: 100 }
    })
      .then((res) => setReReleaseData(res.data?.list || []))
      .catch(() => setReReleaseData([]))
  }
  const getMovieVersionData = async (movieId?: number) => {
    if (!movieId) {
      setMovieVersionData([])
      return
    }
    try {
      const res = await getMovieVersions(movieId)
      const versionList = (res?.data as unknown as any[]) || []
      const dictList = commonStore.dict?.[DictCode.DUBBING_VERSION] || []
      if (versionList.length > 0) {
        const versions = versionList.map((version: any) => {
          const dictItem = dictList.find((d: any) => d.code === version.versionCode)
          return {
            id: version.id,
            versionCode: version.versionCode,
            name: dictItem?.name,
            languageId: version.languageId,
            startDate: version.startDate,
            endDate: version.endDate
          }
        })
        setMovieVersionData(versions)
      } else {
        setMovieVersionData([])
      }
    } catch (error) {
      console.error('Failed to get movie versions:', error)
      setMovieVersionData([])
    }
  }

  useEffect(() => {
    if (props.show) {
      form.resetFields()
      setCurrentStep(0)
    }
    if (props.show && !props.data.id) {
      getMovieData()
      getCinemaData()
      getLanguageData()
      getShowTimeTagData()
    }
    if (props.data.id) {
      const rawDimensionType = Array.isArray(props.data.dimensionType)
        ? (props.data.dimensionType as number[])[0]
        : (props.data.dimensionType as number | undefined)
      const dimensionDictList = commonStore.dict?.[DictCode.DIMENSION_TYPE] || []
      const dimensionItem = dimensionDictList.find(
        (d: any) =>
          Number(d.id) === Number(rawDimensionType) ||
          Number(d.code) === Number(rawDimensionType)
      )
      const dimensionType = dimensionItem != null ? dimensionItem.code : rawDimensionType
      const updatedData: MovieShowTimeQuery = {
        ...props.data,
        movieShowTimeTagId: props.data.movieShowTimeTagsId as number[],
        dimensionType,
        specIds:
          (props.data.specIds as number[] | undefined) ??
          (Array.isArray(props.data.specId)
            ? (props.data.specId as number[])
            : props.data.specId != null
              ? [props.data.specId as number]
              : []),
        startTime: dayjs(props.data.startTime as string),
        endTime: dayjs(props.data.endTime as string),
        screeningDate: (() => {
          const st = dayjs(props.data.startTime as string)
          return st.hour() >= 6 ? st.startOf('day') : st.subtract(1, 'day').startOf('day')
        })(),
        pricingMode: props.data.pricingMode != null ? Number(props.data.pricingMode) : undefined,
        activityId: props.data.activityId != null ? Number(props.data.activityId) : undefined,
        fixedAmount: props.data.fixedAmount != null ? Number(props.data.fixedAmount) : undefined,
        surcharge: props.data.surcharge != null ? Number(props.data.surcharge) : undefined,
        allowPresale: props.data.allowPresale === true
      } as MovieShowTimeQuery
      setQuery(updatedData)
      form.setFieldsValue(updatedData)
      getTheaterHallData(props.data.cinemaId as number)
      getMovieData('', props.data.movieId as number)
      getCinemaData('', props.data.cinemaId as number)
      setShowTimeTagData(props.data.movieShowTimeTags as [])
      setLanguageData(props.data.subtitle as [])
      if (props.data.movieId) {
        getReReleaseData(props.data.movieId as number)
        getMovieVersionData(props.data.movieId as number)
      }
    } else {
      setQuery({})
      form.setFieldsValue({})
    }
    if (props.data.cinemaId) {
      setQuery((prev) => ({ ...prev, cinemaId: props.data.cinemaId as number }))
      getCinemaSpec(props.data.cinemaId as number)
      getPromotionListForCinema(props.data.cinemaId as number)
      getCinemaData('', props.data.cinemaId as number)
      getTheaterHallData(props.data.cinemaId as number)
    }
  }, [props.show, props.data])

  const doSubmit = () => {
    const dimensionDictList = commonStore.dict?.[DictCode.DIMENSION_TYPE] || []
    const dimensionItem = dimensionDictList.find(
      (d: any) => Number(d.code) === Number(query.dimensionType)
    )
    const dimensionTypeIdForApi = dimensionItem?.id ?? query.dimensionType
    http({
      url: 'admin/movie_show_time/save',
      method: 'post',
      data: {
        ...query,
        showTimeTagId: query.movieShowTimeTagId,
        dimensionType: dimensionTypeIdForApi,
        specIds: query.specIds,
        specId: query.specIds?.[0],
        startTime: query.startTime?.format('YYYY-MM-DD HH:mm:ss'),
        endTime: query.endTime?.format('YYYY-MM-DD HH:mm:ss'),
        price: query.price,
        reReleaseId: query.reReleaseId,
        movieVersionId: query.movieVersionId,
        pricingMode: query.pricingMode,
        activityId: query.activityId,
        fixedAmount: query.fixedAmount,
        surcharge: query.surcharge,
        allowPresale: query.allowPresale
      }
    }).then(() => {
      message.success(common('message.save'))
      props.onConfirm?.()
    })
  }

  const handleOk = () => {
    if (currentStep < 2) {
      setCurrentStep((s) => s + 1)
      return
    }
    form.validateFields().then(() => doSubmit())
  }

  const stepContext: MovieShowTimeStepContext = {
    query,
    setQuery,
    form,
    t,
    common,
    fromScreeningManagement: props.fromScreeningManagement,
    movieData,
    languageData,
    showTimeTagData,
    cinemaData,
    theaterHallData,
    specList,
    promotionList,
    reReleaseData,
    movieVersionData,
    getMovieData,
    getLanguageData,
    getShowTimeTagData,
    getTheaterHallData,
    getCinemaData,
    getCinemaSpec,
    getPromotionListForCinema,
    getReReleaseData,
    getMovieVersionData,
    setMovieModal,
    time,
    setTime,
    timeDisplayMode: '24h'
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepOne ctx={stepContext} />
      case 1:
        return <StepTwo ctx={stepContext} />
      case 2:
        return <StepThree ctx={stepContext} />
      default:
        return null
    }
  }

  return (
    <>
      <Modal
        title={
          props.type === 'edit'
            ? t('showTimeModal.title.edit')
            : t('showTimeModal.title.create')
        }
        width={900}
        open={props.show}
        maskClosable={false}
        onCancel={props?.onCancel}
        footer={[
          currentStep > 0 ? (
            <Button key="prev" onClick={() => setCurrentStep((s) => s - 1)}>
              {common('button.prev')}
            </Button>
          ) : null,
          <Button key="cancel" onClick={props?.onCancel}>
            {common('button.cancel')}
          </Button>,
          <Button key="next" type="primary" onClick={handleOk}>
            {currentStep < 2 ? common('button.next') : common('button.save')}
          </Button>
        ]}
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {STEPS.map((s, i) => (
            <Steps.Step key={s.key} title={t(s.titleKey)} />
          ))}
        </Steps>
        <Form
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          initialValues={{ remember: true }}
          autoComplete="off"
          form={form}
        >
          {renderStep()}
        </Form>
      </Modal>
      <MovieModal
        show={movieModal.show}
        data={{}}
        onCancel={() => setMovieModal({ show: false })}
        onConfirm={(movie) => {
          setQuery((q) => ({ ...q, movieId: movie.id }))
          form.setFieldValue('movieId', movie.id)
          http({
            url: 'movie/detail',
            method: 'get',
            params: { id: movie.id }
          }).then((res) => {
            if (res.data.time) setTime(res.data.time)
            getMovieVersionData(movie.id)
          })
          getReReleaseData(movie.id)
          setMovieModal({ show: false })
        }}
      />
    </>
  )
}
