import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'

interface Data {
  brandId: number
  brandName: string
  showtimeCount: number
}
interface Props {
  data: Data[]
}

// 与 loginPlatformChart 风格保持一致：环形 + 比例标签，多于 N 项合并为「其他」避免饼图过碎。
const MAX_SLICES = 8

export function BrandShowtimeChart(props: Props) {
  const container = useRef<HTMLDivElement | null>(null)
  const { t } = useTranslation(navigator.language as languageType, 'chart')

  useEffect(() => {
    if (!container.current) return
    const list = props.data || []

    const sorted = [...list].sort((a, b) => b.showtimeCount - a.showtimeCount)
    const head = sorted.slice(0, MAX_SLICES)
    const tail = sorted.slice(MAX_SLICES)
    const items = head.map((item) => ({
      name: item.brandName || `#${item.brandId}`,
      value: item.showtimeCount
    }))
    if (tail.length) {
      items.push({
        name: t('brandPie.others'),
        value: tail.reduce((sum, item) => sum + item.showtimeCount, 0)
      })
    }

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: 10,
        top: 20,
        bottom: 20
      },
      series: [
        {
          name: t('brandPie.title'),
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, formatter: '{b}\n{d}%' },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: 'bold' }
          },
          data: items
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
      <section ref={container} id="brand-showtime-chart"></section>
    </section>
  )
}
