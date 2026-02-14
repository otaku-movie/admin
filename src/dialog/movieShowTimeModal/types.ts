import type { Dispatch, SetStateAction } from 'react'
import type { FormInstance } from 'antd'
import type { Dayjs } from 'dayjs'

export interface MovieShowTimeQuery {
  id?: number
  movieId?: number
  cinemaId?: number
  open?: boolean
  theaterHallId?: number
  specIds?: number[]
  dimensionType?: number
  /** 放映日期（StepThree 日期选择） */
  screeningDate?: Dayjs
  startTime?: Dayjs
  endTime?: Dayjs
  subtitleId?: number[]
  movieShowTimeTagId?: number[]
  price?: number
  reReleaseId?: number
  movieVersionId?: number
  pricingMode?: number
  activityId?: number
  fixedAmount?: number
  surcharge?: number
  allowPresale?: boolean
}

export interface CinemaItem {
  id: number
  name: string
}

export interface TheaterHallItem {
  id: number
  name: string
  cinemaSpecName?: string
  cinemaSpecId?: number
}

export interface MovieShowTimeStepContext {
  query: MovieShowTimeQuery
  setQuery: Dispatch<SetStateAction<MovieShowTimeQuery>>
  form: FormInstance
  t: (key: string) => string
  common: (key: string) => string
  fromScreeningManagement?: boolean
  movieData: { id: number; name: string }[]
  languageData: { id: number; name: string }[]
  showTimeTagData: { id: number; name: string }[]
  cinemaData: CinemaItem[]
  theaterHallData: TheaterHallItem[]
  specList: { id: number; name: string }[]
  promotionList: { id: number; name: string }[]
  reReleaseData: any[]
  movieVersionData: any[]
  getMovieData: (name?: string, id?: number) => void
  getLanguageData: (name?: string, id?: number) => void
  getShowTimeTagData: (name?: string, id?: number) => void
  getTheaterHallData: (id: number) => void
  getCinemaData: (name?: string, id?: number) => void
  getCinemaSpec: (cinemaId: number) => void
  getPromotionListForCinema: (cinemaId: number) => void
  getReReleaseData: (movieId?: number) => void
  getMovieVersionData: (movieId?: number) => Promise<void>
  setMovieModal: (state: { show: boolean }) => void
  time: number
  setTime: (v: number) => void
  /** 时间显示模式，用于 AppTimePicker */
  timeDisplayMode?: '24h' | '30h'
}
