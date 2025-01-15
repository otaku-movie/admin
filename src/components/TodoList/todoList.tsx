import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import dayjs from 'dayjs'
import './style.scss'
import { CinemaScreeing, MovieShowTimeItem } from '@/api/request/cinema'

interface TodoListProps {
  date: dayjs.ConfigType
  data: CinemaScreeing[]
  render?: (data: MovieShowTimeItem, differentDay: boolean) => React.ReactNode
}

interface Task {
  data: MovieShowTimeItem
  differentDay: boolean
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
  const [differentDayTask, setDifferentDayTask] = useState<{
    [date: string]: Task[]
  }>({})
  const [oldDate, setOldDate] = useState(dayjs().format('YYYY-MM-DD'))

  const baseLeft = 40
  const hourHeight = 100

  const draw = (data: CinemaScreeing[]) => {
    const list = data.map((item, index) => {
      return {
        ...item,
        children: item.children.map((children) => {
          const hour = dayjs(children.startTime).hour()
          const minute = dayjs(children.startTime).minute()
          const endHour = dayjs(children.endTime).hour()
          const endMinute = dayjs(children.endTime).minute()
          const hourDifferent = endHour - hour
          const minuteDifferent = endMinute - minute

          // 判断是否跨天
          const startDateUnix = dayjs(
            dayjs(children.startTime).format('YYYY-MM-DD')
          ).unix()
          const endDateUnix = dayjs(dayjs(children.endTime)).unix()
          const differentDay = endDateUnix - startDateUnix > 86400

          // 结束时间减去上一天的0点如果大于86400，则说明是跨天的
          // if (differentDay) {
          //   differentDayList.push(children)
          //   setDifferentDayList([...differentDayList])
          // }

          const height = () => {
            if (differentDay) {
              // 如果是跨天任务，只计算到当天结束的时间
              const endOfDay = dayjs(children.startTime).endOf('day') // 当天结束时间
              const endHour = endOfDay.hour()
              const endMinute = endOfDay.minute()

              const hourDiff = endHour - hour
              const minuteDiff = endMinute - minute

              const minuteHeight = (minuteDiff / 60) * hourHeight
              return hourDiff * hourHeight + minuteHeight
            } else {
              // 非跨天任务按正常逻辑计算
              const minuteHeight = (minuteDifferent / 60) * hourHeight
              return (
                (hourDifferent < 1
                  ? minuteHeight
                  : hourDifferent * hourHeight + minuteHeight) - 4
              )
            }
          }

          return {
            data: children,
            differentDay: endDateUnix - startDateUnix > 86400,
            position: {
              top: 2 + hourHeight * hour + (minute / 60) * hourHeight + 'px',
              left:
                2 + tableCellRef.current!.offsetWidth * index + baseLeft + 'px',
              height: height() + 'px'
            }
          }
        })
      }
    })

    const flat = list.reduce(
      (total, item) => total.concat(item.children),
      [] as Task[]
    )
    const previousDate = dayjs(props.date)
      .subtract(1, 'day')
      .format('YYYY-MM-DD')
    const previousTasks = differentDayTask[previousDate] || []

    setTask([...previousTasks, ...flat])
  }

  const getDifferentDayTask = (data: CinemaScreeing[]): any[] => {
    const result: any[] = []
    data.forEach((item, index) => {
      item.children.forEach((children) => {
        // 判断是否跨天
        const startDateUnix = dayjs(
          dayjs(children.startTime).format('YYYY-MM-DD')
        ).unix()
        const endDateUnix = dayjs(dayjs(children.endTime)).unix()
        const differentDay = endDateUnix - startDateUnix > 86400

        if (differentDay) {
          result.push({
            arrayIndex: index,
            ...children
          })
        }
      })
    })

    return result
  }
  const drawTimeline = () => {
    const hour = dayjs().hour()
    const minute = dayjs().minute()
    const top = hourHeight * hour + (minute / 60) * hourHeight

    setTimelinePositionTop(top)
  }

  useEffect(() => {
    const currentDate = dayjs(props.date).format('YYYY-MM-DD')
    const nextDate = dayjs(props.date).add(1, 'day').format('YYYY-MM-DD')
    const previousDate = dayjs(props.date)
      .subtract(1, 'day')
      .format('YYYY-MM-DD')

    if (oldDate !== currentDate) {
      console.log(oldDate)
      setOldDate(dayjs(props.date).format('YYYY-MM-DD'))
      console.log(props.data)
      const differentResult = renderDifferentDayTask()

      differentDayTask[oldDate] = differentResult
      setDifferentDayTask({
        ...differentDayTask
      })

      const previousTasks = differentDayTask[previousDate] || []

      setTask([...previousTasks, ...task])
    }
    if (props.data && tableCellRef.current) {
      draw(props.data)
      drawTimeline()
    }

    // 每分钟更新一次时间
    const interval = setInterval(() => {
      drawTimeline()
    }, 1000 * 60)

    const resizeObserver = new ResizeObserver(() => {
      renderDifferentDayTask()
      draw(props.data)
      renderDifferentDayTask()
      drawTimeline()
    })

    resizeObserver.observe(document.body)

    return () => {
      resizeObserver.disconnect()
      clearInterval(interval)
    }
  }, [props.date, props.data])

  // useLayoutEffect(() => {
  //   const resizeObserver = new ResizeObserver(() => {
  //     renderDifferentDayTask()
  //     draw(props.data)
  //     renderDifferentDayTask()
  //     drawTimeline()
  //   })

  //   resizeObserver.observe(document.body)

  //   return () => {
  //     resizeObserver.disconnect()
  //     // clearInterval(interval)
  //   }
  // }, [])

  const renderDifferentDayTask = () => {
    const width = tableCellRef.current?.offsetWidth
    const result = getDifferentDayTask(props.data).reduce((total, current) => {
      const endDate = dayjs(current.endTime).format('YYYY-MM-DD')

      if (dayjs(props.date)!.format('YYYY-MM-DD') === endDate) {
        const hour = dayjs(endDate).hour()
        const minute = dayjs(endDate).minute()
        const endHour = dayjs(current.endTime).hour()
        const endMinute = dayjs(current.endTime).minute()
        const hourDifferent = endHour - hour
        const minuteDifferent = endMinute - minute

        const minuteHeight = (minuteDifferent / 60) * hourHeight
        const height =
          hourDifferent < 1
            ? minuteHeight
            : hourDifferent * hourHeight + minuteHeight - 6

        const left = width * current.arrayIndex
        console.log(width, current.arrayIndex)
        return total.concat({
          data: current,
          differentDay: true,
          position: {
            top: 3 + hourHeight * hour + (minute / 60) * hourHeight + 'px',
            left: 3 + left + baseLeft + 'px',
            height: height + 'px'
          }
        })
      } else {
        return total
      }
    }, [])
    return result
  }

  useLayoutEffect(() => {
    if (hourRef.current) {
      const hour = dayjs().hour()
      const tableCell = hourRef.current.children[0].children[hour]

      const pageContainer = document.getElementById('page-container')

      if (pageContainer) {
        pageContainer.scrollTop = tableCell.offsetTop
      }
    }
  }, [])

  return (
    <section
      style={
        {
          // width: '1200px',
          // minWidth: '1200px'
        }
      }
    >
      <section className="show-list-container">
        <section className="screening-container">
          <table className="hour-container" ref={hourRef}>
            <tbody>
              {Array(24)
                .fill(undefined)
                .map((_, index) => {
                  return (
                    <tr key={index}>
                      {Array(1)
                        .fill(undefined)
                        .map(() => {
                          const key = index

                          return <td key={key}>{key}</td>
                        })}
                    </tr>
                  )
                })}
            </tbody>
          </table>
          <table
            className="table-container"
            // style={{ width: 200 * props.data.length + 'px' }}
          >
            <tbody>
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
            </tbody>
          </table>
          <table className="right-table hour-container">
            <tbody>
              {Array(24)
                .fill(undefined)
                .map((_, index) => {
                  return (
                    <tr key={index}>
                      {Array(1)
                        .fill(undefined)
                        .map(() => {
                          const key = index

                          return <td key={key}>{key}</td>
                        })}
                    </tr>
                  )
                })}
            </tbody>
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
                  height: item.position.height,
                  backgroundColor: item.differentDay ? 'antiquewhite' : '#eee'
                }}
                key={`${item.data.id}-${index}`}
              >
                {props.render?.(item.data, item.differentDay)}
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
