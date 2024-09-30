'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Table, Button, FloatButton, Space, Input, Row } from 'antd'
import { useRouter, useSearchParams } from 'next/navigation'
import { PlusOutlined } from '@ant-design/icons'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '@/app/[lng]/layout'
import http from '@/api'
import { Query, QueryItem } from '@/components/query'
import { processPath } from '@/config/router'
import { CheckPermission } from '@/components/checkPermission'

import { TodoList } from '@/components/TodoList/todoList'
import './style.scss'
import MovieShowTimeModal from '@/dialog/movieShowTimeModal'
import { CinemaScreeing, getCinemaScreeningList } from '@/api/request/cinema'
import dayjs from 'dayjs'

export default function CinemaPage({ params: { lng } }: PageProps) {
  const searchParams = useSearchParams()
  const [showTimeModal, setShowTimeModal] = useState<any>({
    data: {
      cinemaId: searchParams.get('id')
    },
    show: false
  })
  const { t: common } = useTranslation(lng, 'common')
  const [data, setData] = useState<CinemaScreeing[]>([])
  const router = useRouter()

  function getData() {
    getCinemaScreeningList({
      id: searchParams.get('id') as string,
      date: dayjs().format('YYYY-MM-DD')
    }).then((res) => {
      setData(res.data as unknown as CinemaScreeing[])
    })
  }

  useEffect(() => {
    getData()
  }, [])

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '30px'
      }}
    >
      <Row justify="end">
        <CheckPermission code="cinema.save">
          <Button
            onClick={() => {
              setShowTimeModal({
                data: {
                  cinemaId: searchParams.get('id')
                },
                show: true
              })
            }}
          >
            {common('button.add')}
          </Button>
        </CheckPermission>
      </Row>
      {/* <Query>
        <QueryItem label={t('table.name')} column={1}>
          <Input></Input>
        </QueryItem>
      </Query> */}
      <TodoList data={data}></TodoList>
      {/* <ul className="nav-hour">
        {Array(24)
          .fill(undefined)
          .map((item, index) => {
            return <li key={index}>{index + 1}</li>
          })}
      </ul> */}
      <FloatButton
        shape="circle"
        type="primary"
        style={{ insetInlineEnd: 94 }}
        icon={<PlusOutlined />}
        onClick={() => {
          setShowTimeModal({
            data: {
              cinemaId: searchParams.get('id')
            },
            show: true
          })
        }}
      />
      <MovieShowTimeModal
        show={showTimeModal.show}
        type={showTimeModal.type}
        data={showTimeModal.data}
        fromScreeningManagement={true}
        onConfirm={() => {
          setShowTimeModal({
            ...showTimeModal,
            show: false
          })
          getData()
        }}
        onCancel={() => {
          setShowTimeModal({
            ...showTimeModal,
            show: false
          })
        }}
      ></MovieShowTimeModal>
    </section>
  )
}
