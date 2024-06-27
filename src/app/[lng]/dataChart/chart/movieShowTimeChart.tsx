import React, { useState, useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'

interface Movie {
  movieId: number
  movieName: string
  movieCount: number
}
interface Data {
  startTime: string
  totalCount: number
  movie: Movie[]
}
interface Props {
  data: Data[]
}

type MapValue = { date: string } & Movie

export function MovieShowTimeChart(props: Props) {
  const container = useRef<HTMLDivElement | null>(null) // 指定容器的类型
  const { t } = useTranslation(navigator.language as languageType, 'chart')

  const transformData = (data: Data[]) => {
    const date = data.map((item) => item.startTime)
    const moviesMap = data.reduce((map, current) => {
      current.movie.forEach((children) => {
        const obj = {
          date: current.startTime,
          ...children
        }

        if (!map.has(children.movieId)) {
          map.set(children.movieId, [obj])
        } else {
          map.get(children.movieId).push(obj)
        }
      })

      return map
    }, new Map())

    moviesMap.forEach((value, key) => {
      const datesSet = new Set(value.map((v: { date: string }) => v.date))
      date.forEach((date) => {
        if (!datesSet.has(date)) {
          value.push({
            date,
            movieId: key,
            movieName: value[0].movieName,
            movieCount: 0
          })
        }
      })
    })
    moviesMap.forEach((value: MapValue[]) => {
      value.sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })
    })

    const result: { id: number, name: string; data: MapValue[] }[] = []

    moviesMap.forEach((item: MapValue[]) => {
      result.push({
        id: item[0].movieId,
        name: item[0].movieName,
        data: item
      })
    })

    return result
  }
  useEffect(() => {
    if (container.current && props.data.length) {
      const data = transformData(props.data)
      const title = data.map((item) => item.name)
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: title
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
          data: props.data.map(item => item.startTime)
        },
        yAxis: {
          type: 'value'
        },
        series: data.map((item) => {
          return {
            name: item.name,
            type: 'line',
            stack: 'Total',
            data: item.data.map((item) => item.movieCount)
          }
        })
        // series: [
        //   {
        //     name: 'Email',
        //     type: 'line',
        //     stack: 'Total',
        //     data: [120, 132, 101, 134, 90, 230, 210]
        //   },
        //   {
        //     name: 'Union Ads',
        //     type: 'line',
        //     stack: 'Total',
        //     data: [220, 182, 191, 234, 290, 330, 310]
        //   },
        //   {
        //     name: 'Video Ads',
        //     type: 'line',
        //     stack: 'Total',
        //     data: [150, 232, 201, 154, 190, 330, 410]
        //   },
        //   {
        //     name: 'Direct',
        //     type: 'line',
        //     stack: 'Total',
        //     data: [320, 332, 301, 334, 390, 330, 320]
        //   },
        //   {
        //     name: 'Search Engine',
        //     type: 'line',
        //     stack: 'Total',
        //     data: [820, 932, 901, 934, 1290, 1330, 1320]
        //   }
        // ]
      }
      const chart = echarts.init(container.current, null, {
        width: container.current.parentElement?.clientWidth || 400, // 设置宽度，默认400
        height: 400 // 设置高度
      })
      chart.setOption(option)

      window.onresize = () => {
        chart.resize()
      }
    }
  }, [container.current, props.data, t])

  return (
    <section>
      <section ref={container} id="movie-chart"></section>
    </section>
  )
}
