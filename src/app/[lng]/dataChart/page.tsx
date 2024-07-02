'use client'
import React, { useState, useEffect } from 'react'
import http from '@/api/index'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '@/app/[lng]/layout'
import { UserChart } from './chart/userChart'
import { MovieShowTimeChart } from './chart/MovieShowTimeChart'
import { DailyTransactionAmount } from './chart/dailyTransactionAmount'
import { DailyOrderStatistics } from './chart/dailyOrderStatistics'
import { Tabs } from 'antd'
import './style.scss'
import { formatNumber } from '@/utils'

export default function Page({ params: { lng } }: PageProps) {
  const { t } = useTranslation(lng, 'chart')
  const { t: common } = useTranslation(lng, 'common')
  const [data, setData] = useState<any>({
    userCount: 0,
    movieCount: 0,
    cinemaCount: 0,
    showTimeCount: 0,
    statisticsUserData: [],
    statisticsOfDailyMovieScreenings: []
  })

  const getData = (page = 1) => {
    http({
      url: 'admin/chart',
      method: 'get'
    }).then((res) => {
      console.log(res.data)
      setData(res.data)
    })
  }

  useEffect(() => {
    getData()
  }, [])
  const unit = [
    {
      value: 1e8,
      unit: common('unit.billion')
    },
    {
      value: 1e6,
      unit: common('unit.million')
    }
  ]

  return (
    <section className="chart">
      <ul className="top-message">
        <li>
          <div>{t('top.userCount')}</div>
          <div className="count">{formatNumber(data.userCount, unit)}</div>
        </li>
        <li>
          <div> {t('top.movieCount')}</div>
          <div className="count">{formatNumber(data.movieCount, unit)}</div>
        </li>
        <li>
          <div>{t('top.cinemaCount')}</div>
          <div className="count">{formatNumber(data.cinemaCount, unit)}</div>
        </li>
      </ul>
      <section className="tab-chart">
        <Tabs
          defaultActiveKey="3"
          tabPosition={'top'}
          // tabBarExtraContent={{
          //   right: 'hello world'
          // }}
          items={[
            {
              key: '1',
              label: t('tab.userRegisterCount'),
              children: <UserChart data={data.statisticsUserData}></UserChart>
            },
            {
              key: '2',
              label: t('tab.movieShowTimeCount'),
              children: (
                <MovieShowTimeChart
                  data={data.statisticsOfDailyMovieScreenings}
                ></MovieShowTimeChart>
              )
            },
            {
              key: '3',
              label: t('tab.orderCount'),
              children: (
                <DailyOrderStatistics
                  data={data.dailyOrderStatistics}
                ></DailyOrderStatistics>
              )
            },
            {
              key: '4',
              label: t('tab.DailyTransactionAmount'),
              children: (
                <DailyTransactionAmount
                  data={data.dailyTransactionAmount}
                ></DailyTransactionAmount>
              )
            }
          ]}
        />
      </section>
    </section>
  )
}
