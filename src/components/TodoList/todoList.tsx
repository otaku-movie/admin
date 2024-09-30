import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { Space, Switch, Tag, Dropdown, MenuProps, message } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import './style.scss'
import { CinemaScreeing, MovieShowTimeItem } from '@/api/request/cinema'
import { Dict } from '../dict'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'

interface TodoListProps {
  data: CinemaScreeing[]
}

interface Task {
  data: MovieShowTimeItem
  position: {
    top: string
    left: string
    height: string
  }
}

export function TodoList(props: TodoListProps) {
  const tableCellRef = useRef<any>(null)
  const hourRef = useRef<any>(null)
  const [task, setTask] = useState<Task[]>([])
  const [timelinePositionTop, setTimelinePositionTop] = useState(0)
  const { t: common } = useTranslation(
    navigator.language as languageType,
    'common'
  )
  const i18nWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ]

  const baseLeft = 40
  const hourHeight = 100

  const draw = (data: CinemaScreeing[]) => {
    const result = data.map((item, index) => {
      return {
        ...item,
        children: item.children.map((children) => {
          const hour = dayjs(children.startTime).hour()
          const minute = dayjs(children.startTime).minute()
          const endHour = dayjs(children.endTime).hour()
          const endMinute = dayjs(children.endTime).minute()
          const hourDifferent = endHour - hour
          const minuteDifferent = endMinute - minute

          const minuteHeight = (minuteDifferent / 60) * hourHeight

          return {
            data: children,
            position: {
              top: 3 + hourHeight * hour + (minute / 60) * hourHeight + 'px',
              left:
                3 + tableCellRef.current!.offsetWidth * index + baseLeft + 'px',
              height:
                (hourDifferent < 1
                  ? minuteHeight
                  : hourDifferent * hourHeight + minuteHeight) -
                6 +
                'px'
            }
          }
        })
      }
    })

    const flat = result.reduce(
      (total, item) => total.concat(item.children),
      [] as Task[]
    )

    setTask(flat)
  }

  const drawTimeline = () => {
    const hour = dayjs().hour()
    const minute = dayjs().minute()
    const top = hourHeight * hour + (minute / 60) * hourHeight

    setTimelinePositionTop(top)
  }

  useEffect(() => {
    if (props.data && tableCellRef.current) {
      draw(props.data)
      drawTimeline()
    }

    // 每分钟更新一次时间
    const interval = setInterval(() => {
      drawTimeline()
    }, 1000 * 60)

    const resizeObserver = new ResizeObserver(() => {
      draw(props.data)
      drawTimeline()
    })

    resizeObserver.observe(document.body)

    return () => {
      resizeObserver.disconnect()
      clearInterval(interval)
    }
  }, [props.data])

  useLayoutEffect(() => {
    if (hourRef.current) {
      const hour = dayjs().hour()
      const tableCell = hourRef.current.children[hour]

      const pageContainer = document.getElementById('page-container')

      if (pageContainer) {
        pageContainer.scrollTop = tableCell.offsetTop
      }
    }
  }, [])

  const key = i18nWeek[dayjs().day()]

  return (
    <section>
      <ul className="nav-container">
        <li>
          <LeftOutlined />
        </li>
        <li>
          {dayjs().format('YYYY-MM-DD')}（{common(`week.${key}`)}）
        </li>
        <li>
          <RightOutlined />
        </li>
      </ul>
      <ul
        className="table-header"
        style={{
          gridTemplateColumns: `40px repeat(${props.data.length}, 1fr) 40px`
        }}
      >
        <li>
          <LeftOutlined />
        </li>
        {props.data.map((item) => {
          return <li key={item.id}>{item.name}</li>
        })}
        <li>
          <RightOutlined />
        </li>
      </ul>
      <section className="show-list-container">
        <section className="screening-container">
          <table className="hour-container" ref={hourRef}>
            {Array(24)
              .fill(undefined)
              .map((_, index) => {
                return (
                  <tr key={index}>
                    {Array(1)
                      .fill(undefined)
                      .map((_) => {
                        const key = index

                        return <td key={key}>{key}</td>
                      })}
                  </tr>
                )
              })}
          </table>
          <table className="table-container">
            {Array(24 * 2)
              .fill(undefined)
              .map((_, index) => {
                return (
                  <tr key={index}>
                    {props.data.map((_, childrenIndex) => {
                      const key = index + '-' + childrenIndex

                      return <td key={key} ref={tableCellRef}></td>
                    })}
                  </tr>
                )
              })}
          </table>
          <table className="right-table hour-container">
            {Array(24)
              .fill(undefined)
              .map((_, index) => {
                return (
                  <tr key={index}>
                    {Array(1)
                      .fill(undefined)
                      .map((_) => {
                        const key = index

                        return <td key={key}>{key}</td>
                      })}
                  </tr>
                )
              })}
          </table>
        </section>
        <section className="todo-list-container">
          {task.map((item, index) => {
            const onClick: MenuProps['onClick'] = ({ key }) => {
              message.info(`Click on item ${key}`)
            }

            const items: MenuProps['items'] = [
              {
                label: common('button.edit'),
                key: 'edit'
              },
              {
                label: common('button.remove'),
                danger: true,
                key: 'remove'
              }
            ]

            return (
              <Dropdown
                menu={{ items, onClick }}
                key={item.data.id}
                trigger={['contextMenu']}
              >
                <div
                  className={`todo todo-${index}`}
                  style={{
                    top: item.position.top,
                    left: item.position.left,
                    width: `calc((100% - 100px) / ${props.data.length})`,
                    height: item.position.height
                  }}
                >
                  <div>
                    <Tag color="blue">
                      <Dict
                        code={item.data.status}
                        name={'cinemaPlayState'}
                      ></Dict>
                    </Tag>
                    <span className="movie-title">{item.data.movieName}</span>
                  </div>

                  <ul>
                    <li>
                      <span>公开：</span>
                      <Switch
                        size="small"
                        value={item.data.open}
                        onChange={(val) => {}}
                      />
                    </li>
                    <li>
                      <span>选座比：</span>
                      <span>
                        {item.data.seatCount}/{item.data.selectedSeatCount}{' '}
                        {item.data.selectedSeatCount ||
                          0 / item.data.seatCount ||
                          0}
                        %
                      </span>
                    </li>
                    <li>
                      <Space wrap size={5}>
                        <Tag color="#2db7f5">字幕</Tag>
                        <Tag color="#2db7f5">最速上映</Tag>
                        <Tag color="#2db7f5">舞台挨拶</Tag>
                      </Space>
                    </li>
                  </ul>
                </div>
              </Dropdown>
            )
          })}
        </section>
        <section
          className="timeline"
          style={{
            top: timelinePositionTop + 'px'
          }}
        ></section>
      </section>
    </section>
  )
}
