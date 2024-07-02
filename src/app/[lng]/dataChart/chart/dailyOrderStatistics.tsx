import React, { useState, useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'

interface Movie {
  state: number
  count: number
}
interface Data {
  date: string
  count: number
  orderState: Movie[]
}
interface Props {
  data: Data[]
}

export function DailyOrderStatistics(props: Props) {
  const container = useRef<HTMLDivElement | null>(null) // 指定容器的类型
  const { t } = useTranslation(navigator.language as languageType, 'chart')
  const { t: common } = useTranslation(
    navigator.language as languageType,
    'common'
  )

  const orderState = {
    1: common('enum.orderState.orderCreated'),
    2: common('enum.orderState.orderSucceed'),
    3: common('enum.orderState.orderFailed'),
    4: common('enum.orderState.canceledOrder'),
    5: common('enum.orderState.orderTimeout')
  }

  const transformData = (data) => {
    return data.map((item) => {
      return {
        ...item,
        orderState: item.orderState.map((children) => {
          return {
            ...children,
            name: orderState[children.state]
          }
        })
      }
    })
  }

  useEffect(() => {
    if (container.current && props.data?.length) {
      const data = transformData(props.data)
      const seriesData = {}

      // 初始化 seriesData 对象，确保所有状态都有初始值
      Object.values(orderState).forEach((name) => {
        seriesData[name] = {
          name,
          type: 'line',
          stack: 'Total',
          data: Array(props.data.length).fill(0) // 初始化为 0
        }
      })

      // 用于存储所有的 count 值以找到最大值
      let maxCount = 0

      // 将数据转化为 series 的形式
      data.forEach((item, index) => {
        item.orderState.forEach((children) => {
          seriesData[children.name].data[index] = children.count
          if (children.count > maxCount) {
            maxCount = children.count
          }
        })
      })
      console.log(data)

      const option = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: Object.values(seriesData).map((item) => item.name)
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: props.data.map((item) => item.date)
        },
        yAxis: {
          type: 'value'
          // max: maxCount  // 设置 Y 轴的最大值
        },
        series: Object.values(seriesData)
      }

      const chart = echarts.init(container.current, null, {
        width: container.current.parentElement?.clientWidth || 400,
        height: 400
      })
      chart.setOption(option)

      window.onresize = () => {
        chart.resize()
      }
    }
  }, [container.current, props.data, t])

  // const orderState = {
  //   1: common('enum.orderState.orderCreated'),
  //   2: common('enum.orderState.orderSucceed'),
  //   3: common('enum.orderState.orderFailed'),
  //   4: common('enum.orderState.canceledOrder'),
  //   5: common('enum.orderState.orderTimeout')
  // }

  // const transformData = (data: Data[]) => {
  //   return data.map((item) => {
  //     return {
  //       ...item,
  //       orderState: item.orderState.map((children) => {
  //         return {
  //           ...children,
  //           name: orderState[children.state as keyof typeof orderState]
  //         }
  //       })
  //     }
  //   })
  // }

  // useEffect(() => {
  //   if (container.current && props.data.length) {
  //     const data = transformData(props.data)
  //     // const title = data.map((item) => item.name)
  //     const option = {
  //       tooltip: {
  //         trigger: 'axis'
  //       },
  //       // legend: {
  //       //   data: title
  //       // },
  //       grid: {
  //         left: '3%',
  //         right: '4%',
  //         bottom: '3%',
  //         containLabel: true
  //       },
  //       xAxis: {
  //         type: 'category',
  //         boundaryGap: false,
  //         data: props.data.map((item) => item.date)
  //       },
  //       yAxis: {
  //         type: 'value'
  //       },
  //       series: data.map((item) => {
  //         return {
  //           // name: item.name,
  //           type: 'line',
  //           stack: 'Total',
  //           data: item.orderState.map((item) => item.count)
  //         }
  //       })
  //     }
  //     const chart = echarts.init(container.current, null, {
  //       width: container.current.parentElement?.clientWidth || 400, // 设置宽度，默认400
  //       height: 400 // 设置高度
  //     })
  //     chart.setOption(option)

  //     window.onresize = () => {
  //       chart.resize()
  //     }
  //   }
  // }, [container.current, props.data, t])

  return (
    <section>
      <section ref={container} id="movie-chart"></section>
    </section>
  )
}
