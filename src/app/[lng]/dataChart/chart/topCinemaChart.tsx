import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'

interface Data {
  cinemaId: number
  cinemaName: string
  brandName: string | null
  showtimeCount: number
}
interface Props {
  data: Data[]
}

export function TopCinemaChart(props: Props) {
  const container = useRef<HTMLDivElement | null>(null)
  const { t } = useTranslation(navigator.language as languageType, 'chart')

  useEffect(() => {
    if (!container.current) return
    const list = props.data || []

    // 横向条形图：echarts 上下倒序显示，所以反向 slice 后排序
    const sorted = [...list]
      .sort((a, b) => a.showtimeCount - b.showtimeCount)
      .slice(-10)

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: { name: string; value: number; dataIndex: number }[]) => {
          const p = params[0]
          const item = sorted[p.dataIndex]
          const brand = item?.brandName ? `<br/><span style="color:rgba(0,0,0,0.45)">${item.brandName}</span>` : ''
          return `${p.name}${brand}<br/>${t('topCinema.count')}: <b>${p.value}</b>`
        }
      },
      grid: { left: 8, right: 40, top: 16, bottom: 16, containLabel: true },
      xAxis: { type: 'value', minInterval: 1 },
      yAxis: {
        type: 'category',
        data: sorted.map((item) => item.cinemaName || `#${item.cinemaId}`),
        axisLabel: { width: 180, overflow: 'truncate' }
      },
      series: [
        {
          name: t('topCinema.count'),
          type: 'bar',
          data: sorted.map((item) => item.showtimeCount),
          itemStyle: { color: '#1677ff', borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right', formatter: '{c}' }
        }
      ]
    }

    const chart = echarts.init(container.current, null, {
      width: container.current.parentElement?.clientWidth || 400,
      height: 400
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
        {t('emptyToday')}
      </section>
    )
  }

  return (
    <section>
      <section ref={container} id="top-cinema-chart"></section>
    </section>
  )
}
