'use client'
import React, { useMemo, useEffect, useRef, useCallback } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { Dropdown, Tag, Tooltip, MenuProps, Empty, Button } from 'antd'
import { AimOutlined } from '@ant-design/icons'
import { CinemaScreeing, MovieShowTimeItem } from '@/api/request/cinema'
import { useCommonStore } from '@/store/useCommonStore'

interface GanttViewProps {
  date: Dayjs
  data: CinemaScreeing[]
  /** 点击场次条：弹详情 */
  onItemClick: (item: MovieShowTimeItem) => void
  /** 右键菜单项 + 处理 */
  buildMenuItems: (item: MovieShowTimeItem) => {
    items: MenuProps['items']
    onClick: MenuProps['onClick']
  }
  /** 空数据兜底文案 */
  emptyText?: string
  /** 影厅列文案 */
  hallColumnTitle?: string
  /** 公开状态文案，用于条形/图例（默认 "未公开"） */
  closedLabel?: string
}

const HOUR_WIDTH = 90
const ROW_HEIGHT = 80
const HALL_LABEL_WIDTH = 170
const MIN_BAR_WIDTH = 36

// 默认时间窗口 6:00 ~ 30:00（次日 06:00），覆盖电影院深夜场 + All Night 场；
// 数据如果再早/再晚仍会自动外扩。把右侧默认拉宽到 30h 是为了让 25/26/27/28/29h
// 的空白时间格也常驻可见，方便看跨夜场次而不必横滚到尽头才知道有没有空档
const DEFAULT_START_HOUR = 6
const DEFAULT_END_HOUR = 30

interface BarStyle {
  bg: string
  border: string
  text: string
  /** 左侧状态色条 / 图例小圆点用的强色 */
  accent: string
}

function getStatusStyle(status: 1 | 2 | 3): BarStyle {
  if (status === 1) {
    // 未开映：青绿
    return { bg: '#e6fffb', border: '#87e8de', text: '#006d75', accent: '#13c2c2' }
  }
  if (status === 2) {
    // 放映中：蓝（高饱和，突出"正在进行"）
    return { bg: '#e6f4ff', border: '#69b1ff', text: '#0958d9', accent: '#1677ff' }
  }
  // 放映结束：灰
  return { bg: '#fafafa', border: '#d9d9d9', text: '#8c8c8c', accent: '#bfbfbf' }
}

export default function GanttView(props: GanttViewProps) {
  const {
    date,
    data,
    onItemClick,
    buildMenuItems,
    emptyText,
    hallColumnTitle,
    closedLabel
  } = props
  const scrollRef = useRef<HTMLDivElement>(null)
  const dict = useCommonStore((state) => state.dict)

  // 通过 dict 拿状态文字。dict 还没加载时退回 code 字符串，避免空白
  const getStatusLabel = (status: number): string => {
    const list = dict?.['cinemaPlayState']
    const found = list?.find((d: { code: number }) => d.code === status)
    return found?.name?.trim() || String(status)
  }

  const dayStart = useMemo(() => dayjs(date).startOf('day'), [date])

  // 根据数据自动外扩时间窗口
  const { startHour, endHour, hours } = useMemo(() => {
    let minH = DEFAULT_START_HOUR
    let maxH = DEFAULT_END_HOUR
    for (const hall of data) {
      for (const c of hall.children) {
        const startOffsetH = dayjs(c.startTime).diff(dayStart, 'minute') / 60
        const endOffsetH = dayjs(c.endTime).diff(dayStart, 'minute') / 60
        if (startOffsetH < minH) minH = Math.floor(startOffsetH)
        if (endOffsetH > maxH) maxH = Math.ceil(endOffsetH)
      }
    }
    const s = Math.max(0, minH)
    const e = Math.min(48, Math.max(s + 4, maxH))
    const hs: number[] = []
    for (let i = s; i <= e; i++) hs.push(i)
    return { startHour: s, endHour: e, hours: hs }
  }, [data, dayStart])

  const totalHours = endHour - startHour
  const timelineWidth = totalHours * HOUR_WIDTH

  // 当前时间红线（仅查看的日期 = 今天时显示）
  const todayStr = dayjs().format('YYYY-MM-DD')
  const viewDayStr = dayStart.format('YYYY-MM-DD')
  const isToday = todayStr === viewDayStr
  const nowOffsetMin = dayjs().diff(dayStart, 'minute')
  const nowLeftPx = (nowOffsetMin / 60 - startHour) * HOUR_WIDTH
  const showNowLine = isToday && nowLeftPx >= 0 && nowLeftPx <= timelineWidth

  // 切日期 / 视图切回甘特时，自动横向滚到当前时间附近
  const scrollToNow = useCallback(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollLeft = showNowLine ? Math.max(0, nowLeftPx - 200) : 0
  }, [showNowLine, nowLeftPx])

  useEffect(() => {
    scrollToNow()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, data.length])

  // 滚轮转横滚：当甘特本身没有纵向溢出（影厅少时）让 wheel 直接驱动 scrollLeft；
  // 影厅多需要纵滚时保留默认行为，按 Shift+wheel 横滚（标准浏览器约定）
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const canScrollVert = el.scrollHeight - el.clientHeight > 1
      if (e.shiftKey) {
        e.preventDefault()
        el.scrollLeft += e.deltaY || e.deltaX
        return
      }
      if (!canScrollVert && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [data.length])

  // 图例：每个状态一个圆点 + 文字，让用户一眼知道颜色含义
  const legendItems: Array<{ status: 1 | 2 | 3; emphasis?: boolean }> = [
    { status: 1 },
    { status: 2, emphasis: true },
    { status: 3 }
  ]

  const renderLegend = () => (
    <div className="gantt-legend" role="list" aria-label="status legend">
      {legendItems.map(({ status, emphasis }) => {
        const c = getStatusStyle(status)
        return (
          <span
            key={status}
            role="listitem"
            className={`gantt-legend-item ${emphasis ? 'is-emphasis' : ''}`}
          >
            <span
              className="gantt-legend-dot"
              style={{ background: c.accent }}
            />
            {getStatusLabel(status)}
          </span>
        )
      })}
      <span className="gantt-legend-divider" />
      <span className="gantt-legend-item is-closed-sample">
        <span className="gantt-legend-dot gantt-legend-dot-closed" />
        {closedLabel ?? '未公開'}
      </span>
      <span className="gantt-legend-spacer" />
      {showNowLine ? (
        <Button
          size="small"
          type="text"
          icon={<AimOutlined />}
          onClick={scrollToNow}
          className="gantt-legend-action"
        >
          {dayjs().format('HH:mm')}
        </Button>
      ) : null}
      <span className="gantt-legend-hint" aria-hidden>
        滚轮横滚 · Shift+滚轮 横滚
      </span>
    </div>
  )

  if (data.length === 0) {
    return (
      <div className="gantt-empty-wrap">
        {renderLegend()}
        <div className="gantt-empty">
          <Empty description={emptyText ?? 'No data'} />
        </div>
      </div>
    )
  }

  return (
    <>
      {renderLegend()}
      <div className="gantt-scroll" ref={scrollRef}>
      <div
        className="gantt-grid"
        style={
          {
            '--gantt-hall-width': `${HALL_LABEL_WIDTH}px`,
            '--gantt-timeline-width': `${timelineWidth}px`,
            '--gantt-row-height': `${ROW_HEIGHT}px`,
            gridTemplateColumns: `${HALL_LABEL_WIDTH}px ${timelineWidth}px`
          } as React.CSSProperties
        }
      >
        {/* 左上角空格 */}
        <div className="gantt-cell gantt-corner">
          <span>{hallColumnTitle ?? 'Theater'}</span>
        </div>

        {/* 顶部时间轴 */}
        <div className="gantt-cell gantt-header-timeline">
          {hours.map((h) => (
            <div
              key={h}
              className={`gantt-hour-tick ${h % 2 === 0 ? 'major' : 'minor'} ${h >= 24 ? 'is-next-day' : ''}`}
              style={{ left: (h - startHour) * HOUR_WIDTH, width: HOUR_WIDTH }}
            >
              <span className="gantt-hour-label">
                {/* 跨日小时按电影院"営業日"惯例展示（25:00 = 次日 01:00），方便判断跨夜场次 */}
                {String(h).padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>

        {/* 每个影厅一行 */}
        {data.map((hall, rowIdx) => (
          <React.Fragment key={hall.id}>
            <div className="gantt-cell gantt-hall-label">
              <span className="gantt-hall-name" title={hall.name}>
                {hall.name}
              </span>
              <span className="gantt-hall-count">{hall.children.length}</span>
            </div>
            <div
              className={`gantt-cell gantt-row-canvas ${
                rowIdx % 2 === 1 ? 'striped' : ''
              }`}
            >
              {/* 背景小时网格线 */}
              {hours.map((h) => (
                <div
                  key={h}
                  className={`gantt-grid-line ${h % 2 === 0 ? 'major' : ''}`}
                  style={{ left: (h - startHour) * HOUR_WIDTH }}
                />
              ))}
              {/* 场次条 */}
              {hall.children.map((item) => {
                const startMin = dayjs(item.startTime).diff(dayStart, 'minute')
                const endMin = dayjs(item.endTime).diff(dayStart, 'minute')
                const leftPx = (startMin / 60 - startHour) * HOUR_WIDTH
                const widthPx = Math.max(
                  MIN_BAR_WIDTH,
                  ((endMin - startMin) / 60) * HOUR_WIDTH
                )
                const colors = getStatusStyle(item.status)
                const closed = !item.open
                const statusLabel = getStatusLabel(item.status)
                const { items, onClick: onMenuClick } = buildMenuItems(item)

                return (
                  <Dropdown
                    menu={{ items, onClick: onMenuClick }}
                    trigger={['contextMenu']}
                    key={item.id}
                  >
                    <Tooltip
                      placement="top"
                      mouseEnterDelay={0.35}
                      title={
                        <div className="gantt-tip">
                          <div className="gantt-tip-title">
                            {item.movieName}
                          </div>
                          <div className="gantt-tip-row">
                            <span className="gantt-tip-time">
                              {dayjs(item.startTime).format('HH:mm')} -{' '}
                              {dayjs(item.endTime).format('HH:mm')}
                            </span>
                            <Tag
                              color={
                                item.status === 1
                                  ? 'cyan'
                                  : item.status === 2
                                  ? 'processing'
                                  : 'default'
                              }
                              className="gantt-tip-tag"
                            >
                              {statusLabel}
                            </Tag>
                            {closed ? (
                              <Tag color="warning" className="gantt-tip-tag">
                                {closedLabel ?? '未公開'}
                              </Tag>
                            ) : null}
                          </div>
                          {item.specName ? (
                            <div className="gantt-tip-row">{item.specName}</div>
                          ) : null}
                          <div className="gantt-tip-row">
                            {item.selectedSeatCount || 0}/{item.seatCount || 0}（
                            {item.seatCount && item.seatCount > 0
                              ? Math.round(
                                  ((item.selectedSeatCount || 0) /
                                    item.seatCount) *
                                    100
                                )
                              : 0}
                            %）
                          </div>
                        </div>
                      }
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label={`${item.movieName} ${dayjs(item.startTime).format('HH:mm')} ${statusLabel}`}
                        className={`gantt-bar status-${item.status} ${
                          closed ? 'is-closed' : ''
                        } ${item.status === 2 ? 'is-playing' : ''}`}
                        style={{
                          left: leftPx,
                          width: widthPx,
                          background: colors.bg,
                          borderColor: colors.border,
                          color: colors.text
                        }}
                        onClick={() => onItemClick(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onItemClick(item)
                          }
                        }}
                      >
                        <span
                          className="gantt-bar-accent"
                          style={{ background: colors.accent }}
                        />
                        <span className="gantt-bar-time">
                          {dayjs(item.startTime).format('HH:mm')}
                        </span>
                        <span className="gantt-bar-title" title={item.movieName}>
                          {item.movieName}
                        </span>
                      </div>
                    </Tooltip>
                  </Dropdown>
                )
              })}
            </div>
          </React.Fragment>
        ))}

        {/* 当前时间红线，跨所有行 */}
        {showNowLine && (
          <div
            className="gantt-now-line"
            style={{
              left: HALL_LABEL_WIDTH + nowLeftPx,
              height: ROW_HEIGHT * data.length
            }}
          >
            <span className="gantt-now-badge">{dayjs().format('HH:mm')}</span>
          </div>
        )}
      </div>
      </div>
    </>
  )
}
