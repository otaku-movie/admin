import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'

interface Data {
  startTime: string
  totalCount: number
}
interface Props {
  data: Data[]
}

/** 建议 B：总场次趋势 —— 折线图，一眼看每日排片总量变化。 */
export function ShowtimeTrendChart(props: Props) {
  const container = useRef<HTMLDivElement | null>(null)
  const { t } = useTranslation(navigator.language as languageType, 'chart')

  useEffect(() => {
    if (!container.current || !props.data?.length) return

    const sorted = [...props.data].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )

    const option = {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', top: 36, bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: sorted.map((d) => d.startTime)
      },
      yAxis: {
        type: 'value',
        name: t('movieShowTime.unit'),
        nameGap: 12,
        nameTextStyle: { padding: [0, 0, 0, 12], color: 'rgba(0,0,0,0.45)' },
        minInterval: 1
      },
      series: [
        {
          name: t('movieShowTime.trendSeries'),
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: '#1677ff' },
          itemStyle: { color: '#1677ff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(22, 119, 255, 0.25)' },
              { offset: 1, color: 'rgba(22, 119, 255, 0.02)' }
            ])
          },
          data: sorted.map((d) => d.totalCount)
        }
      ]
    }

    const chart = echarts.init(container.current, null, {
      width: container.current.parentElement?.clientWidth || 400,
      height: 220
    })
    chart.setOption(option)

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [props.data, t])

  return <section ref={container} className="chart-block" />
}
