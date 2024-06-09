'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Row, Modal, message } from 'antd'
import type { TableColumnsType } from 'antd'
import http from '@/api/index'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '@/app/[lng]/layout'
import { TicketTypeModal } from '@/dialog/ticketTypeModal'
import { CheckPermission } from '@/components/checkPermission'
import { useSearchParams } from 'next/navigation'

interface Query {
  name: string
  status: number
}

export default function Page({ params: { lng } }: PageProps) {
  const [data, setData] = useState([])
  const [query, setQuery] = useState<Partial<Query>>({})
  const searchParams = useSearchParams()
  const { t } = useTranslation(lng, 'ticketType')
  const { t: common } = useTranslation(lng, 'common')
  const [modal, setModal] = useState({
    type: 'create',
    show: false,
    data: {}
  })

  const getData = (page = 1) => {
    if (searchParams.get('id')) {
      http({
        url: 'movie/ticketType/list',
        method: 'post',
        data: {
          cinemaId: +searchParams.get('id')!,
          page,
          pageSize: 10
        }
      }).then((res) => {
        setData(res.data)
      })
    }
  }

  useEffect(() => {
    getData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {}, [query, setQuery])

  const columns: TableColumnsType = [
    {
      title: t('table.name'),
      dataIndex: 'name'
    },
    {
      title: t('table.price'),
      dataIndex: 'price'
    },
    {
      title: t('table.action'),
      key: 'operation',
      width: 100,
      render: (_, row) => {
        return (
          <Space>
            <CheckPermission code="movieTicketType.save">
              <Button
                type="primary"
                onClick={() => {
                  http({
                    url: 'movie/ticketType/detail',
                    method: 'get',
                    params: {
                      id: row.id
                    }
                  }).then((res) => {
                    setModal({
                      ...modal,
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
            <CheckPermission code="movieTicketType.remove">
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
                          url: 'admin/movie/ticketType/remove',
                          method: 'delete',
                          params: {
                            id: row.id
                          }
                        })
                          .then(() => {
                            message.success(t('message.remove.success'))
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
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '30px'
      }}
    >
      <Row justify="end">
        <CheckPermission code="movieTicketType.save">
          <Button
            onClick={() => {
              setModal({
                ...modal,
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
        pagination={false}
      />
      <TicketTypeModal
        type={modal.type as 'create' | 'edit'}
        show={modal.show}
        data={modal.data}
        onCancel={() => {
          setModal({
            ...modal,
            show: false
          })
        }}
        onConfirm={() => {
          getData()
          setModal({
            ...modal,
            show: false
          })
        }}
      ></TicketTypeModal>
    </section>
  )
}
