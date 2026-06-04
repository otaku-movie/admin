import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'

interface Data {
  date: string
  showtimeCount: number
}
interface Props {
  data: Data[]
}

// 把"今天"的柱子单独高亮，方便和"未来"区分；同时帮助看出爬虫
// 覆盖到第几天就断崖（之前的 5 天满 + 后 2 天接近 0 的 pattern）。
export function Next7DaysChart(props: Props) {
  const container = useRef<HTMLDivElement | null>(null)
  const { t } = useTranslation(navigator.language as languageType, 'chart')

  useEffect(() => {
    if (!container.current) return
    const list = props.data || []
    const today = new Date().toISOString().slice(0, 10)

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: { left: 8, right: 24, top: 24, bottom: 24, containLabel: true },
      xAxis: {
        type: 'category',
        data: list.map((item) => item.date),
        axisLabel: {
          formatter: (value: string) =>
            value === today ? `${value.slice(5)} ${t('next7Days.today')}` : value.slice(5)
        }
      },
      yAxis: {
        type: 'value',
        name: t('next7Days.unit'),
        minInterval: 1
      },
      series: [
        {
          name: t('next7Days.unit'),
          type: 'bar',
          data: list.map((item) => ({
            value: item.showtimeCount,
            itemStyle: {
              color: item.date === today ? '#1677ff' : '#91caff',
              borderRadius: [4, 4, 0, 0]
            }
          })),
          label: { show: true, position: 'top', formatter: '{c}' }
        }
      ]
    }

    const chart = echarts.init(container.current, null, {
      width: container.current.parentElement?.clientWidth || 400,
      height: 320
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
        {t('next7Days.empty')}
      </section>
    )
  }

  return (
    <section>
      <section ref={container} id="next-7-days-chart"></section>
      <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
        {t('next7Days.hint')}
      </div>
    </section>
  )
}
