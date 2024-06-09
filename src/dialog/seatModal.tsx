'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import { Modal } from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import './seatModal.scss'
import { seatItem } from '@/type/api'

interface ModalProps {
  type: 'create' | 'edit'
  show?: boolean
  data?: seatItem[]
  onConfirm?: () => void
  onCancel?: () => void
}

interface seat {
  row: string
  children: seatItem[]
}
export default function SeatModal(props: ModalProps) {
  const [data, setData] = useState<seat[]>([])
  const { t } = useTranslation(navigator.language as languageType, 'user')

  const generate2DArray = (data: seatItem[]) => {
    const groupBy = Object.groupBy(data, ({ xaxis }) => xaxis)

    const result = Object.entries(groupBy).map((item) => {
      const [row, children] = item

      return {
        row,
        children: children?.map(children => {
          return {
            ...children,
            selected: false
          }
        })
      }
    })

    console.log(result)
    return result as seat[]
  }

  const buildSeat = () => {
    const count = data[0]?.children.length

    const style = {
      color: 'black',
      gridTemplateColumns: `repeat(${count}, ${size}px)`,
      gridTemplateRows: size + 'px'
    }
    
    return (
      <ul className="seat-container" onClick={(e) => {
        const el = e.target as HTMLElement
        const dataset = el.dataset
        console.log(el.dataset)
        const x = +dataset.rowIndex!
        const y =  +dataset.columnIndex!
        
        console.log(el.dataset, x, y)

        if (x && y) {
          data[x].children[y].selected = !data[x].children[y].selected

          setData([...data])
        }
      }}>
        {
          data?.map((item, index) => {
            return (
              <li
                key={index}
                className="seat-row"
                style={style}
              >
                {item.children.map((children, childrenIndex) => {
                  return (
                    <div
                      key={childrenIndex}
                      className="seat-row-column"
                      style={{
                        border: '2px solid #dad4d4',
                        background: children.selected ? 'red' : ''
                      }}
                      data-row-index={index}
                      data-column-index={childrenIndex}
                    >
                    </div>
                  )
                })}
              </li>
            )
          })
        }
        <li
          className="seat-row"
          style={style}
        >
          {
            new Array(count).fill(undefined).map((_, index) => {
              return (
                <div
                  key={index}
                  className="seat-row-column">
                  {index + 1}
                </div>
              )
            })
          }
        </li>
      </ul>
    )
   
  }

  useEffect(() => {
    if (props.data) {
      setData(generate2DArray(props.data))
    }
  }, [props.data])

  const size = 20

  return (
    <Modal
      title={`座位详情，座位数：${props.data?.length || 0}`}
      open={props.show}
      onOk={() => {
        // console.log(props.d)
        props.onConfirm?.()
      }}
      onCancel={props?.onCancel}
      width="fit-content"
      key={'seat-modal'}
      maskClosable={false}
    >
      <section className="section" style={{
        gridTemplateColumns: `${size}px 1fr`
      }}>
        <ul className="seat-row-number">
          {data?.map((item, index) => {
            return <li key={index} style={{
              width: `${size}px`,
              height: size + 'px',
              lineHeight: size+ 'px'
            }}>{item.row}</li>
          })}
        </ul>
        {buildSeat()}
      </section>
      <div
        style={{
          textAlign: 'center'
        }}
      >
        轮椅座，情侣座，普通座
      </div>
    </Modal>
  )
}
