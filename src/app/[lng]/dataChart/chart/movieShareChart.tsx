import React, { useEffect, useRef, useMemo } from 'react'
import * as echarts from 'echarts'
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

const TOP_N = 10
const PALETTE = [
  '#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
  '#13c2c2', '#eb2f96', '#fa8c16', '#2f54eb', '#a0d911'
]

type MapValue = { date: string } & Movie

/**
 * 建议 A：电影占比 —— 堆叠柱图，图例固定 Top1…Top10 + 其他，
 * 不再把 50+ 部电影名塞进 legend；真实片名只在 tooltip 里展示。
 */
export function MovieShareChart(props: Props) {
  const container = useRef<HTMLDivElement | null>(null)
  const { t } = useTranslation(navigator.language as languageType, 'chart')

  const chartPayload = useMemo(() => {
    const data = props.data ?? []
    if (!data.length) return null

    const dates = data.map((d) => d.startTime)
    const moviesMap = new Map<number, MapValue[]>()
    const totalByMovie = new Map<number, number>()

    data.forEach((day) => {
      day.movie.forEach((m) => {
        const obj: MapValue = { date: day.startTime, ...m }
        const arr = moviesMap.get(m.movieId)
        if (arr) arr.push(obj)
        else moviesMap.set(m.movieId, [obj])
        totalByMovie.set(m.movieId, (totalByMovie.get(m.movieId) ?? 0) + m.movieCount)
      })
    })

    const topEntries = [...totalByMovie.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N)

    const topMeta = topEntries.map(([id, total], index) => ({
      id,
      rank: index + 1,
      label: t('movieShowTime.topRank', { rank: index + 1 }),
      movieName: moviesMap.get(id)?.[0]?.movieName ?? `#${id}`,
      total
    }))

    const dateIndex = new Map(dates.map((d, i) => [d, i]))
    const series: Array<{
      name: string
      type: 'bar'
      stack: string
      data: number[]
      itemStyle: { color: string }
      _movieName: string
    }> = []

    topMeta.forEach((meta, index) => {
      const list = moviesMap.get(meta.id) ?? []
      const row = new Array(dates.length).fill(0)
      list.forEach((it) => {
        const i = dateIndex.get(it.date)
        if (i !== undefined) row[i] += it.movieCount
      })
      series.push({
        name: meta.label,
        type: 'bar',
        stack: 'share',
        data: row,
        itemStyle: { color: PALETTE[index % PALETTE.length] },
        _movieName: meta.movieName
      })
    })

    const topIdSet = new Set(topMeta.map((m) => m.id))
    const restRow = new Array(dates.length).fill(0)
    moviesMap.forEach((list, id) => {
      if (topIdSet.has(id)) return
      list.forEach((it) => {
        const i = dateIndex.get(it.date)
        if (i !== undefined) restRow[i] += it.movieCount
      })
    })
    if (restRow.some((v) => v > 0)) {
      series.push({
        name: t('movieShowTime.others'),
        type: 'bar',
        stack: 'share',
        data: restRow,
        itemStyle: { color: '#d9d9d9' },
        _movieName: t('movieShowTime.others')
      })
    }

    return { dates, series }
  }, [props.data, t])

  useEffect(() => {
    if (!container.current || !chartPayload) return

    const nameBySeries = new Map(
      chartPayload.series.map((s) => [s.name, s._movieName])
    )

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        order: 'valueDesc',
        confine: true,
        formatter: (params: Array<{ seriesName: string; value: number; marker: string }>) => {
          if (!params?.length) return ''
          const lines = params
            .filter((p) => p.value > 0)
            .map((p) => {
              const realName = nameBySeries.get(p.seriesName) ?? p.seriesName
              return `${p.marker}${p.seriesName} (${realName}): <b>${p.value}</b>`
            })
          return lines.join('<br/>')
        }
      },
      legend: {
        data: chartPayload.series.map((s) => s.name),
        top: 0
      },
      grid: { left: '3%', right: '4%', top: 60, bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: chartPayload.dates },
      yAxis: {
        type: 'value',
        name: t('movieShowTime.unit'),
        nameGap: 12,
        nameTextStyle: { padding: [0, 0, 0, 12], color: 'rgba(0,0,0,0.45)' },
        minInterval: 1
      },
      series: chartPayload.series.map((s) => ({
        name: s.name,
        type: s.type,
        stack: s.stack,
        data: s.data,
        itemStyle: s.itemStyle
      }))
    }

    const chart = echarts.init(container.current, null, {
      width: container.current.parentElement?.clientWidth || 400,
      height: 260
    })
    chart.setOption(option)

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [chartPayload, t])

  return <section ref={container} className="chart-block" />
}
