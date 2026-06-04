import React from 'react'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'

interface Movie {
  movieId: number
  movieName: string
  movieCount: number
}
interface DayRow {
  startTime: string
  totalCount: number
  movie: Movie[]
}
interface Props {
  data: DayRow[]
}

const TOP = 10

/**
 * 单影片场次环比 Top10。对比最新一天 vs 倒数第二天，
 * 数据源 `statisticsOfDailyMovieScreenings` 是按全周期 Top10 movie_id
 * 做 daily group，所以两天之间影片集合一致。
 */
export function MovieDeltaList(props: Props) {
  const { t } = useTranslation(navigator.language as languageType, 'chart')
  const data = props.data ?? []

  if (!data.length) {
    return (
      <section className="movie-delta-empty">{t('movieShowTime.empty')}</section>
    )
  }

  const sorted = [...data].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  // 选 latest 的优先级：
  //   1) 数据里有「今天」就用今天（本地时区，与 server Asia/Tokyo 一致）；
  //   2) 否则取 totalCount 最大的那天（爬虫日历高峰，避免取到末尾 1 场预售）。
  // 这样可以避免出现"只有 1 部电影"的退化情况。
  const today = formatLocalDate(new Date())
  let latestIdx = sorted.findIndex((d) => d.startTime === today)
  if (latestIdx === -1) {
    let maxTotal = -1
    sorted.forEach((d, i) => {
      if ((d.totalCount ?? 0) > maxTotal) {
        maxTotal = d.totalCount ?? 0
        latestIdx = i
      }
    })
  }
  if (latestIdx === -1) latestIdx = sorted.length - 1
  const latest = sorted[latestIdx]
  const prev = latestIdx > 0 ? sorted[latestIdx - 1] : null

  const allMovies = new Map<number, string>()
  data.forEach((day) =>
    day.movie.forEach((m) => allMovies.set(m.movieId, m.movieName))
  )

  const countOnDay = (day: DayRow | null, id: number) =>
    day?.movie.find((m) => m.movieId === id)?.movieCount ?? 0

  const rows = [...allMovies.entries()]
    .map(([id, name]) => {
      const today = countOnDay(latest, id)
      const yesterday = prev ? countOnDay(prev, id) : null
      const delta = yesterday == null ? null : today - yesterday
      const percent =
        yesterday != null && yesterday > 0
          ? Math.round(((today - yesterday) / yesterday) * 1000) / 10
          : null
      return { id, name, today, yesterday, delta, percent }
    })
    .filter((r) => r.today > 0 || (r.yesterday ?? 0) > 0)
    .sort((a, b) => b.today - a.today)
    .slice(0, TOP)

  const hasPrev = prev != null

  // 日期升序展示：yesterday → today → delta，与"从昨天到今天的变化"阅读方向一致。
  // 无昨日基线时只显示 today 单列。
  return (
    <ul className={`movie-delta-list${hasPrev ? '' : ' no-prev'}`}>
      <li className="row header">
        <span className="rank">#</span>
        <span className="name">{t('movieShowTime.deltaMovie')}</span>
        {hasPrev ? (
          <span className="value">{formatDate(prev!.startTime)}</span>
        ) : null}
        <span className="value">{formatDate(latest.startTime)}</span>
        <span className="delta">{t('movieShowTime.deltaChange')}</span>
      </li>
      {rows.map((row, idx) => {
        const isUp = row.delta != null && row.delta > 0
        const isDown = row.delta != null && row.delta < 0
        const isNew = row.delta != null && (row.yesterday ?? 0) === 0 && row.today > 0
        return (
          <li key={row.id} className="row">
            <span className="rank">#{idx + 1}</span>
            <span className="name" title={row.name}>
              {row.name}
            </span>
            {hasPrev ? <span className="value">{row.yesterday}</span> : null}
            <span className="value">{row.today}</span>
            <span
              className={`delta ${isUp ? 'up' : ''} ${isDown ? 'down' : ''}`}
            >
              {!hasPrev || row.delta == null
                ? '-'
                : isNew
                  ? t('movieShowTime.deltaNew')
                  : `${isUp ? '↑' : isDown ? '↓' : ''} ${Math.abs(row.delta)}${
                      row.percent != null
                        ? ` (${row.percent >= 0 ? '+' : ''}${row.percent}%)`
                        : ''
                    }`}
            </span>
          </li>
        )
      })}
      {!hasPrev ? (
        <li className="row hint">
          <span className="name">{t('movieShowTime.noPrev')}</span>
        </li>
      ) : null}
    </ul>
  )
}

function formatDate(s: string) {
  return s.length >= 10 ? s.slice(5, 10) : s
}

function formatLocalDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
