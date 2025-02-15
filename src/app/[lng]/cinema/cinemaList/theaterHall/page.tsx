'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Row, Modal, message } from 'antd'
import type { TableColumnsType } from 'antd'
import { useSearchParams } from 'next/navigation'
import SeatModal from '@/dialog/seatModal/seatModal'
import http from '@/api'
import { PageProps } from '@/app/[lng]/layout'
import { useTranslation } from '@/app/i18n/client'
import TheaterHallModal from '@/dialog/theaterHallModal'
import { CheckPermission } from '@/components/checkPermission'
import { showTotal } from '@/utils/pagination'

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
      dataIndex: 'cinemaSpecName'
    },
    {
      title: t('table.rowCount'),
      dataIndex: 'rowCount'
    },
    {
      title: t('table.columnCount'),
      dataIndex: 'columnCount'
    },
    // {
    //   title: t('table.spec'),
    //   dataIndex: 'seatNamingRules'
    // },
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
            <CheckPermission code="theaterHall.saveSeatConfig">
              <Button
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
              <Button
                type="primary"
                danger
                onClick={() => {
                  Modal.confirm({
                    title: common('button.remove'),
                    content: t('message.remove.content'),
                    onCancel() {
                      console.log('Cancel')
                    },
                    onOk() {
                      return new Promise((resolve, reject) => {
                        http({
                          url: 'admin/theater/hall/remove',
                          method: 'delete',
                          params: {
                            id: row.id
                          }
                        })
                          .then((res) => {
                            message.success(t(res.message))
                            getData()
                            resolve(true)
                          })
                          .catch(reject)
                      })
                    }
                  })
                }}
              >
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
        <CheckPermission code="theaterHall.save">
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
          showTotal,
          onChange(page) {
            getData(page)
          },
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
          getData()
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
