'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from '@/app/i18n/client'
import { Button, Drawer, Space, Tag } from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import './seatModal.scss'
import { seatItem } from '@/type/api'
import { Application, Graphics, Text, TextStyle } from 'pixi.js'
// import { Draw } from './store'

interface ModalProps {
  type: 'create' | 'edit'
  show?: boolean
  data?: seatItem[]
  rowCount: number
  columnCount: number
  onConfirm?: () => void
  onCancel?: () => void
}

interface seat {
  row: string
  children: seatItem[]
}
export default function SeatModal(props: ModalProps) {
  const [data, setData] = useState<seat[]>([])
  const [selectedSeat, setSelectedSeat] = useState<seatItem[]>([])

  const { t } = useTranslation(navigator.language as languageType, 'user')
  // const app = useRef<Application | null>(null)
  const container = useRef<any>(undefined)

  const generate2DArray = (data: seatItem[]) => {
    const groupBy = Object.groupBy(data, ({ xaxis }) => xaxis)

    const result = Object.entries(groupBy).map((item) => {
      const [row, children] = item

      return {
        row,
        children: children?.map((children) => {
          return {
            ...children,
            selected: false
          }
        })
      }
    })

    return result as seat[]
  }

  
  const app = new Application()
  const size = 25
  const gap = 8
  const radius = 2
  const rowCount = props.rowCount
  const columnCount = props.columnCount
  const border = 2
  const fontSize = 14
  const [seatGraphics, setSeatGraphics] = useState<any>({})

  const drawRect = (j: number, i: number, selected = false) => {
    const selectedColor = 'orange'
    const noSelectedColor = '#fbffff'
    const borderColor = '#cdf7f6'
    const x = size + 1 + i * (size + gap)
    const y = size + 1 + j * (size + gap)
    const color = selected ? selectedColor : noSelectedColor
    const key = `${j}-${i}`

    
    data[j].children[i].selected = selected
    setData([...data])
    
    if (!seatGraphics[key]) {
      seatGraphics[key] = new Graphics()
      setSeatGraphics({...seatGraphics})
    }

    const graphics = seatGraphics[key] ? seatGraphics[key] : new Graphics()

    // graphics.clear()
    graphics.roundRect(x, y, size, size, radius)
    graphics.fill({
      color
    })
    graphics.stroke({ width: border, color: borderColor })

    graphics.interactive = true

    graphics.on('click', () => {
      data[j].children[i].selected = !data[j].children[i].selected
      setData([...data])
      const color = data[j].children[i]?.selected
        ? selectedColor
        : noSelectedColor

      graphics
        .clear()
        .roundRect(x, y, size, size, radius)
        .fill({
          color
        })
        .stroke({ width: border, color: borderColor })

      if (data[j].children[i].selected) {
        selectedSeat.push(data[j].children[i])
        setSelectedSeat([...selectedSeat])
      } else {

        const findIndex = selectedSeat.findIndex(item => {
          return item.yaxis - 1 === i && item.xaxis - 1 === j
        })
        console.log(findIndex)
        if (findIndex !== -1) {
          selectedSeat.splice(findIndex, 1)
          setSelectedSeat([...selectedSeat])
          // data[find.xaxis - 1].children[find.yaxis - 1].selected = false
        }
        
      }
      
    })

    app.stage.addChild(graphics)
  }

  const createApp = async () => {
    const seatWidth = (size + gap + border) * columnCount
    const seatHeight = (size + gap) * rowCount

    await app.init({
      width: seatWidth + 5,
      height: seatHeight + fontSize * 2,
      // antialias: true, // 抗锯齿
      // resolution: window.devicePixelRatio,
      // resizeTo: window,
      backgroundAlpha: 0,
      // backgroundColor: 'black',
      eventMode: 'auto',
      eventFeatures: {
        move: true,
        globalMove: true,
        click: true
      }
    })

    // 绘制左侧矩形
    const leftGraphics = new Graphics()

    leftGraphics.clear().roundRect(0, size, size, seatHeight, radius)

    app.stage.addChild(leftGraphics)

    // 绘制左侧的 y 坐标标签
    for (let i = 0; i < rowCount; i++) {
      const y = size + i * (size + gap)
      const text = new Text({
        text: i + 1,
        resolution: app.renderer.resolution,
        style: new TextStyle({
          fontSize: fontSize + 'px',
          fill: 'white',
          align: 'center'
        })
      })
      text.x = size / 2 - text.width / 2
      text.y = y + size / 2 - text.height / 2
      app.stage.addChild(text)
    }
    // 绘制座位矩形
    const seatContainerGraphics = new Graphics()

    seatContainerGraphics.clear().roundRect(size, size, seatWidth, seatHeight, 0)
    // .fill({
    //   color: 'orange'
    // })

    app.stage.addChild(seatContainerGraphics)

    // 绘制顶部矩形
    const topGraphics = new Graphics()

    topGraphics.clear().roundRect(leftGraphics.width, 0, seatWidth, size, 0)
    // .fill({
    //   color: 'blue'
    // })

    app.stage.addChild(topGraphics)

    

    // 绘制座位
    for (let i = 0; i < columnCount; i++) {
      for (let j = 0; j < rowCount; j++) {
        drawRect(j, i)
      }
    }

    // 绘制顶部的 x 坐标标签
    for (let i = 0; i < columnCount; i++) {
      const x = i * (size + gap) + size
      const text = new Text({
        text: i + 1,
        style: new TextStyle({
          fontSize: fontSize + 'px',
          fill: 'white',
          align: 'center'
        })
      })
      text.x = x + size / 2 - text.width / 2
      text.y = size / 2 - text.height / 2
      app.stage.addChild(text)
    }

    // 绘制底部 y 坐标
    // for (let i = 0; i < columnCount; i++) {
    //   const x = i * (size + gap) + size
    //   const text = new Text({
    //     text: i + 1,
    //     style: new TextStyle({
    //       fontSize: fontSize + 'px',
    //       fill: 'white',
    //       align: 'center'
    //     })
    //   })
    //   text.x = x + size / 2 - text.width / 2
    //   text.y = seatHeight - fontSize * devicePixelRatio
    //   app.stage.addChild(text)
    // }

    // let drag = false
    // let start = {
    //   x: 0,
    //   y: 0
    // }

    // app.canvas.addEventListener('mousedown', (e) => {
    //   console.log(e, 'mousedown')

    //   const rect = (e.target as HTMLCanvasElement)!.getBoundingClientRect()
    //     // dragStartPoint = app.stage.toLocal(globalPos)
    //   console.log(rect)
    //   drag = true
    //   start = {
    //     x: e.offsetX - rect.x - fontSize,
    //     y: e.offsetY - rect.y - fontSize
    //   }

    //   const graphics = new Graphics()

    //   const localPos = graphics.toLocal(new Point(start.x, start.y))

    //   console.log(start, localPos)
    //   graphics
    //     .roundRect(start.x, start.y, 200, 200) // 创建圆角矩形
    //     .fill({
    //       color: 'white' // 设置填充颜色
    //     })
    //     .stroke({ width: border, color: '#dad4d4' })

    //     console.log(e.offsetX, e.offsetY)
    //     app.stage.addChild(graphics)

    // })
    // app.canvas.addEventListener('pointermove', (e) => {
    //   if (drag) {
    //     console.log(e, 'mousemove')
    //     graphics
    //       .roundRect(start.x, start.y, 200, 200, radius) // 创建圆角矩形
    //       .fill({
    //         color: 'white' // 设置填充颜色
    //       })
    //       .stroke({ width: border, color: '#dad4d4' })
    //   }
    // })
    // app.canvas.addEventListener('mouseup', (e) => {
    //   console.log(e, 'mouseup')
    //   drag = false
    // })

    container.current.innerHTML = ''
    container.current.appendChild(app.canvas)
  }

  useEffect(() => {
    if (props.data) {
      setData(generate2DArray(props.data as seatItem[]))
      if (container.current) {
        createApp()
      }
    }
  }, [props.data])

  return (
    <Drawer
      title={`座位详情，座位数：${props.data?.length || 0}`}
      placement="right"
      open={props.show}
      maskClosable={false}
      onClose={props.onCancel}
      width={'fit-content'}
      // style={{
      //   minWidth: '600px',
      //   width: '90%'
      // }}
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
      <section className="seat-container">
        <ul className="selected-seat">
          {selectedSeat.map((item, index: number) => {
            return (
              <Tag
                key={item.id}
                closable
                onClose={() => {
                  console.log(item)
                  selectedSeat.splice(index, 1)
                  setSelectedSeat([...selectedSeat])
                  drawRect(item.xaxis - 1, item.yaxis - 1, false)
                }}
              >
                {item.xaxis}排{item.yaxis}座
              </Tag>
            )
          })}
        </ul>
        <section ref={container} className="canvas-container"></section>
      </section>
    </Drawer>

    // <Modal
    //   title={`座位详情，座位数：${props.data?.length || 0}`}
    //   open={props.show}
    //   onOk={() => {
    //     // console.log(props.d)
    //     props.onConfirm?.()
    //   }}
    //   onCancel={props?.onCancel}
    //   width={'fit-content'}
    //   key={'seat-modal'}
    //   maskClosable={false}
    // >
    //   {/* <section
    //     className="section"
    //     style={{
    //       gridTemplateColumns: `${size}px 1fr`
    //     }}
    //   >
    //     <ul className="seat-row-number">
    //       {data?.map((item, index) => {
    //         return (
    //           <li
    //             key={index}
    //             style={{
    //               width: `${size}px`,
    //               height: size + 'px',
    //               lineHeight: size + 'px'
    //             }}
    //           >
    //             {item.row}
    //           </li>
    //         )
    //       })}
    //     </ul>
    //     <li className="seat-row" style={style}>
    //       {new Array(columnCount).fill(undefined).map((_, index) => {
    //         return (
    //           <div key={index} className="seat-row-column">
    //             {index + 1}
    //           </div>
    //         )
    //       })}
    //     </li>
    //   </section> */}
    //   <ul className='selected-seat'>
    //     {
    //       selectedSeat.map((item, index: number) => {
    //         return (
    //           <Tag
    //             key={item.id}
    //             closable
    //             onClose={() => {
    //               console.log(item)

    //               data[item.xaxis].children[item.yaxis].selected = false
    //               selectedSeat.splice(index, 1)
    //               console.log(selectedSeat)
    //               setSelectedSeat([...selectedSeat])
    //               drawRect(item.yaxis - 1, item.xaxis - 1)
    //             }}>{item.xaxis}排{item.yaxis}座</Tag>
    //         )
    //       })
    //     }
    //   </ul>
    //   <section
    //     ref={container}
    //     style={{
    //       background: 'transparent',
    //       padding: '5px'
    //       // border: '2px solid red'
    //     }}
    //   ></section>
    //   <div
    //     style={{
    //       textAlign: 'center'
    //     }}
    //   >
    //     轮椅座，情侣座，普通座
    //   </div>
    // </Modal>
  )
}
