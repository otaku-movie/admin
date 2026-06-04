import React from 'react'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'
import { ShowtimeTrendChart } from './showtimeTrendChart'
import { MovieShareChart } from './movieShareChart'
import { MovieDeltaList } from './movieDeltaList'

interface Movie {
  movieId: number
  movieName: string
  movieCount: number
}
interface Data {
  startTime: string
  totalCount: number
  movie: Movie[]
}
interface Props {
  data: Data[]
}

/** 建议 B：排片拆成「总场次折线 + 电影占比堆叠」上下两张图。 */
export function DailyShowtimePanel(props: Props) {
  const { t } = useTranslation(navigator.language as languageType, 'chart')

  if (!props.data?.length) {
    return (
      <section className="daily-showtime-panel empty-hint">
        {t('movieShowTime.empty')}
      </section>
    )
  }

  return (
    <section className="daily-showtime-panel">
      <div className="chart-section area-trend">
        <h4 className="chart-section-title">{t('movieShowTime.trendTitle')}</h4>
        <ShowtimeTrendChart data={props.data} />
      </div>
      <div className="chart-section area-share">
        <h4 className="chart-section-title">{t('movieShowTime.shareTitle')}</h4>
        <MovieShareChart data={props.data} />
      </div>
      <div className="chart-section area-delta">
        <h4 className="chart-section-title">{t('movieShowTime.deltaTitle')}</h4>
        <MovieDeltaList data={props.data} />
      </div>
    </section>
  )
}
