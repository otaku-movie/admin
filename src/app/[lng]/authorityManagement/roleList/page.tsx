'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Row, Input, Modal, message } from 'antd'

import type { TableColumnsType } from 'antd'
import { useRouter } from 'next/navigation'

import { Query, QueryItem } from '@/components/query'
import http from '@/api/index'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../../layout'
import { RoleModal } from '@/dialog/roleModal'
import { RolePermission } from '@/dialog/rolePermission'
import { CheckPermission } from '@/components/checkPermission'

interface Query {
  name: string
  status: number
}

export default function MoviePage({ params: { lng } }: PageProps) {
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState<Partial<Query>>({})
  const { t } = useTranslation(lng, 'role')
  const [modal, setModal] = useState({
    type: 'create',
    show: false,
    data: {}
  })
  const [rolePermissionModal, setRolePermissionModal] = useState({
    show: false,
    data: {}
  })

  const getData = (page = 1) => {
    http({
      url: 'permission/role/list',
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

  useEffect(() => {}, [query, setQuery])

  const columns: TableColumnsType = [
    {
      title: t('table.name'),
      dataIndex: 'name'
    },
    {
      title: t('table.action'),
      key: 'operation',
      width: 100,
      render: (_, row) => {
        return (
          <Space>
            <CheckPermission code="">
              <Button
                type="primary"
                onClick={() => {
                  http({
                    url: 'permission/role/detail',
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
                onClick={() => {
                  setRolePermissionModal({
                    ...rolePermissionModal,
                    data: {
                      id: row.id
                    },
                    show: true
                  })
                }}
              >
                {t('button.configPermission')}
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
                          url: 'permission/role/remove',
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
        model={query}
        onSearch={() => {
          getData()
        }}
        onClear={(obj) => {
          setQuery({ ...obj })
        }}
      >
        <QueryItem label={t('table.name')}>
          <Input
            allowClear
            value={query.name}
            onChange={(e) => {
              query.name = e.target.value
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
      <RoleModal
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
      ></RoleModal>
      <RolePermission
        show={rolePermissionModal.show}
        data={rolePermissionModal.data}
        onCancel={() => {
          setRolePermissionModal({
            ...rolePermissionModal,
            show: false
          })
        }}
        onConfirm={() => {
          setRolePermissionModal({
            ...rolePermissionModal,
            show: false
          })
        }}
      ></RolePermission>
    </section>
  )
}
