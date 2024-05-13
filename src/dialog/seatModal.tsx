'use client'
import React, { useState, useEffect } from 'react'
import { PageProps } from '@/app/[lng]/layout'
import { useTranslation } from '@/app/i18n/client'
import { Form, Modal, Input } from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import './seatModal.scss'

interface UserModalProps {
  type: 'create' | 'edit'
  show?: boolean
  data?: any[]
  onConfirm?: () => void
  onCancel?: () => void
}

export default function SeatModal(props: UserModalProps) {
  const [data, setData] = useState([])
  const { t } = useTranslation(navigator.language as languageType, 'user')

  const onFinish = (values) => {
    console.log('Success:', values)
  }

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo)
  }

  const generate2DArray = (data: any[]) => {
    // 找到所有不同的xname值
    const uniqueXNameValues = Array.from(
      new Set(data.map((item) => item.xname))
    )

    // 创建二维数组，用于存放分组后的数据
    const result = []

    // 根据不同的xname值进行分组
    uniqueXNameValues.forEach((xNameValue) => {
      // 找到当前xname值对应的所有数据
      const groupedData = data.filter((item) => item.xname === xNameValue)
      // 将当前分组的数据添加到结果数组中
      result.push({
        row: xNameValue,
        children: groupedData
      })
    })

    return result
  }

  useEffect(() => {
    setData(generate2DArray(props.data))
  }, [props.data])

  return (
    <Modal
      title="座位详情"
      open={props.show}
      onOk={props?.onConfirm}
      onCancel={props?.onCancel}
      width="fit-content"
    >
      <section className='section'>
        <ul className="seat-row-number">
          {data?.map((item, index) => {
            return <li key={index}>{item.row}</li>
          })}
        </ul>
        <ul className="seat-container">
          {data?.map((item, index) => {
            return (
              <li
                key={index}
                className="seat-row"
                style={{
                  color: 'black',
                  gridTemplateColumns: `repeat(${item.children.length}, 20px)`
                }}
              >
                {item.children.map((children, childrenIndex) => {
                  return (
                    <div
                      key={childrenIndex}
                      className="seat-row-column"
                      style={{
                        border: children.seatType === 2 ? '2px solid red' : '',
                        background: children.selected ? 'red' : '',
                        borderRadius: '4px'
                      }}
                    >
                      {children.column}
                    </div>
                  )
                })}
              </li>
            )
          })}
        </ul>
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
