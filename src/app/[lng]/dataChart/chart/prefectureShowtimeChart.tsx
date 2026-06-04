import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'

interface Data {
  prefectureId: number
  prefectureName: string
  regionName: string | null
  showtimeCount: number
}
interface Props {
  data: Data[]
}

// 日本 8 个地方各自的视觉色（与日常地图色板对齐，方便区分）。
const REGION_COLORS: Record<string, string> = {
  北海道地方: '#1677ff',
  東北地方: '#13c2c2',
  関東地方: '#52c41a',
  中部地方: '#faad14',
  近畿地方: '#fa541c',
  中国地方: '#722ed1',
  四国地方: '#eb2f96',
  '九州・沖縄地方': '#f5222d'
}
const DEFAULT_COLOR = '#8c8c8c'

export function PrefectureShowtimeChart(props: Props) {
  const container = useRef<HTMLDivElement | null>(null)
  const { t } = useTranslation(navigator.language as languageType, 'chart')

  useEffect(() => {
    if (!container.current) return
    const list = props.data || []

    // 横向条形：echarts 从下到上排，所以 ASC 排，最大值靠上
    const sorted = [...list].sort((a, b) => a.showtimeCount - b.showtimeCount)

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: { name: string; value: number; dataIndex: number }[]) => {
          const p = params[0]
          const item = sorted[p.dataIndex]
          const region = item?.regionName
            ? `<br/><span style="color:rgba(0,0,0,0.45)">${item.regionName}</span>`
            : ''
          return `${p.name}${region}<br/>${t('prefecture.count')}: <b>${p.value}</b>`
        }
      },
      grid: { left: 8, right: 60, top: 16, bottom: 16, containLabel: true },
      xAxis: { type: 'value', minInterval: 1 },
      yAxis: {
        type: 'category',
        data: sorted.map((item) => item.prefectureName),
        axisLabel: { fontSize: 12 }
      },
      series: [
        {
          name: t('prefecture.count'),
          type: 'bar',
          data: sorted.map((item) => ({
            value: item.showtimeCount,
            itemStyle: {
              color: REGION_COLORS[item.regionName ?? ''] ?? DEFAULT_COLOR,
              borderRadius: [0, 4, 4, 0]
            }
          })),
          label: { show: true, position: 'right', formatter: '{c}' }
        }
      ]
    }

    // 行高随条数变化，最高 720px，避免 47 个都道府县堆得太挤
    const height = Math.min(720, Math.max(320, sorted.length * 24 + 40))
    const chart = echarts.init(container.current, null, {
      width: container.current.parentElement?.clientWidth || 400,
      height
    })
    chart.setOption(option)

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [props.data, t])

  if (!props.data || props.data.length === 0) {
    return (
      <section style={{ padding: 40, textAlign: 'center', color: 'rgba(0,0,0,0.45)' }}>
        {t('prefecture.empty')}
      </section>
    )
  }

  return (
    <section>
      <section ref={container} id="prefecture-showtime-chart"></section>
    </section>
  )
}
