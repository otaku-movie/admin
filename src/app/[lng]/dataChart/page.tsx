'use client'
import React, { useState, useEffect, useMemo, type ReactNode } from 'react'
import http from '@/api/index'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '@/app/[lng]/layout'
import { UserChart } from './chart/userChart'
import { DailyShowtimePanel } from './chart/dailyShowtimePanel'
import { DailyTransactionAmount } from './chart/dailyTransactionAmount'
import { DailyOrderStatistics } from './chart/dailyOrderStatistics'
import { LoginPlatformChart } from './chart/loginPlatformChart'
import { BrandShowtimeChart } from './chart/brandShowtimeChart'
import { TopCinemaChart } from './chart/topCinemaChart'
import { PrefectureShowtimeChart } from './chart/prefectureShowtimeChart'
import { Next7DaysChart } from './chart/next7DaysChart'
import { DataQualityCard } from './chart/dataQualityCard'
import { Progress, Segmented, Tabs, type TabsProps } from 'antd'
import './style.scss'
import { formatNumber } from '@/utils'

interface ChartData {
  userCount: number
  movieCount: number
  cinemaCount: number
  showTimeCount: number
  brandCount: number
  theaterHallCount: number
  tmdbMatchedMovieCount: number
  todayShowTimeCount: number
  statisticsUserData: Array<{ createDate: string; userCount: number }>
  statisticsOfDailyMovieScreenings: Array<{
    startTime: string
    totalCount: number
    movie: Array<{ movieId: number; movieName: string; movieCount: number }>
  }>
  dailyOrderStatistics: Array<{
    date: string
    count: number
    orderState: Array<{ state: number; count: number }>
  }>
  dailyTransactionAmount: Array<{ date: string; totalAmount: number }>
  loginPlatformStatistics: Array<{ platform: string; userCount: number }>
  todayBrandShowtimes: Array<{ brandId: number; brandName: string; showtimeCount: number }>
  todayTopCinemas: Array<{
    cinemaId: number
    cinemaName: string
    brandName: string | null
    showtimeCount: number
  }>
  todayPrefectureShowtimes: Array<{
    prefectureId: number
    prefectureName: string
    regionName: string | null
    showtimeCount: number
  }>
  next7DaysShowtimes: Array<{ date: string; showtimeCount: number }>
  movieDataQuality: {
    totalMovies: number
    withTmdb: number
    withDescription: number
    withReleaseDate: number
    withHomePage: number
    withMovieRate: number
    withLevel: number
  } | null
  kpiTrends: {
    todayShowTimeChangePercent: number | null
    movieCountChange: number
    cinemaCountChange: number
  } | null
}

const EMPTY: ChartData = {
  userCount: 0,
  movieCount: 0,
  cinemaCount: 0,
  showTimeCount: 0,
  brandCount: 0,
  theaterHallCount: 0,
  tmdbMatchedMovieCount: 0,
  todayShowTimeCount: 0,
  statisticsUserData: [],
  statisticsOfDailyMovieScreenings: [],
  dailyOrderStatistics: [],
  dailyTransactionAmount: [],
  loginPlatformStatistics: [],
  todayBrandShowtimes: [],
  todayTopCinemas: [],
  todayPrefectureShowtimes: [],
  next7DaysShowtimes: [],
  movieDataQuality: null,
  kpiTrends: null
}

function KpiTrend({
  value,
  mode
}: {
  value: number | null | undefined
  mode: 'percent' | 'absolute'
}) {
  if (value == null || value === 0) return null
  const up = value > 0
  const text = mode === 'percent' ? `${Math.abs(value)}%` : String(Math.abs(value))
  return (
    <div className={`kpi-trend ${up ? 'kpi-trend-up' : 'kpi-trend-down'}`}>
      {up ? '↑' : '↓'} {text}
    </div>
  )
}

type SegmentOption = { value: string; label: string; render: () => ReactNode }

// 在一个一级 Tab 内用 Segmented 切换多个子视图；
// 用 render() 而不是直接保存 ReactNode，保证只挂载当前 active 的图表，
// 切换时旧 echarts 实例会被 unmount + dispose（每个 chart 组件自带 cleanup）。
function SegmentedView({ options, storageKey }: { options: SegmentOption[]; storageKey: string }) {
  const [value, setValue] = useState<string>(options[0]?.value ?? '')
  if (!options.length) return null
  const active = options.find((o) => o.value === value) ?? options[0]
  return (
    <>
      <Segmented
        value={active.value}
        onChange={(v) => setValue(v as string)}
        options={options.map((o) => ({ label: o.label, value: o.value }))}
        style={{ marginBottom: 16 }}
        key={storageKey}
      />
      {active.render()}
    </>
  )
}

export default function Page({ params: { lng } }: PageProps) {
  const { t } = useTranslation(lng, 'chart')
  const { t: common } = useTranslation(lng, 'common')
  const [data, setData] = useState<ChartData>(EMPTY)

  const getData = () => {
    http({ url: 'admin/chart', method: 'get' }).then((res) => {
      setData({ ...EMPTY, ...res.data })
    })
  }

  useEffect(() => {
    getData()
  }, [])

  const unit = [
    { value: 1e8, unit: common('unit.billion') },
    { value: 1e6, unit: common('unit.million') }
  ]

  // 业务数据稀疏时（订单 / 成交额 / 注册用户都接近 0）整个「业务」一级 tab 隐藏，
  // 避免半年空图占据 dashboard。
  const hasBusinessData = useMemo(() => {
    const orderSum = data.dailyOrderStatistics.reduce((s, x) => s + (x.count ?? 0), 0)
    const amountSum = data.dailyTransactionAmount.reduce((s, x) => s + (x.totalAmount ?? 0), 0)
    const userSum = data.statisticsUserData.reduce((s, x) => s + (x.userCount ?? 0), 0)
    return orderSum + amountSum + userSum > 0
  }, [data])

  const tmdbRate =
    data.movieCount > 0
      ? Math.round((data.tmdbMatchedMovieCount / data.movieCount) * 1000) / 10
      : 0

  // 一级 Tab #1：排片分析（5 个子视图，全部围绕场次维度）
  const showtimeOptions: SegmentOption[] = [
    {
      value: 'daily',
      label: t('tab.movieShowTimeCount'),
      render: () => <DailyShowtimePanel data={data.statisticsOfDailyMovieScreenings} />
    },
    {
      value: 'next7',
      label: t('tab.next7Days'),
      render: () => <Next7DaysChart data={data.next7DaysShowtimes} />
    },
    {
      value: 'brand',
      label: t('tab.brandPie'),
      render: () => <BrandShowtimeChart data={data.todayBrandShowtimes} />
    },
    {
      value: 'topCinema',
      label: t('tab.topCinema'),
      render: () => <TopCinemaChart data={data.todayTopCinemas} />
    },
    {
      value: 'prefecture',
      label: t('tab.prefecture'),
      render: () => <PrefectureShowtimeChart data={data.todayPrefectureShowtimes} />
    }
  ]

  // 一级 Tab #3：用户（暂时只有登录平台一个；日注册放到「业务」tab）
  const userOptions: SegmentOption[] = [
    {
      value: 'platform',
      label: t('tab.loginPlatform'),
      render: () => <LoginPlatformChart data={data.loginPlatformStatistics} />
    }
  ]

  const tabs: TabsProps['items'] = [
    {
      key: 'showtime',
      label: t('tabGroup.showtime'),
      children: <SegmentedView options={showtimeOptions} storageKey="showtime" />
    },
    {
      key: 'quality',
      label: t('tabGroup.quality'),
      children: <DataQualityCard data={data.movieDataQuality} />
    },
    {
      key: 'user',
      label: t('tabGroup.user'),
      children: <SegmentedView options={userOptions} storageKey="user" />
    }
  ]

  if (hasBusinessData) {
    tabs.push({
      key: 'business',
      label: t('tabGroup.business'),
      children: (
        <SegmentedView
          storageKey="business"
          options={[
            {
              value: 'order',
              label: t('tab.orderCount'),
              render: () => <DailyOrderStatistics data={data.dailyOrderStatistics} />
            },
            {
              value: 'transaction',
              label: t('tab.DailyTransactionAmount'),
              render: () => <DailyTransactionAmount data={data.dailyTransactionAmount} />
            },
            {
              value: 'register',
              label: t('tab.userRegisterCount'),
              render: () => <UserChart data={data.statisticsUserData} />
            }
          ]}
        />
      )
    })
  }

  return (
    <section className="chart">
      {/*
        4 张大 KPI 卡：把原 6 张里两条信息冗余（电影 / TMDb 命中率本来副标题就重复，
        影院 / 品牌可合并为「影院网络」）的合并成内容更密的卡。
        每张卡布局统一：label → 主数字 + 趋势徽章 → 副信息（含进度条 / 多指标 / 提示）。
      */}
      <ul className="top-message">
        <li className="kpi-card">
          <div className="label">{t('top.contentLibrary')}</div>
          <div className="count-row">
            <div className="count">{formatNumber(data.movieCount, unit)}</div>
            <KpiTrend value={data.kpiTrends?.movieCountChange} mode="absolute" />
          </div>
          <div className="extra extra-with-progress">
            <div>
              {t('top.tmdbProgress', {
                count: data.tmdbMatchedMovieCount,
                total: data.movieCount,
                rate: tmdbRate
              })}
            </div>
            <Progress
              percent={tmdbRate}
              showInfo={false}
              size="small"
              strokeColor="#1677ff"
            />
          </div>
        </li>
        <li className="kpi-card">
          <div className="label">{t('top.cinemaNetwork')}</div>
          <div className="count-row">
            <div className="count">{formatNumber(data.cinemaCount, unit)}</div>
            <KpiTrend value={data.kpiTrends?.cinemaCountChange} mode="absolute" />
          </div>
          <div className="extra extra-stats">
            <span>
              <b>{formatNumber(data.brandCount, unit)}</b> {t('top.brandLabel')}
            </span>
            <span>
              <b>{formatNumber(data.theaterHallCount, unit)}</b> {t('top.hallLabel')}
            </span>
          </div>
        </li>
        <li className="kpi-card">
          <div className="label">{t('top.todayShowTime')}</div>
          <div className="count-row">
            <div className="count">{formatNumber(data.todayShowTimeCount, unit)}</div>
            <KpiTrend value={data.kpiTrends?.todayShowTimeChangePercent} mode="percent" />
          </div>
          <div className="extra">
            {t('top.totalShowTime', { count: data.showTimeCount })}
          </div>
        </li>
        <li className="kpi-card">
          <div className="label">{t('top.userCount')}</div>
          <div className="count">{formatNumber(data.userCount, unit)}</div>
          <div className="extra">{t('top.userExtra')}</div>
        </li>
      </ul>
      <section className="tab-chart">
        {/*
          destroyInactiveTabPane=true：切换一级 Tab 时销毁旧 Tab 内容，
          配合 SegmentedView 的 render-on-demand 风格，确保每个 echarts
          组件按当前容器宽度初始化（之前不销毁导致 inactive Tab 的 chart
          初始化宽度是 0、切回时不会自动 resize）。
        */}
        <Tabs
          defaultActiveKey="showtime"
          tabPosition="top"
          destroyInactiveTabPane
          items={tabs}
        />
      </section>
    </section>
  )
}
