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
  const { t } = useTranslation(navigator.language as languageType, 'user')

  const onFinish = (values) => {
    console.log('Success:', values)
  }

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo)
  }

  return (
    <Modal
      title="座位详情"
      open={props.show}
      onOk={props?.onConfirm}
      onCancel={props?.onCancel}
      width="fit-content"
    >
      <section>
        <ul className="seat-row-number">
          {props.data?.map((item, index) => {
            return <li key={index}>{item.row}</li>
          })}
        </ul>
        <ul className="seat-container">
          {props.data?.map((item, index) => {
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
                        background: children.seatType === 2 ? 'red' : ''
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
