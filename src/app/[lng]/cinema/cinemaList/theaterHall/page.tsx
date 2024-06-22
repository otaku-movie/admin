'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Row } from 'antd'
import type { TableColumnsType } from 'antd'
import { useRouter, useSearchParams } from 'next/navigation'
import SeatModal from '@/dialog/seatModal/seatModal'
import http from '@/api'
import { PageProps } from '@/app/[lng]/layout'
import { useTranslation } from '@/app/i18n/client'
import TheaterHallModal from '@/dialog/theaterHallModal'
import { CheckPermission } from '@/components/checkPermission'

export default function Page({ params: { lng } }: PageProps) {
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
  const { t: common } = useTranslation(lng, 'common')

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
      title: t('table.rowCount'),
      dataIndex: 'rowCount'
    },
    {
      title: t('table.columnCount'),
      dataIndex: 'columnCount'
    },
    {
      title: t('table.seatCount'),
      render(_, row) {
        if (row.rowCount && row.columnCount) {
          return row.rowCount * row.columnCount
        } else {
          return 0
        }
      }
    },
    {
      title: '操作',
      key: 'operation',
      fixed: 'right',
      width: 250,
      render: (_, row) => {
        return (
          <Space>
            <CheckPermission code="theaterHall.saveSeatConfig">
              <Button
                type="primary"
                onClick={() => {
                  setModal({
                    data: row,
                    show: true
                  })
                }}
              >
                {common('button.configSeat')}
              </Button>
            </CheckPermission>
            <CheckPermission code="theaterHall.save">
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
                {common('button.edit')}
              </Button>
            </CheckPermission>
            <CheckPermission code="theaterHall.remove">
              <Button type="primary" danger>
                {common('button.remove')}
              </Button>
            </CheckPermission>
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
        <CheckPermission code="">
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
            {common('button.add')}
          </Button>
        </CheckPermission>
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
        permission="configSeat"
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
