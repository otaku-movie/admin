'use client'
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  MouseEventHandler
} from 'react'
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
  Dropdown,
  Tooltip,
  Spin,
  Input
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
import { findDataset, numberToAlphabet } from '@/utils'
import { SelectSeatState } from '@/config/enum'
// import { Draw } from './store'
import Selecto from 'react-selecto'

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
  rowName?: string
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
  const dragContainerRef = useRef<HTMLElement | null>(null)
  const seatContainerRef = useRef<Selecto | null>(null)
  const [dragSelected, setDragSelected] = useState<Set<string>>(new Set())
  const [showDropDown, setShowDropDown] = useState(false)
  const [loading, setLoading] = useState(false)
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
    data: Area[]
  }>({
    show: false,
    data: []
  })
  const [seatNameModal, setSeatNameModal] = useState<{
    show: boolean
    form: [FormInstance]
    rule: string
  }>({
    rule: '',
    form: Form.useForm(),
    show: false
  })

  const { t } = useTranslation(
    navigator.language as languageType,
    'theaterHall'
  )
  const { t: common } = useTranslation(
    navigator.language as languageType,
    'common'
  )

  const size = 36
  const gap = 8

  // 生成字母选项的函数
  const generateLetterOptions = (count: number) => {
    const options = []
    for (let i = 1; i <= count; i++) {
      const letter = numberToAlphabet(i)
      options.push({
        value: i,
        label: letter
      })
    }
    return options
  }

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
          updatedData.splice(findIndex, 0, newRow)
        }
      }
    })

    return updatedData
  }

  useEffect(() => {
    setSeatNameModal({
      ...seatNameModal,
      rule: props.data.seatNamingRules
    })
    seatNameModal.form[0].setFieldValue('rule', props.data.seatNamingRules)
  }, [props.data])

  const getData = () => {
    const newSelectSeat: SeatItem[] = []
    setLoading(true)
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
    })
      .then((res) => {
        const result = res.data.seat.map((item: seat) => {
          return {
            ...item,
            type: 'seat',
            children: item.children.map((children: any) => {
              if (
                children.selected &&
                children.selectSeatState === SelectSeatState.selected
              ) {
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
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    if (props.show) {
      getData()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.show])

  const seatCount = useMemo(() => {
    return data.reduce((total, current) => {
      return total + current.children.filter((children) => children.show).length
    }, 0)
  }, [data])

  const getSeatClass = (seat: SeatItem) => {
    const ClassName = ['seat-row-column', 'seat-not-selected']

    if (seat.disabled) {
      ClassName.push('seat-disabled')
    }
    if (seat.selected || seat.selectSeatState === SelectSeatState.selected) {
      ClassName.push('seat-selected')
    } else {
      if (seat.selectSeatState === SelectSeatState.locked) {
        ClassName.push('seat-locked')
      }
      if (seat.selectSeatState === SelectSeatState.sold) {
        ClassName.push('seat-sold')
      }
    }

    if (seat.area?.hover || seat.area?.selected) {
      ClassName.push('seat-area-hover')
    }

    return ClassName.join(' ')
  }
  const seatSelect = (e: React.MouseEvent<HTMLUListElement>) => {
    // setShowDropDown(false)
    const target = e.target as HTMLElement
    // 安全查找带有 data-row-index 的祖先元素
    // eslint-disabled-next-line @typescript-eslint/no-non-null-assertion
    const datasetElement = target.closest(
      '[data-seat-name]'
    ) as HTMLElement | null

    if (!datasetElement) return

    const findSeatXYByName = (seatName: string): [number, number] => {
      for (let i = 0; i < data.length; i++) {
        const j = data[i].children.findIndex((s) => s.seatName === seatName)
        if (j !== -1) return [i, j]
      }

      return [-1, -1]
    }

    const { rowIndex, columnIndex } = datasetElement.dataset

    if (!rowIndex || !columnIndex) return

    const [x, y] = findSeatXYByName(datasetElement.dataset.seatName as string)
    const seat = data[x]?.children[y]

    if (!seat || seat.disabled) return

    if (
      seat.selectSeatState === SelectSeatState.sold ||
      seat.selectSeatState === SelectSeatState.locked
    ) {
      message.warning(t('seatModal.seatUsed', { max: maxSelectSeatCount }))
      return
    }

    // ✅ 单人座选中/取消
    const singleSelect = () => {
      const newData = [...data]
      const seatItem = newData[x].children[y]

      let newSelected = [...selectedSeat]

      if (seatItem.selected) {
        // 取消选择
        seatItem.selected = false
        newSelected = newSelected.filter(
          (item) => !(item.x === seatItem.x && item.y === seatItem.y)
        )
      } else {
        // 选择座位
        if (newSelected.length >= maxSelectSeatCount) {
          message.warning(
            t('seatModal.message.max', { max: maxSelectSeatCount })
          )
          return
        }
        seatItem.selected = true
        newSelected.push(seatItem)
      }

      setData(newData)
      setSelectedSeat(newSelected)
    }

    // ✅ 情侣座选中/取消
    const doubleSelect = () => {
      const group = seat.seatPositionGroup?.split('-') || []
      const positionSet = new Set(group)

      const groupSeats = data[x].children.filter((item) =>
        positionSet.has(`${item.x},${item.y}`)
      )

      const newData = [...data]
      let newSelected = [...selectedSeat]

      if (seat.selected) {
        // 取消情侣座
        groupSeats.forEach((item) => (item.selected = false))
        newSelected = newSelected.filter(
          (item) => !positionSet.has(`${item.x},${item.y}`)
        )
      } else {
        // 选中情侣座前先判断是否超出上限
        if (groupSeats.length + selectedSeat.length > maxSelectSeatCount) {
          message.warning(
            t('seatModal.message.max', { max: maxSelectSeatCount })
          )
          return
        }

        // 选中情侣座
        groupSeats.forEach((item) => (item.selected = true))
        newSelected = [...selectedSeat, ...groupSeats]
      }

      setData(newData)
      setSelectedSeat(newSelected)
    }

    // ✅ 根据是否是情侣座决定调用哪个函数
    if (props.permission === 'selctSeat') {
      if (seat.seatPositionGroup) {
        doubleSelect()
      } else {
        singleSelect()
      }
    }
  }

  type SeatActionKey =
    | 'configArea'
    | 'configCoupleSeat'
    | 'configWheelChairSeat'
    | 'displaySeat'
    | 'disabledSeat'
    | 'reset'

  const seatAction = (key: SeatActionKey) => {
    const action = {
      configArea() {
        setShowDropDown(false)
        setAreaModal({
          ...areaModal,
          show: true
        })
      },
      configCoupleSeat() {
        // 情侣座
        if (dragSelected.size > 1) {
          const position: string[][] = []
          for (const item of dragSelected.keys()) {
            position.push(item.split('-') as unknown as string[])
          }

          const every = position.every((item) => {
            return position[0][0] === item[0]
          })

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
      },
      configWheelChairSeat() {
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
      },
      displaySeat() {
        // 是否显示
        setData(
          data.map((item) => {
            return {
              ...item,
              children: item.children.map((children) => {
                const key = `${children.x}-${children.y}`

                if (dragSelected.has(key)) {
                  if (children.area?.name && area[children.area?.name]) {
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
      },
      disabledSeat() {
        // 5 是否禁用
        setData(
          data.map((item) => {
            return {
              ...item,
              children: item.children.map((children) => {
                const key = `${children.x}-${children.y}`

                if (dragSelected.has(key)) {
                  console.log(children)
                  if (children.area?.name && area[children.area.name!]) {
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
      },
      reset() {
        setData(
          data.map((item) => {
            return {
              ...item,
              children: item.children.map((children) => {
                const key = `${children.x}-${children.y}`

                if (dragSelected.has(key)) {
                  console.log(children)
                  if (children.area?.name && area?.[children.area.name]) {
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
      }
    }

    action[key]()
    setShowDropDown(false)
  }

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
                <Button
                  type="primary"
                  onClick={() => {
                    setSeatNameModal({
                      // ...areaModal,
                      ...seatNameModal,
                      show: true
                    })
                  }}
                >
                  {t('seatNamingRuleModal.title')}
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
                            y: item.y,
                            seatId: item.id
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
                          seatNamingRules: seatNameModal.rule,
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
                              seat: item.name ? [...area[item.name]] : []
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
                seatAction(key as SeatActionKey)
              },
              items: [
                {
                  label: t('seatModal.dropdownItem.configArea'),
                  key: 'configArea'
                },
                {
                  label: t('seatModal.dropdownItem.configCoupleSeat'),
                  key: 'configCoupleSeat'
                },
                {
                  label: t('seatModal.dropdownItem.configWheelChairSeat'),
                  key: 'configWheelChairSeat'
                },
                {
                  label: t('seatModal.dropdownItem.show'),
                  key: 'displaySeat'
                },
                {
                  label: t('seatModal.dropdownItem.disabled'),
                  key: 'disabledSeat'
                },
                {
                  label: t('seatModal.dropdownItem.reset'),
                  key: 'reset'
                }
              ]
            }}
            open={showDropDown}
          >
            <section
              ref={dragContainerRef}
              className="drag-container"
              style={{
                position: 'fixed',
                zIndex: 100,
                width: dragBoxRef.current.width + 'px',
                left: dragBoxRef.current.rectLeft + 'px',
                top: dragBoxRef.current.rectTop + 'px'
              }}
            ></section>
          </Dropdown>
          {loading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
              }}
            >
              <Spin></Spin>
            </div>
          ) : (
            <section
              className="seat-container"
              ref={dragContainerRef}
              style={
                {
                  '--seat-size': size + 'px',
                  '--seat-gap': gap + 'px'
                } as React.CSSProperties
              }
            >
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
                      {item.seatName}
                    </Tag>
                  )
                })}
              </ul>
              <section
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}
              >
                <ul className="seat-state">
                  <li>
                    {/* <span></span> */}
                    <Image
                      src={wheelChair}
                      width={15}
                      alt="wheel chair"
                    ></Image>
                    <span>{common('enum.seatType.wheelChair')}</span>
                  </li>
                  <li className="seat-disabled">
                    <span></span>
                    <span>{common('enum.seatType.disabled')}</span>
                  </li>
                  <li className="seat-available">
                    <span></span>
                    <span>{common('enum.selectSeatState.available')}</span>
                  </li>
                  <li className="seat-locked">
                    <span></span>
                    <span>{common('enum.selectSeatState.locked')}</span>
                  </li>
                  <li className="seat-sold">
                    <span></span>
                    <span>{common('enum.selectSeatState.sold')}</span>
                  </li>
                </ul>
                <ul className="seat-area">
                  {areaModal.data.map((item, index) => {
                    return (
                      <li key={index}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            border: `2px solid ${item.color}`,
                            boxSizing: 'border-box',
                            verticalAlign: 'middle',
                            marginRight: '4px'
                          }}
                        ></span>
                        <span style={{ verticalAlign: 'middle' }}>
                          {item.name}（{item.price}
                          {common('unit.jpy')}）
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </section>

              <section
                className="section"
                style={{
                  gridTemplateColumns: `${size}px 1fr`,
                  gridTemplateRows: size + 'px'
                }}
              >
                <ul className="seat-number-left">
                  <li
                    className="seat-row-column"
                    style={{
                      visibility: 'hidden'
                    }}
                  ></li>
                  {data?.map((item, index) => {
                    return (
                      <li key={index} className="seat-row-column">
                        {item.rowName}
                      </li>
                    )
                  })}
                </ul>
                <section className="middle">
                  <section className="seat-number-top">
                    {(() => {
                      let columnIndex = 0 // 用于计数非 'aisle' 类型的列
                      return data?.[0]?.children?.map(
                        (children: any, index: number) => {
                          if (children.type !== 'aisle') {
                            columnIndex++ // 增加列索引
                            return (
                              <div key={index} className="seat-row-column">
                                {columnIndex}
                              </div>
                            )
                          }
                          // 返回空列占位符
                          return (
                            <div key={index} className="seat-row-column"></div>
                          )
                        }
                      )
                    })()}
                  </section>
                  <Selecto
                    ref={seatContainerRef}
                    dragContainer={'.seat-container'}
                    selectableTargets={['.seat .seat-row-column']}
                    hitRate={100}
                    selectByClick={false}
                    selectFromInside={true}
                    // toggleContinueSelect={true}
                    ratio={0}
                    scrollOptions={{
                      container: document.querySelector(
                        '.ant-drawer-body'
                      ) as HTMLElement,
                      throttleTime: 30,
                      threshold: 0
                    }}
                    onSelectStart={() => {
                      const selectSelectionArea = document.querySelector(
                        '.selecto-selection'
                      ) as HTMLElement
                      selectSelectionArea.style.width = '0px'
                      selectSelectionArea.style.height = '0px'
                      selectSelectionArea.style.visibility = 'visible'
                      setShowDropDown(false)
                    }}
                    onSelect={(e) => {
                      e.added.forEach((el) => {
                        el.classList.add('selecto-selected')
                      })
                      e.removed.forEach((el) => {
                        el.classList.remove('selecto-selected')
                      })
                    }}
                    onSelectEnd={(e) => {
                      const selectSelectionArea = document.querySelector(
                        '.selecto-selection'
                      ) as HTMLElement

                      selectSelectionArea.style.visibility = 'hidden'
                      selectSelectionArea.style.display = 'block'

                      const rect = selectSelectionArea?.getBoundingClientRect()

                      dragBoxRef.current.rectLeft = rect.left
                      dragBoxRef.current.rectTop = rect.bottom
                      dragBoxRef.current.width = rect.width

                      if (e.selected.length !== 0) {
                        setShowDropDown(true)
                        const selected = new Set(
                          e.selected.map((item) => {
                            const dataset = findDataset(
                              item as HTMLElement,
                              'rowIndex'
                            )!.dataset

                            return `${dataset.rowIndex}-${dataset.columnIndex}`
                          })
                        )
                        setDragSelected(selected)
                      }

                      console.log(showDropDown)
                    }}
                    onScroll={(e) => {
                      const drawerContainer =
                        document.querySelector('.ant-drawer-body')

                      if (drawerContainer) {
                        drawerContainer.scrollBy(
                          e.direction[0] * 10,
                          e.direction[1] * 10
                        )
                      }
                    }}
                  ></Selecto>
                  <ul
                    className="seat"
                    // style={style}
                    onClick={seatSelect}
                  >
                    {data?.map((item, index) => {
                      let childrenIndex = 0
                      const gridTemplateColumns: string[] = []

                      while (childrenIndex < data?.[index]?.children.length) {
                        const current = data?.[index]?.children[childrenIndex]

                        if (current.seatPositionGroup) {
                          const split = current.seatPositionGroup.split('-')
                          // 1.5为边框大小
                          const w =
                            size * split.length +
                            gap * (split.length - 1) +
                            -1.5
                          childrenIndex++

                          gridTemplateColumns.push(w / split.length + 'px')
                        } else {
                          childrenIndex++
                          gridTemplateColumns.push(size + 'px')
                        }
                      }

                      return (
                        <li
                          key={item.rowAxis}
                          className="seat-row"
                          style={{
                            display: 'flex'

                            // gridTemplateColumns: gridTemplateColumns.join(' '),
                            // gridTemplateRows: size + 'px'
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
                                    key={children.id}
                                    className={getSeatClass(children)}
                                    style={{
                                      width: gridTemplateColumns[childrenIndex],
                                      height: size + 'px',
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
                                    data-seat-name={children.seatName}
                                    data-row-index={children.x}
                                    data-column-index={children.y}
                                  >
                                    <div>
                                      {children.wheelChair ? (
                                        <Image
                                          src={wheelChair}
                                          width={size - 10}
                                          alt="wheel chair"
                                        ></Image>
                                      ) : (
                                        children.seatName
                                      )}
                                    </div>
                                  </div>
                                )
                              } else {
                                // 空的座位
                                return (
                                  <div
                                    key={`${index},${childrenIndex}`}
                                    style={{
                                      width: size + 'px',
                                      height: size + 'px',
                                      marginRight: gap + 'px',
                                      border: '1.5px solid transparent',
                                      boxSizing: 'border-box'
                                    }}
                                  ></div>
                                )
                              }
                            }
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </section>
              </section>
            </section>
          )}
        </Drawer>
      </ConfigProvider>
      <Modal
        title={t('seatModal.title')}
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
                  // 检查行类型过道的范围
                  const rowAisles = modal.data.filter(
                    (item) => item.type === 'row'
                  )
                  const invalidRows = rowAisles.filter(
                    (item) =>
                      !item.start ||
                      item.start < 1 ||
                      item.start > props.data.rowCount
                  )

                  // 检查列类型过道的范围
                  const columnAisles = modal.data.filter(
                    (item) => item.type === 'column'
                  )
                  const invalidColumns = columnAisles.filter(
                    (item) =>
                      !item.start ||
                      item.start < 1 ||
                      item.start > props.data.columnCount
                  )

                  if (invalidRows.length > 0 || invalidColumns.length > 0) {
                    return Promise.reject(
                      new Error(t('seatModal.message.range'))
                    )
                  }

                  return Promise.resolve()
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
                    {item.type === 'row' ? (
                      <Select
                        value={item.start}
                        style={{
                          width: '150px'
                        }}
                        placeholder={t('seatModal.form.start.placeholder')}
                        onChange={(val) => {
                          modal.data[index].start = val

                          setModal({
                            ...modal,
                            data: modal.data
                          })
                        }}
                      >
                        {generateLetterOptions(props.data.rowCount).map(
                          (option) => (
                            <Select.Option
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </Select.Option>
                          )
                        )}
                      </Select>
                    ) : (
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
                    )}
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
      {/* 配置座位命名方式 */}
      <Modal
        title={t('seatNamingRuleModal.title')}
        open={seatNameModal.show}
        width="550px"
        onOk={() => {
          const getContent = /\{([^{}]*)\}/g

          seatNameModal.form[0].validateFields().then(() => {
            const matches = [...seatNameModal.rule.matchAll(getContent)]
            const set = new Set(matches?.map((item) => item[1]))

            if (set.has('number')) {
              let rowIndex = 1
              let columnIndex = 1
              const result = data.map((item) => {
                if (item.type !== 'aisle') {
                  item.rowName = `${rowIndex}`
                  item.children.map((children, childrenIndex) => {
                    if (children.type !== 'aisle') {
                      if (childrenIndex === 0) {
                        columnIndex = 1
                      }
                      children.rowName = `${rowIndex}`
                      children.seatName = matches.reduce((str, current) => {
                        const values = {
                          number: `${rowIndex}`,
                          columnNumber: `${columnIndex}`
                        }
                        str = str.replace(
                          current[0],
                          values[current[1] as keyof typeof values]
                        )
                        return str
                      }, seatNameModal.rule)
                      columnIndex++
                    }
                    return children
                  })
                  rowIndex++
                  return item
                }
                return item
              })
              setData([...result])
            }

            if (set.has('alphabet')) {
              let rowIndex = 1
              let columnIndex = 1
              const result = data.map((item) => {
                if (item.type !== 'aisle') {
                  item.rowName = numberToAlphabet(rowIndex)
                  item.children.map((children, childrenIndex) => {
                    if (children.type !== 'aisle') {
                      if (childrenIndex === 0) {
                        columnIndex = 1
                      }
                      children.rowName = numberToAlphabet(rowIndex)
                      children.seatName = matches.reduce((str, current) => {
                        const values = {
                          alphabet: numberToAlphabet(rowIndex),
                          columnNumber: `${columnIndex}`
                        }
                        str = str.replace(
                          current[0],
                          values[current[1] as keyof typeof values]
                        )
                        return str
                      }, seatNameModal.rule)
                      columnIndex++
                    }
                    return children
                  })
                  rowIndex++
                  return item
                }
                return item
              })
              setData([...result])
              console.log(result)
            }

            setSeatNameModal({
              ...seatNameModal,
              show: false
            })
          })
        }}
        onCancel={() => {
          setSeatNameModal({
            ...seatNameModal,
            show: false
          })
        }}
        maskClosable={false}
      >
        <Form
          name="basic"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          form={seatNameModal.form[0]}
        >
          {/* <Form.Item
            required={true}
            name={['type', 'start']}
            rules={[]}
            label="命名方式"
          >
            <Select
              placeholder={t('seatModal.form.type.placeholder')}
              onChange={(val) => {
                setModal({
                  ...modal,
                  data: modal.data
                })
              }}
            >
              <Select.Option value="row">数字</Select.Option>
              <Select.Option value="column">英语字母</Select.Option>
            </Select>
          </Form.Item> */}
          <Form.Item
            required={true}
            name={'rule'}
            rules={[
              {
                required: true,
                validateTrigger: ['blur'],
                validator() {
                  const reg =
                    /.*\{number\}.*\{columnNumber\}.*|.*\{alphabet\}.*\{columnNumber\}.*/

                  return reg.test(seatNameModal.rule)
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error(t('seatNamingRuleModal.form.template.error'))
                      )
                }
              }
            ]}
            label={t('seatNamingRuleModal.form.template.label')}
          >
            <Space direction="vertical" size={10}>
              <Input
                placeholder="{alphabet}-{columnNumber}"
                value={seatNameModal.rule}
                onChange={(e) => {
                  setSeatNameModal({
                    ...seatNameModal,
                    rule: e.target.value
                  })
                  // seatNameModal.form[0].setFieldValue('rule', e.target.value)
                }}
              ></Input>
              <section
                style={{
                  color: '#707070',
                  lineHeight: '20px',
                  fontSize: '14px'
                }}
              >
                <p
                  dangerouslySetInnerHTML={{
                    __html: t(
                      'seatNamingRuleModal.form.template.description'
                    ).replace(/\n/g, '<br>')
                  }}
                ></p>
              </section>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      <AreaModal
        show={areaModal.show}
        data={areaModal.data}
        hasSelectedSeats={dragSelected.size > 0}
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
