'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Row, Input, Switch, Modal, message } from 'antd'

import type { TableColumnsType } from 'antd'
import { useRouter } from 'next/navigation'

import { Query, QueryItem } from '@/components/query'
import http from '@/api/index'
import { menuItem } from '@/type/api'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../../layout'
import { processPath } from '@/config/router'
import { MenuModal } from '@/dialog/menuModal'
import { permissionStore } from '@/store/permissionStore'
import { CheckPermission } from '@/components/checkPermission'

interface Query {
  name: string
}

export default function MoviePage({ params: { lng } }: PageProps) {
  const data = permissionStore((state) => state.menu)
  const getMenu = permissionStore((state) => state.getMenu)
  const [query, setQuery] = useState<Partial<Query>>({})
  const { t } = useTranslation(lng, 'menu')
  const [modal, setModal] = useState({
    type: 'create',
    show: false,
    data: {}
  })

  const getData = () => {
    getMenu()
  }

  useEffect(() => {
    getData()
  }, [])

  useEffect(() => {}, [query, setQuery])

  const columns: TableColumnsType<menuItem> = [
    {
      title: t('table.name'),
      dataIndex: 'name'
    },
    {
      title: t('table.routerPath'),
      dataIndex: 'path'
    },
    {
      title: t('table.routerName'),
      dataIndex: 'pathName'
    },
    {
      title: t('table.show'),
      dataIndex: '',
      render(_, row) {
        return <Switch defaultChecked />
      }
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
                    url: 'permission/menu/detail',
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
                          url: 'permission/menu/remove',
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
          console.log(query)
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
        rowKey={'id'}
      />
      <MenuModal
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
      ></MenuModal>
    </section>
  )
}
