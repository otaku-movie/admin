'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Row, Input, Switch, Modal, message } from 'antd'
import type { TableColumnsType } from 'antd'
import { Query, QueryItem } from '@/components/query'
import http from '@/api/index'
import { menuItem } from '@/type/api'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../../layout'
import { MenuModal } from '@/dialog/menuModal'
import { usePermissionStore } from '@/store/usePermissionStore'
import { CheckPermission } from '@/components/checkPermission'

interface Query {
  name: string
}

export default function MoviePage({ params: { lng } }: PageProps) {
  const data = usePermissionStore((state) => state.menu)
  const getMenu = usePermissionStore((state) => state.getMenu)
  const [query, setQuery] = useState<Partial<Query>>({})
  const { t } = useTranslation(lng, 'menu')
  const { t: common } = useTranslation(lng, 'common')

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

  useEffect(() => {}, [data])

  useEffect(() => {}, [query, setQuery])

  const columns: TableColumnsType<menuItem> = [
    {
      title: t('table.name'),
      fixed: 'left',
      width: 250,
      render(key) {
        return common(key)
      },
      dataIndex: 'i18nKey'
    },
    {
      title: t('table.i18nKey'),
      width: 200,
      dataIndex: 'i18nKey'
    },
    {
      title: t('table.routerPath'),
      width: 200,
      dataIndex: 'path'
    },
    {
      title: t('table.routerName'),
      width: 200,
      dataIndex: 'pathName'
    },
    {
      title: t('table.show'),
      dataIndex: '',
      width: 100,
      render(_, row) {
        return (
          <Switch
            value={row.show}
            onChange={(val) => {
              http({
                url: 'admin/permission/menu/save',
                method: 'post',
                data: {
                  ...row,
                  show: val
                }
              }).then((res) => {
                getData()
                message.success(res.message)
              })
            }}
          />
        )
      }
    },
    {
      title: t('table.action'),
      key: 'operation',
      fixed: 'right',
      width: 200,
      render: (_, row) => {
        return (
          <Space>
            <CheckPermission code="menu.save">
              <Button
                type="primary"
                onClick={() => {
                  http({
                    url: 'admin/permission/menu/detail',
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
            <CheckPermission code="menu.remove">
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
                          url: 'admin/permission/menu/remove',
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
        <CheckPermission code="menu.save">
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
        pagination={false}
        scroll={{
          x: columns.reduce(
            (total, current) => total + (current.width as number),
            0
          )
        }}
        sticky={{ offsetHeader: -20 }}
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
