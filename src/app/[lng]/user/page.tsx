'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Input, Row, message, Modal } from 'antd'
import type { TableColumnsType } from 'antd'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../layout'
import http from '@/api'
import { Query, QueryItem } from '@/components/query'
import UserModal from '@/dialog/userModal'
import { CheckPermission } from '@/components/checkPermission'

interface Query {
  name: string
  email: string
}

export default function CinemaPage({ params: { lng } }: PageProps) {
  const [modal, setModal] = useState({
    type: 'create',
    show: false,
    data: {}
  })
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState<Partial<Query>>({})
  const { t } = useTranslation(lng, 'user')

  const getData = (page = 1) => {
    http({
      url: 'user/list',
      method: 'post',
      data: {
        page,
        pageSize: 10,
        ...query
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

  const columns: TableColumnsType = [
    {
      title: t('table.icon'),
      dataIndex: 'cover'
    },
    {
      title: t('table.name'),
      dataIndex: 'username'
    },
    {
      title: t('table.email'),
      dataIndex: 'email'
    },
    {
      title: t('table.registerTime'),
      dataIndex: 'createTime'
    },
    {
      title: t('table.action'),
      key: 'operation',
      fixed: 'right',
      width: 200,
      render: (_, row) => {
        return (
          <Space>
            <CheckPermission code="">
              <Button
                type="primary"
                onClick={() => {
                  http({
                    url: 'user/detail',
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
                {t('button.edit')}
              </Button>
            </CheckPermission>
            <CheckPermission code="">
              <Button
                type="primary"
                danger
                onClick={() => {
                  Modal.confirm({
                    title: t('button.remove'),
                    content: t('message.remove.content'),
                    onCancel() {
                      console.log('Cancel')
                    },
                    onOk() {
                      return new Promise((resolve, reject) => {
                        http({
                          url: 'user/remove',
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
                {t('button.remove')}
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
        <CheckPermission code="">
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
            {t('button.add')}
          </Button>
        </CheckPermission>
      </Row>
      <Query
        onSearch={() => {
          getData()
        }}
      >
        <QueryItem label={t('table.name')} column={1}>
          <Input
            allowClear
            value={query.name}
            onChange={(e) => {
              query.name = e.target.value

              setQuery(query)
            }}
          ></Input>
        </QueryItem>
        <QueryItem label={t('table.email')} column={1}>
          <Input
            allowClear
            value={query.name}
            onChange={(e) => {
              query.email = e.target.value

              setQuery(query)
            }}
          ></Input>
        </QueryItem>
      </Query>
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
      <UserModal
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
      ></UserModal>
    </section>
  )
}
