'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from '@/app/i18n/client'
import {
  Button,
  ConfigProvider,
  Drawer,
  Form,
  FormInstance,
  InputNumber,
  Modal,
  Select,
  Space,
  Tag,
  message,
  Dropdown
} from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import './seatModal.scss'
import { SeatItem, Area } from '@/type/api'
import classNames from 'classnames'
import { AreaModal } from './AreaModal'
import { CheckPermission } from '@/components/checkPermission'
import * as wheelChair from '@/assets/font/wheelChair.svg'
import Image from 'next/image'

// import { Draw } from './store'

interface ModalProps {
  type: 'create' | 'edit'
  show?: boolean
  data?: any
  permission: 'configSeat' | 'selctSeat'
  onConfirm?: () => void
  onCancel?: () => void
}

interface seat {
  type: 'seat' | 'aisle'
  rowAxis?: number
  children: SeatItem[]
}

interface Aisle {
  type: 'row' | 'column'
  start: number
}

interface ModalState {
  show: boolean
  form: [FormInstance]
  data: Aisle[]
}

export default function SeatModal(props: ModalProps) {
  const [data, setData] = useState<seat[]>([])
  const [selectedSeat, setSelectedSeat] = useState<SeatItem[]>([])
  const [mousedown, setMousedown] = useState(false)
  const dragContainerRef = useRef<HTMLElement | null>(null)
  const seatContainerRef = useRef<HTMLElement | null>(null)
  const [dragSelected, setDragSelected] = useState<Set<string>>(new Set())
  const [hoverSelected, setHoverSelected] = useState<Set<string>>(new Set())
  const [showDropDown, setShowDropDown] = useState(false)
  const [maxSelectSeatCount, setMaxSelectSeatCount] = useState(0)
  const dragBoxRef = useRef({
    startX: 0,
    startY: 0,
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    rectLeft: 0,
    rectTop: 0
  })

  const [modal, setModal] = useState<ModalState>({
    show: false,
    form: Form.useForm(),
    data: []
  })
  const [area, setArea] = useState<Record<string, Set<string>>>({})

  const [areaModal, setAreaModal] = useState<{
    show: boolean
    data: Required<Area>[]
  }>({
    show: false,
    data: []
  })

  const { t } = useTranslation(
    navigator.language as languageType,
    'theaterHall'
  )
  const { t: common } = useTranslation(
    navigator.language as languageType,
    'common'
  )
  const size = 50
  const gap = 10

  const buildAisle = (arr = data, aisleData = modal.data) => {
    let updatedData = arr
      .filter((item) => item.type === 'seat')
      .map((item) => ({
        ...item,
        children: item.children.filter(
          (child: { type: string }) => child.type === 'seat'
        )
      }))

    aisleData.forEach((item) => {
      if (item.type === 'column' && updatedData.length !== 0) {
        // 构建列
        const findIndex = updatedData[0].children.findIndex(
          (child: any) => child.y === item.start
        )

        if (findIndex !== -1) {
          updatedData = updatedData.map((row) => {
            const newRow: any = [...row.children]
            newRow.splice(findIndex + 1, 0, { type: 'aisle' })
            return { ...row, children: newRow }
          })
        }
      } else if (item.type === 'row' && updatedData.length !== 0) {
        const findIndex = updatedData.findIndex(
          (row: any) => row.rowAxis === item.start
        )

        if (findIndex !== -1) {
          const newRow: { type: 'aisle'; children: SeatItem[] } = {
            type: 'aisle',
            children: []
          }
          updatedData.splice(findIndex + 1, 0, newRow)
        }
      }
    })

    return updatedData
  }

  // 鼠标按下事件处理函数
  const handleMouseDown = (e: MouseEvent) => {
    if (seatContainerRef.current) {
      const rect = seatContainerRef.current.getBoundingClientRect()

      if (e.clientX > rect.left - size / 2 && e.clientY > rect.top - size / 2) {
        setMousedown(true)

        dragBoxRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          left: e.pageX,
          top: e.pageY,
          width: 0,
          height: 0,
          rectLeft: rect.left,
          rectTop: rect.top
        }
      }
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (mousedown) {
      const width = Math.abs(e.pageX - dragBoxRef.current.startX)
      const height = Math.abs(e.pageY - dragBoxRef.current.startY)

      // 确保处理向上和向左拖拽时的逻辑
      const newLeft =
        e.pageX < dragBoxRef.current.startX
          ? e.pageX
          : dragBoxRef.current.startX
      const newTop =
        e.pageY < dragBoxRef.current.startY
          ? e.pageY
          : dragBoxRef.current.startY

      dragBoxRef.current = {
        ...dragBoxRef.current,
        left: newLeft,
        top: newTop,
        width,
        height
      }

      // 获取选中范围
      if (seatContainerRef.current) {
        const updatedData = data.map((item, index) => {
          return {
            ...item,
            children: item.children.map((children, childrenIndex) => {
              if (children.type === 'seat') {
                const startX = Math.min(dragBoxRef.current.startX, e.clientX)
                const startY = Math.min(dragBoxRef.current.startY, e.clientY)
                const endX = startX + dragBoxRef.current.width
                const endY = startY + dragBoxRef.current.height

                if (!children.left && !children.top) {
                  const childrenNode =
                    seatContainerRef.current!.children?.[index]?.children[
                      childrenIndex
                    ]
                  const rect = childrenNode.getBoundingClientRect()

                  children.left = rect.left
                  children.top = rect.top
                }

                const hover =
                  children.left &&
                  children.left >= startX &&
                  children.left &&
                  children.left <= endX &&
                  children.top &&
                  children.top >= startY &&
                  children.top &&
                  children.top <= endY

                const key = `${children.x}-${children.y}`
                if (hover) {
                  hoverSelected.add(key)
                }

                return {
                  ...children,
                  area: {
                    ...children.area,
                    hover
                  }
                }
              } else {
                return children
              }
            })
          }
        })

        setHoverSelected(hoverSelected)
        setData(updatedData)
      }
    }
  }
  // 鼠标抬起事件处理函数
  const handleMouseUp = () => {
    if (seatContainerRef.current) {
      if (hoverSelected.size === 0) {
        dragBoxRef.current = {
          ...dragBoxRef.current,
          left: 0,
          top: 0,
          width: 0,
          height: 0
        }
        setShowDropDown(false)
      } else {
        // setShowDropDown(true)
        const newDragSelected = new Set<string>(hoverSelected.values())
        const updatedData = data.map((item) => {
          return {
            ...item,
            children: item.children.map((children) => {
              const key = `${children.x}-${children.y}`

              return {
                ...children,
                area: {
                  ...children.area,
                  hover: dragSelected.has(key)
                  // selected: dragSelected.has(key)
                }
              }
            })
          }
        })
        console.log(hoverSelected)

        setShowDropDown(true)
        setDragSelected(newDragSelected)
        setData(updatedData)
        setHoverSelected(new Set())
        console.log(newDragSelected)
      }

      setHoverSelected(new Set())
      setMousedown(false)
    }
  }

  useEffect(() => {
    if (props.permission === 'configSeat') {
      window.addEventListener('mousedown', handleMouseDown)
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      if (props.permission === 'configSeat') {
        window.removeEventListener('mousedown', handleMouseDown)
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [mousedown, data])

  const getData = () => {
    const newSelectSeat: SeatItem[] = []
    http({
      url:
        props.permission === 'configSeat'
          ? 'theater/hall/seat/detail'
          : 'movie_show_time/select_seat/list',
      method: 'get',
      params: {
        theaterHallId: props.data.id,
        movieShowTimeId: props.data.movieShowTimeId
      }
    }).then((res) => {
      const result = res.data.seat.map((item: seat) => {
        return {
          ...item,
          type: 'seat',
          children: item.children.map((children: any) => {
            if (children.selected) {
              newSelectSeat.push(children)
            }
            if (children.area) {
              // eslint-disable-next-line
              area[children.area.name] = new Set([
                ...(area[children.area.name] || []),
                `${children.x}-${children.y}`
              ])
            }

            return {
              ...children,
              type: 'seat'
            }
          })
        }
      })
      setSelectedSeat(newSelectSeat)
      setMaxSelectSeatCount(res.data.maxSelectSeatCount)
      setModal({
        ...modal,
        data: res.data.aisle
      })
      setAreaModal({
        ...areaModal,
        data: res.data.area
      })

      const aisle = buildAisle(result, res.data.aisle)
      setData(aisle)
    })
  }

  useEffect(() => {
    if (props.show) {
      getData()
      // const result = generate2DArray()
      // const aisle = buildAisle(result)
      // setData(buildPosition(aisle))
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.show])

  const style = {
    display: 'grid',
    gridTemplateColumns: `repeat(${data?.[0]?.children?.length || 0}, ${size}px)`,
    gridTemplateRows: size + 'px',
    gap: gap + 'px'
  }

  const seatCount = useMemo(() => {
    return data.reduce((total, current) => {
      return total + current.children.filter((children) => children.show).length
    }, 0)
  }, [data])

  return (
    <>
      <ConfigProvider
        theme={{
          components: {
            Drawer: {
              footerPaddingBlock: 16
            }
          }
        }}
      >
        <Drawer
          title={`${t('seatModal.seatCount')}：${seatCount}`}
          placement="right"
          open={props.show}
          maskClosable={false}
          onClose={props.onCancel}
          width={'fit-content'}
          footer={
            props.permission === 'configSeat' ? (
              <Space>
                <Button
                  type="primary"
                  onClick={() => {
                    setModal({
                      ...modal,
                      show: true
                    })
                  }}
                >
                  {common('button.configAisle')}
                </Button>
                <Button
                  type="primary"
                  onClick={() => {
                    setAreaModal({
                      ...areaModal,
                      show: true
                    })
                  }}
                >
                  {common('button.configArea')}
                </Button>
              </Space>
            ) : null
          }
          extra={
            <Space>
              <Button onClick={props?.onCancel}>
                {common('button.cancel')}
              </Button>
              {props.permission === 'selctSeat' ? (
                <Button
                  type="primary"
                  onClick={() => {
                    http({
                      url: 'movie_show_time/select_seat/save',
                      method: 'post',
                      data: {
                        theaterHallId: props.data.id,
                        movieShowTimeId: props.data.movieShowTimeId,
                        seatPosition: selectedSeat.map((item) => {
                          return {
                            x: item.x,
                            y: item.y
                          }
                        })
                      }
                    }).then(() => {
                      props.onConfirm?.()
                    })
                  }}
                >
                  {common('button.saveSelectSeat')}
                </Button>
              ) : null}
              {props.permission === 'configSeat' ? (
                <CheckPermission code="theaterHall.saveSeatConfig">
                  <Button
                    type="primary"
                    onClick={() => {
                      http({
                        url: 'theater/hall/seat/save',
                        method: 'post',
                        data: {
                          theaterHallId: props.data.id,
                          seat: data.reduce((total: SeatItem[], current) => {
                            if (current.type === 'seat') {
                              return total.concat(
                                ...current.children.filter((children) => {
                                  return children.type === 'seat'
                                })
                              )
                            }
                            return total
                          }, []),
                          area: areaModal.data.map((item) => {
                            return {
                              ...item,
                              seat: [...area[item.name]]
                            }
                          }),
                          aisle: modal.data
                        }
                      }).then(() => {
                        props.onConfirm?.()
                      })
                    }}
                  >
                    {common('button.saveSeatConfig')}
                  </Button>
                </CheckPermission>
              ) : null}
            </Space>
          }
        >
          {/* 拖动创建的容器 */}
          <Dropdown
            menu={{
              onClick({ key }) {
                console.log(dragSelected)
                switch (key) {
                  case '1':
                    setShowDropDown(false)
                    setAreaModal({
                      ...areaModal,
                      show: true
                    })
                    break
                  case '2':
                    // 情侣座
                    if (dragSelected.size > 1) {
                      const position: string[][] = []
                      for (const item of dragSelected.keys()) {
                        position.push(item.split('-') as unknown as string[])
                      }

                      const every = position.every((item) => {
                        return position[0][0] === item[0]
                      })

                      console.log(every, position, position.join('-'))
                      if (every) {
                        setData(
                          data.map((item) => {
                            return {
                              ...item,
                              children: item.children.map((children) => {
                                const key = `${children.x}-${children.y}`

                                if (dragSelected.has(key)) {
                                  return {
                                    ...children,
                                    seatPositionGroup: position.join('-')
                                  }
                                } else {
                                  return children
                                }
                              })
                            }
                          })
                        )
                      }
                    }

                    break
                  case '3':
                    // 轮椅座
                    setData(
                      data.map((item) => {
                        return {
                          ...item,
                          children: item.children.map((children) => {
                            const key = `${children.x}-${children.y}`

                            if (dragSelected.has(key)) {
                              return {
                                ...children,
                                wheelChair: true
                              }
                            } else {
                              return children
                            }
                          })
                        }
                      })
                    )
                    break
                  case '4':
                    // 是否显示
                    setData(
                      data.map((item) => {
                        return {
                          ...item,
                          children: item.children.map((children) => {
                            const key = `${children.x}-${children.y}`

                            if (dragSelected.has(key)) {
                              if (
                                children.area?.name &&
                                area[children.area?.name]
                              ) {
                                area[children.area.name].delete(key)
                              }

                              return {
                                ...children,
                                show: !children.show,
                                area: {
                                  hover: false,
                                  selected: false
                                }
                              }
                            } else {
                              return children
                            }
                          })
                        }
                      })
                    )
                    setArea(area)
                    break
                  case '5':
                    // 5 是否禁用
                    setData(
                      data.map((item) => {
                        return {
                          ...item,
                          children: item.children.map((children) => {
                            const key = `${children.x}-${children.y}`

                            if (dragSelected.has(key)) {
                              console.log(children)
                              if (
                                children.area?.name &&
                                area[children.area.name!]
                              ) {
                                area[children.area.name].delete(key)
                              }

                              return {
                                ...children,
                                disabled: !children.disabled,
                                area: {
                                  hover: false,
                                  selected: false
                                }
                              }
                            } else {
                              return children
                            }
                          })
                        }
                      })
                    )
                    setArea(area)
                    break
                  case '6':
                    setData(
                      data.map((item) => {
                        return {
                          ...item,
                          children: item.children.map((children) => {
                            const key = `${children.x}-${children.y}`

                            if (dragSelected.has(key)) {
                              console.log(children)
                              if (
                                children.area?.name &&
                                area?.[children.area.name]
                              ) {
                                area?.[children.area?.name].delete(key)
                              }

                              return {
                                ...children,
                                show: true,
                                disabled: false,
                                wheelChair: false,
                                seatPositionGroup: null,
                                area: {
                                  hover: false,
                                  selected: false
                                }
                              }
                            } else {
                              return children
                            }
                          })
                        }
                      })
                    )
                    setArea(area)
                    break
                }
              },
              items: [
                {
                  label: t('seatModal.dropdownItem.configArea'),
                  key: '1'
                },
                {
                  label: t('seatModal.dropdownItem.configCoupleSeat'),
                  key: '2'
                },
                {
                  label: t('seatModal.dropdownItem.configWheelChairSeat'),
                  key: '3'
                },
                {
                  label: t('seatModal.dropdownItem.show'),
                  key: '4'
                },
                {
                  label: t('seatModal.dropdownItem.disabled'),
                  key: '5'
                },
                {
                  label: t('seatModal.dropdownItem.reset'),
                  key: '6'
                }
              ]
            }}
            open={showDropDown}
          >
            <section
              ref={dragContainerRef}
              className="drag-container"
              style={{
                width: dragBoxRef.current.width + 'px',
                height: dragBoxRef.current.height + 'px',
                top: dragBoxRef.current.top + 'px',
                left: dragBoxRef.current.left + 'px'
              }}
            ></section>
          </Dropdown>
          <section className="seat-container">
            <ul className="selected-seat">
              {selectedSeat.map((item, index: number) => {
                return (
                  <Tag
                    key={`${item.x}-${item.y}`}
                    closable
                    onClose={() => {
                      if (item.seatPositionGroup) {
                        const position = new Set(
                          item.seatPositionGroup.split('-')
                        )

                        data[item.x].children.forEach((item) => {
                          const selected = position.has(`${item.x},${item.y}`)

                          if (selected) {
                            item.selected = false
                          }
                        })
                        const filter = selectedSeat.filter((item) => {
                          return !position.has(`${item.x},${item.y}`)
                        })
                        setSelectedSeat(filter)
                        setData([...data])
                      } else {
                        selectedSeat.splice(index, 1)
                        const findXAxis = data.findIndex(
                          (row) => row.rowAxis === item.x
                        )
                        const findYAxis = data[findXAxis].children.findIndex(
                          (children: any) => children.y === item.y
                        )

                        if (findXAxis !== -1 && findYAxis !== -1) {
                          data[findXAxis].children[findYAxis].selected = false
                          setData([...data])
                        }
                        setSelectedSeat([...selectedSeat])
                      }
                    }}
                  >
                    {item.x + 1}排{item.y + 1}座
                  </Tag>
                )
              })}
            </ul>
            <ul className="seat-area">
              {areaModal.data.map((item, index) => {
                return (
                  <li key={index}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '14px',
                        height: '14px',
                        borderRadius: '4px',
                        border: `2px solid ${item.color}`,
                        boxSizing: 'border-box',
                        verticalAlign: 'middle',
                        marginRight: '4px'
                      }}
                    ></span>
                    <span style={{ verticalAlign: 'middle' }}>
                      {item.name}：{item.price}円
                    </span>
                  </li>
                )
              })}
            </ul>

            <section
              className="section"
              style={{
                gridTemplateColumns: `${size}px 1fr`,
                gridTemplateRows: size + 'px'
              }}
            >
              <ul
                className="seat-number-left"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: gap + 'px',
                  marginTop: size + gap * 2 + 'px'
                }}
              >
                {data?.map((item, index) => {
                  return (
                    <li
                      key={index}
                      className="seat-row-column"
                      style={{
                        width: size + 'px',
                        height: size + 'px'
                      }}
                    >
                      {item.rowAxis! + 1 ? item.rowAxis : ''}
                    </li>
                  )
                })}
              </ul>
              <section className="middle">
                <section
                  className="seat-number-top"
                  style={{
                    ...style,
                    marginBottom: gap + 'px'
                  }}
                >
                  {data?.[0]?.children?.map((children: any, index: number) => {
                    return (
                      <div key={index} className="seat-row-column">
                        {children.columnName}
                      </div>
                    )
                  })}
                </section>
                <ul
                  className="seat"
                  // style={style}
                  ref={seatContainerRef}
                  onClick={(e) => {
                    const el = e.target as HTMLElement
                    const dataset = el.dataset

                    const singleSelect = (x: number, y: number) => {
                      if (selectedSeat.length < maxSelectSeatCount) {
                        data[x].children[y].selected =
                          !data[x].children[y].selected

                        if (data[x].children[y].selected) {
                          selectedSeat.push(data[x].children[y])
                          setSelectedSeat([...selectedSeat])
                        } else {
                          const findIndex = selectedSeat.findIndex((item) => {
                            return (
                              item.x === data[x].children[y].x &&
                              item.y === data[x].children[y].y
                            )
                          })

                          if (findIndex !== -1) {
                            selectedSeat.splice(findIndex, 1)
                            setSelectedSeat([...selectedSeat])
                          }
                        }

                        setData([...data])
                      } else {
                        // 如果是选过的，在点击就可以取消，否则就提示不能超过最大值
                        const findIndex = selectedSeat.findIndex((item) => {
                          return (
                            item.x === data[x].children[y].x &&
                            item.y === data[x].children[y].y
                          )
                        })
                        if (findIndex !== -1) {
                          selectedSeat.splice(findIndex, 1)
                          data[x].children[y].selected = false
                          setSelectedSeat([...selectedSeat])
                        } else {
                          message.warning(
                            t('seatModal.message.max', {
                              max: maxSelectSeatCount
                            })
                          )
                        }
                      }
                    }

                    const doubleSelect = (x: number, y: number) => {
                      const split =
                        data[x].children[y].seatPositionGroup?.split('-')
                      const position = new Set(split)

                      console.log(split, selectedSeat)

                      if (data[x].children[y].selected) {
                        // 如果选中，就取消
                        data[x].children.forEach((item) => {
                          const selected = position.has(`${item.x},${item.y}`)

                          if (selected) {
                            item.selected = false
                          }
                        })
                        const filter = selectedSeat.filter((item) => {
                          return !position.has(`${item.x},${item.y}`)
                        })
                        setSelectedSeat(filter)
                        setData([...data])
                      } else if (
                        split &&
                        split.length + selectedSeat.length > maxSelectSeatCount
                      ) {
                        message.warning(t('seatModal.message.max', { max: 5 }))
                      } else {
                        data[x].children.forEach((item) => {
                          const selected = position.has(`${item.x},${item.y}`)
                          if (selected) {
                            item.selected = selected
                          }
                        })
                        const filter = data[x].children.filter((item) => {
                          return position.has(`${item.x},${item.y}`)
                        })
                        const newSelect = [...selectedSeat, ...filter]
                        setSelectedSeat(newSelect)
                        setData([...data])
                        console.log(newSelect)
                      }
                    }

                    if (dataset.rowIndex && dataset.columnIndex) {
                      const x = +dataset.rowIndex
                      const y = +dataset.columnIndex

                      if (!data[x].children[y].disabled) {
                        if (data[x].children[y].seatPositionGroup) {
                          doubleSelect(x, y)
                        } else {
                          singleSelect(x, y)
                        }
                      }
                    }
                  }}
                >
                  {data?.map((item, index) => {
                    let childrenIndex = 0
                    const gridTemplateColumns = []

                    while (childrenIndex < data?.[0]?.children.length) {
                      const current = data?.[0]?.children[childrenIndex]

                      if (current.seatPositionGroup) {
                        const split = current.seatPositionGroup.split('-')
                        const w = size * 3 + gap * 3
                        childrenIndex++

                        gridTemplateColumns.push(w / split.length + 'px')
                      } else {
                        childrenIndex++
                        gridTemplateColumns.push(size + gap + 'px')
                      }
                    }

                    return (
                      <li
                        key={index}
                        className="seat-row"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: gridTemplateColumns.join(' '),
                          gridTemplateRows: size + 'px'
                        }}
                      >
                        {item.children?.map(
                          (children: any, childrenIndex: number) => {
                            if (children.type === 'seat') {
                              const position =
                                children.seatPositionGroup?.split('-')
                              const key = `${children.x},${children.y}`

                              return (
                                <div
                                  key={childrenIndex}
                                  className={classNames(
                                    'seat-row-column',
                                    children.selected
                                      ? 'seat-selceted'
                                      : 'seat-not-selected',
                                    {
                                      'seat-disabled': children.disabled,
                                      'seat-area-hover':
                                        children.area?.hover ||
                                        children.area?.selected
                                    }
                                  )}
                                  style={{
                                    boxSizing: 'border-box',
                                    marginLeft:
                                      position && position[0] === key
                                        ? '0px'
                                        : '-1.5px',
                                    marginRight:
                                      position &&
                                      position.includes(key) &&
                                      position[position.length - 1] !== key
                                        ? '0px'
                                        : gap + 'px',
                                    visibility: children.show
                                      ? 'visible'
                                      : 'hidden',
                                    ...(children.area?.name
                                      ? {
                                          borderColor: children.area.color
                                        }
                                      : {})
                                  }}
                                  data-row-index={index}
                                  data-column-index={childrenIndex}
                                >
                                  <div>
                                    {children.wheelChair ? (
                                      <Image
                                        src={wheelChair}
                                        width={40}
                                      ></Image>
                                    ) : (
                                      key
                                    )}
                                  </div>
                                </div>
                              )
                            } else {
                              return <div key={childrenIndex}></div>
                            }
                          }
                        )}
                      </li>
                    )
                  })}
                </ul>
                <section
                  className="seat-number-bottom"
                  style={{
                    ...style,
                    marginBottom: gap + 'px'
                  }}
                >
                  {data[0]?.children?.map((children: any, index: number) => {
                    return (
                      <div key={index} className="seat-row-column">
                        {children.columnName}
                      </div>
                    )
                  })}
                </section>
              </section>
            </section>
          </section>
        </Drawer>
      </ConfigProvider>
      <Modal
        title={t('seatModal.titlle')}
        open={modal.show}
        width="550px"
        onOk={() => {
          modal.form[0].validateFields().then(() => {
            setModal({
              ...modal,
              show: false
            })
            setData(buildAisle())
          })
        }}
        onCancel={() => {
          setModal({
            ...modal,
            show: false
          })
        }}
        maskClosable={false}
      >
        <Form
          name="basic"
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 16 }}
          form={modal.form[0]}
        >
          <Form.Item
            wrapperCol={{ offset: 4 }}
            required={true}
            name={['type', 'start']}
            rules={[
              {
                required: true,
                validator() {
                  const every = modal.data.every((item) => {
                    return item.type && item.start
                  })

                  return every
                    ? Promise.resolve()
                    : Promise.reject(new Error(t('seatModal.message.required')))
                }
              },
              {
                required: true,
                validator() {
                  const row = modal.data.filter((item) => item.type === 'row')
                  const column = modal.data.filter(
                    (item) => item.type === 'column'
                  )
                  const rowSet = new Set(row.map((item) => item.start))
                  const columnSet = new Set(column.map((item) => item.start))

                  if (
                    rowSet.size !== row.length ||
                    columnSet.size !== column.length
                  ) {
                    return Promise.reject(
                      new Error(t('seatModal.message.repeat'))
                    )
                  } else {
                    return Promise.resolve()
                  }
                }
              }
            ]}
          >
            <Space direction="vertical" size={15}>
              {modal.data.map((item: any, index: number) => {
                return (
                  <Space size={15} key={item.id}>
                    <Select
                      value={item.type}
                      style={{
                        width: '200px'
                      }}
                      placeholder={t('seatModal.form.type.placeholder')}
                      onChange={(val) => {
                        modal.data[index].type = val

                        setModal({
                          ...modal,
                          data: modal.data
                        })
                      }}
                    >
                      <Select.Option value="row">
                        {t('seatModal.form.type.select.row')}
                      </Select.Option>
                      <Select.Option value="column">
                        {t('seatModal.form.type.select.column')}
                      </Select.Option>
                    </Select>
                    <InputNumber
                      min={1}
                      max={props.data.columnCount}
                      value={item.start}
                      precision={0}
                      placeholder={t('seatModal.form.start.placeholder')}
                      style={{
                        width: '150px'
                      }}
                      onChange={(val) => {
                        modal.data[index].start = val

                        setModal({
                          ...modal,
                          data: modal.data
                        })
                      }}
                    />
                    <MinusCircleOutlined
                      onClick={() => {
                        modal.data.splice(index, 1)

                        setModal({
                          ...modal,
                          data: modal.data
                        })
                      }}
                    />
                  </Space>
                )
              })}
              <Button
                type="dashed"
                style={{
                  width: '100%'
                }}
                onClick={() => {
                  modal.data.push({
                    id: modal.data.length,
                    status: false
                  } as never)
                  setModal({
                    ...modal,
                    data: modal.data
                  })
                }}
                icon={<PlusOutlined />}
              >
                {common('button.add')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      <AreaModal
        show={areaModal.show}
        data={areaModal.data}
        onCancel={() => {
          setAreaModal({
            ...areaModal,
            show: false
          })
        }}
        onConfirm={(result) => {
          setAreaModal({
            ...areaModal,
            data: result.data,
            show: false
          })

          const selected = result.selected[0]
          area[selected.name!] = dragSelected
          const map = data.map((item) => {
            return {
              ...item,
              children: item.children.map((children) => {
                const key = `${children.x}-${children.y}`

                if (dragSelected.has(key)) {
                  return {
                    ...children,
                    area: {
                      ...area,
                      ...result.selected[0]
                    }
                  }
                } else {
                  return children
                }
              })
            }
          })

          setArea({ ...area })
          setDragSelected(new Set())
          setData(map as seat[])
        }}
      ></AreaModal>
    </>
  )
}
