'use client'
import React, { useState, useEffect, useRef } from 'react'
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
import { seatItem } from '@/type/api'
import classNames from 'classnames'
import Grid from './Grid'

// import { Draw } from './store'

interface ModalProps {
  type: 'create' | 'edit'
  show?: boolean
  data?: any
  onConfirm?: () => void
  onCancel?: () => void
}

interface seat {
  row: string
  children: any[]
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
  const [data, setData] = useState<any[]>([])
  const [selectedSeat, setSelectedSeat] = useState<any[]>([])
  const [mousedown, setMousedown] = useState(false)
  const dragContainerRef = useRef<HTMLElement | null>(null)
  const seatContainerRef = useRef<HTMLElement | null>(null)
  const [currentDragSelected, setCurrentDragSelected] = useState<any>(new Set())
  const [dragSelected, setDragSelected] = useState<any>(new Set())
  const [showDropDown, setShowDropDown] = useState(false)
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
    data: [
      {
        type: 'column',
        start: 3
      },
      {
        type: 'column',
        start: 10
      },
      {
        type: 'column',
        start: 16
      },
      {
        type: 'row',
        start: 2
      }
    ]
  })

  const { t } = useTranslation(
    navigator.language as languageType,
    'theaterHall'
  )
  const size = 50
  const gap = 10

  const generate2DArray = () => {
    const rowCount = props.data.rowCount
    const columnCount = props.data.columnCount

    const seat: any[] = Array.from({
      length: rowCount
    }).map((_, index) => {
      return {
        rowAxis: index,
        type: 'seat',
        letter: String.fromCharCode(65 + index),
        children: Array.from({
          length: columnCount
        }).map((_, childrenIndex) => {
          return {
            type: 'seat',
            xAxis: index,
            yAxis: childrenIndex,
            selected: false,
            columnName: childrenIndex + 1,
            // 坐标
            top: size + index * (size + gap),
            left: size + childrenIndex * (size + gap),
            area: {
              selected: false
            }
          }
        })
      }
    })

    return seat
  }

  const style = {
    display: 'grid',
    gridTemplateColumns: `repeat(${data?.[0]?.children?.length || 0}, ${size}px)`,
    gridTemplateRows: size + 'px',
    gap: gap + 'px'
  }

  const buildAisle = (arr = data) => {
    let updatedData = arr
      .filter((item) => item.type === 'seat')
      .map((item) => ({
        ...item,
        children: item.children.filter(
          (child: { type: string }) => child.type === 'seat'
        )
      }))

    modal.data.forEach((item) => {
      if (item.type === 'column' && updatedData.length !== 0) {
        // 构建列
        const findIndex = updatedData[0].children.findIndex(
          (child: any) => child.yAxis === item.start
        )

        if (findIndex !== -1) {
          updatedData = updatedData.map((row) => {
            const newRow = [...row.children]
            newRow.splice(findIndex, 0, { type: 'aisle' })
            return { ...row, children: newRow }
          })
        }
      } else if (item.type === 'row' && updatedData.length !== 0) {
        const findIndex = updatedData.findIndex(
          (row: any) => row.rowAxis === item.start
        )

        if (findIndex !== -1) {
          const newRow = { type: 'aisle', children: [] }
          updatedData.splice(findIndex, 0, newRow)
        }
      }
    })

    return updatedData
  }

  const buildPosition = (arr = data) => {
    return arr.map((item, index) => {
      return {
        ...item,
        children: item.children.map((children, childrenIndex) => {
          return {
            ...children,
            top: size + index * (size + gap), // 按行计算 top
            left: size + childrenIndex * (size + gap) // 按列计算 left
          }
        })
      }
    })
  }

  // 鼠标按下事件处理函数
  const handleMouseDown = (e) => {
    if (seatContainerRef.current) {
      const rect = seatContainerRef.current.getBoundingClientRect()

      if (e.clientX > rect.left - size / 2 && e.clientY > rect.top - size / 2) {
        setMousedown(true)
        console.log('down', e)
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
        console.log(rect)
        console.log(dragBoxRef.current)
      }
    }
  }

  const handleMouseMove = (e) => {
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

                if (!children.x && !children.y) {
                  const childrenNode =
                    seatContainerRef.current!.children?.[index]?.children[
                      childrenIndex
                    ]
                  const rect = childrenNode.getBoundingClientRect()

                  children.x = rect.left
                  children.y = rect.top
                }

                const selected =
                  children.x >= startX &&
                  children.x <= endX &&
                  children.y >= startY &&
                  children.y <= endY

                const key = `${children.xAxis}-${children.yAxis}`
                if (selected) {
                  currentDragSelected.add(key)
                }

                return {
                  ...children,
                  area: {
                    ...children.area,
                    selected: children.area.selceted || selected
                  }
                }
              } else {
                return children
              }
            })
          }
        })

        setCurrentDragSelected(dragSelected)
        setData(updatedData)
      }
    }
  }
  // 鼠标抬起事件处理函数
  const handleMouseUp = () => {
    if (seatContainerRef.current) {
      console.log(dragSelected)
      if (dragSelected.size === 0) {
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
      }

      setCurrentDragSelected(new Set())
      setMousedown(false)
      console.log('up', dragBoxRef.current)
    }
  }

  useEffect(() => {
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [mousedown, data])

  useEffect(() => {
    if (props.data) {
      const result = generate2DArray()
      const aisle = buildAisle(result)
      setData(buildPosition(aisle))
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.data])

  // `座位数：${props.data.rowCount * props.data.columnCount || 0}`
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
          title={`座位数：${props.data.rowCount * props.data.columnCount || 0}`}
          placement="right"
          open={props.show}
          maskClosable={false}
          onClose={props.onCancel}
          width={'fit-content'}
          // style={{
          //   minWidth: '600px',
          //   width: '90%'
          // }}
          footer={
            <Button
              type="primary"
              onClick={() => {
                setModal({
                  ...modal,
                  show: true
                })
              }}
            >
              配置过道
            </Button>
          }
          extra={
            <Space>
              <Button onClick={props?.onCancel}>Cancel</Button>
              <Button
                type="primary"
                onClick={() => {
                  props.onConfirm?.()
                }}
              >
                OK
              </Button>
            </Space>
          }
        >
          {/* <Grid></Grid> */}
          <section className="seat-container">
            <ul className="selected-seat">
              {selectedSeat.map((item, index: number) => {
                return (
                  <Tag
                    key={`${item.xAxis}-${item.yAxis}`}
                    closable
                    onClose={() => {
                      selectedSeat.splice(index, 1)
                      const findXAxis = data.findIndex(
                        (row) => row.rowAxis === item.xAxis
                      )
                      const findYAxis = data[findXAxis].children.findIndex(
                        (children: any) => children.yAxis === item.yAxis
                      )

                      if (findXAxis !== -1 && findYAxis !== -1) {
                        data[findXAxis].children[findYAxis].selected = false
                        setData([...data])
                      }
                      setSelectedSeat([...selectedSeat])
                    }}
                  >
                    {item.xAxis + 1}排{item.yAxis + 1}座
                  </Tag>
                )
              })}
            </ul>
            <ul className="seat-area">
              <li>普通区：20</li>
              <li>普通区：20</li>
              <li>普通区：20</li>
              <li>普通区：20</li>
            </ul>
            {/* 拖动创建的容器 */}
            <Dropdown
              menu={{
                onClick({ key }) {
                  message.info(`Click on item ${key}`)
                  setShowDropDown(false)
                },
                items: [
                  {
                    label: <span>test</span>,
                    key: '1'
                  },
                  {
                    label: 'Clicking me will not close the menu also.',
                    key: '2'
                  },
                  {
                    label: 'Clicking me will close the menu.',
                    key: '3'
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
                      {item.rowAxis + 1 ? item.rowAxis + 1 : ''}
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

                    if (dataset.rowIndex && dataset.columnIndex) {
                      const x = +dataset.rowIndex
                      const y = +dataset.columnIndex

                      if (selectedSeat.length < 5) {
                        data[x].children[y].selected =
                          !data[x].children[y].selected

                        if (data[x].children[y].selected) {
                          selectedSeat.push(data[x].children[y])
                          setSelectedSeat([...selectedSeat])
                        } else {
                          const findIndex = selectedSeat.findIndex((item) => {
                            return (
                              item.xAxis === data[x].children[y].xAxis &&
                              item.yAxis === data[x].children[y].yAxis
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
                            item.xAxis === data[x].children[y].xAxis &&
                            item.yAxis === data[x].children[y].yAxis
                          )
                        })
                        if (findIndex !== -1) {
                          selectedSeat.splice(findIndex, 1)
                          data[x].children[y].selected = false
                          setSelectedSeat([...selectedSeat])
                        } else {
                          message.warning(
                            t('seatModal.message.max', { max: 5 })
                          )
                        }
                      }
                    }
                  }}
                >
                  {data?.map((item, index) => {
                    return (
                      <li
                        key={index}
                        className="seat-row"
                        style={{
                          ...style
                        }}
                      >
                        {item.children?.map(
                          (children: any, childrenIndex: number) => {
                            if (children.type === 'seat') {
                              return (
                                <div
                                  key={childrenIndex}
                                  className={classNames(
                                    'seat-row-column',
                                    children.selected
                                      ? 'seat-selceted'
                                      : 'seat-not-selected',
                                    children.area.selected
                                      ? 'seat-area-selected'
                                      : ''
                                  )}
                                  data-row-index={index}
                                  data-column-index={childrenIndex}
                                >
                                  <div>x: {children.left}</div>
                                  <p>y: {children.top}</p>
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
        title={`配置过道`}
        open={modal.show}
        width="550px"
        onOk={() => {
          modal.form[0].validateFields().then(() => {
            // setModal({
            //   ...modal,
            //   show: false
            // })
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
                      <Select.Option value="row">行</Select.Option>
                      <Select.Option value="column">列</Select.Option>
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
                    id: Date.now(),
                    status: false
                  } as never)
                  setModal({
                    ...modal,
                    data: modal.data
                  })
                }}
                icon={<PlusOutlined />}
              >
                Add field
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
