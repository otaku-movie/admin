'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Row } from 'antd'
import type { TableColumnsType } from 'antd'
import { useRouter, useSearchParams } from 'next/navigation'
import SeatModal from '@/dialog/seatModal'
import http from '@/api'
import { PageProps } from '../../layout'
import { useTranslation } from '@/app/i18n/client'
import TheaterHallModal from '@/dialog/theaterHallModal'

export default function Page({ params: { lng } }: PageProps) {
  const router = useRouter()
  const [modal, setModal] = useState<any>({
    data: [],
    show: false
  })
  const [theaterHallModal, setTheaterHallModal] = useState<any>({
    data: [],
    type: 'create',
    show: false
  })
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const searchParams = useSearchParams()
  const { t } = useTranslation(lng, 'theaterHall')

  const getData = (page = 1) => {
    http({
      url: 'theater/hall/list',
      method: 'post',
      data: {
        cinemaId: +searchParams.get('id')!,
        page,
        pageSize: 10
      }
    }).then((res) => {
      setData(res.data.list)
      setPage(page)
      setTotal(res.data.total)
    })
  }

  useEffect(() => {
    getData()
  }, [])

  const columns: TableColumnsType<any> = [
    {
      title: t('table.name'),
      dataIndex: 'name'
    },
    {
      title: t('table.spec'),
      dataIndex: 'spec'
    },
    {
      title: t('table.seatCount'),
      dataIndex: 'seatCount'
    },
    {
      title: '操作',
      key: 'operation',
      fixed: 'right',
      width: 250,
      render: (_, row) => {
        return (
          <Space>
            <Button
              type="primary"
              onClick={() => {
                http({
                  url: 'theater/hall/seat',
                  method: 'get',
                  params: {
                    theaterHallId: row.id
                  }
                }).then(() => {
                  setModal({
                    data,
                    show: true
                  })
                })
              }}
            >
              {t('button.detail')}
            </Button>
            <Button
              type="primary"
              onClick={() => {
                http({
                  url: 'theater/hall/detail',
                  method: 'get',
                  params: {
                    id: row.id
                  }
                }).then((res) => {
                  setTheaterHallModal({
                    ...theaterHallModal,
                    data: res.data,
                    type: 'edit',
                    show: true
                  })
                })
              }}
            >
              {t('button.edit')}
            </Button>
            <Button type="primary" danger>
              {t('button.remove')}
            </Button>
          </Space>
        )
      }
    }
  ]

  return (
    <>
      <Row
        justify="end"
        style={{
          marginBottom: '30px'
        }}
      >
        <Button
          onClick={() => {
            setTheaterHallModal({
              ...theaterHallModal,
              data: {},
              type: 'create',
              show: true
            })
          }}
        >
          {t('button.add')}
        </Button>
      </Row>
      <Table
        columns={columns}
        dataSource={data}
        bordered={true}
        pagination={{
          pageSize: 10,
          current: page,
          total,
          position: ['bottomCenter']
        }}
      />
      <SeatModal
        type="create"
        show={modal.show}
        data={modal.data}
        onConfirm={() => {
          setModal({
            ...modal,
            show: false
          })
        }}
        onCancel={() => {
          setModal({
            ...modal,
            show: false
          })
        }}
      ></SeatModal>
      <TheaterHallModal
        show={theaterHallModal.show}
        type={theaterHallModal.type}
        data={theaterHallModal.data}
        onConfirm={() => {
          getData()
          setTheaterHallModal({
            ...theaterHallModal,
            show: false
          })
        }}
        onCancel={() => {
          setTheaterHallModal({
            ...theaterHallModal,
            show: false
          })
        }}
      ></TheaterHallModal>
    </>
  )
}
