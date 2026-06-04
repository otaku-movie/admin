import React from 'react'
import { Progress } from 'antd'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'

interface Data {
  totalMovies: number
  withTmdb: number
  withDescription: number
  withReleaseDate: number
  withHomePage: number
  withMovieRate: number
  withLevel: number
}
interface Props {
  data: Data | null | undefined
}

type RowKey =
  | 'withTmdb'
  | 'withDescription'
  | 'withReleaseDate'
  | 'withHomePage'
  | 'withMovieRate'
  | 'withLevel'

const ROWS: Array<{ key: RowKey; i18nKey: string }> = [
  { key: 'withTmdb', i18nKey: 'dataQuality.tmdb' },
  { key: 'withDescription', i18nKey: 'dataQuality.description' },
  { key: 'withReleaseDate', i18nKey: 'dataQuality.releaseDate' },
  { key: 'withHomePage', i18nKey: 'dataQuality.homePage' },
  { key: 'withMovieRate', i18nKey: 'dataQuality.movieRate' },
  { key: 'withLevel', i18nKey: 'dataQuality.level' }
]

const colorOf = (percent: number) => {
  if (percent >= 80) return '#52c41a'
  if (percent >= 50) return '#1677ff'
  if (percent >= 20) return '#faad14'
  return '#f5222d'
}

export function DataQualityCard(props: Props) {
  const { t } = useTranslation(navigator.language as languageType, 'chart')
  const data = props.data
  if (!data || !data.totalMovies) {
    return (
      <section style={{ padding: 40, textAlign: 'center', color: 'rgba(0,0,0,0.45)' }}>
        {t('dataQuality.empty')}
      </section>
    )
  }

  return (
    <section className="quality-card">
      <div className="quality-row">
        <div className="quality-label">
          <b>{t('dataQuality.totalMovies')}</b>
        </div>
        <div></div>
        <div className="quality-meta">{data.totalMovies.toLocaleString()}</div>
      </div>
      {ROWS.map(({ key, i18nKey }) => {
        const filled = (data[key] as number) || 0
        const percent = Math.round((filled / data.totalMovies) * 1000) / 10
        return (
          <div key={key} className="quality-row">
            <div className="quality-label">{t(i18nKey)}</div>
            <Progress
              percent={percent}
              showInfo={false}
              strokeColor={colorOf(percent)}
            />
            <div className="quality-meta">
              {filled.toLocaleString()} / {data.totalMovies.toLocaleString()} ({percent}%)
            </div>
          </div>
        )
      })}
    </section>
  )
}
