import React, { useState, useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'

interface Data {
  date: string
  totalAmount: number
}
interface UserChartProps {
  data: Data[]
}

export function DailyTransactionAmount(props: UserChartProps) {
  const container = useRef<HTMLDivElement | null>(null) // 指定容器的类型
  const [data, setData] = useState<Data[]>([])
  const { t } = useTranslation(navigator.language as languageType, 'chart')

  useEffect(() => {
    setData(data)
  }, [props.data])

  useEffect(() => {
    if (container.current && props.data) {
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: [
          {
            type: 'category',
            data: props.data.map((item) => item.date),
            axisTick: {
              alignWithLabel: true
            }
          }
        ],
        yAxis: [
          {
            type: 'value'
          }
        ],
        series: [
          {
            name: t('tab.DailyTransactionAmount'),
            type: 'line',
            data: props.data.map((item) => item.totalAmount)
          }
        ]
      }
      const chart = echarts.init(container.current, null, {
        width: container.current.parentElement?.clientWidth || 400, // 设置宽度，默认400
        height: 400 // 设置高度
      })
      chart.setOption(option)

      window.onresize = () => {
        chart.resize()
      }
      // const observer = new ResizeObserver(() => {
      //   chart.resize()
      // })
      // observer.observe(document.documentElement)

      // return () => {
      //   observer.disconnect()
      // }
    }
  }, [container, props.data])

  return (
    <section className="userChart">
      <section ref={container} id="user-chart"></section>
    </section>
  )
}
