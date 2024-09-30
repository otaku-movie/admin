import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import dayjs from 'dayjs'
import './style.scss'
import { CinemaScreeing, MovieShowTimeItem } from '@/api/request/cinema'

interface TodoListProps {
  data: CinemaScreeing[]
  render?: (data: MovieShowTimeItem) => React.ReactNode
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

  return (
    <section>
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
            return (
              <div
                className={`todo todo-${index}`}
                style={{
                  top: item.position.top,
                  left: item.position.left,
                  width: `calc((100% - 100px) / ${props.data.length})`,
                  height: item.position.height
                }}
                key={item.data.id}
              >
                {props.render?.(item.data)}
              </div>
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
