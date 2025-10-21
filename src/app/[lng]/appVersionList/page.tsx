'use client'
import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Image,
  Space,
  Input,
  Row,
  message,
  Modal,
  Tag,
  Select
} from 'antd'
import type { TableColumnsType } from 'antd'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../layout'
import http from '@/api'
import { Query, QueryItem } from '@/components/query'
import UserModal from '@/dialog/userModal'
import { ConfigUserRoleModal } from '@/dialog/configUserRoleModal'
import { CheckPermission } from '@/components/checkPermission'
import { showTotal } from '@/utils/pagination'

interface Query {
  platform: string
}

export default function Page({ params: { lng } }: Readonly<PageProps>) {
  const [modal, setModal] = useState({
    type: 'create',
    show: false,
    data: {}
  })
  const [configUserRoleModal, setConfigUserRoleModal] = useState({
    type: 'create',
    show: false,
    data: {}
  })
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState<Partial<Query>>({})
  const { t } = useTranslation(lng, 'appVersionList')
  const { t: common } = useTranslation(lng, 'common')

  const getData = (page = 1) => {
    http({
      url: 'admin/app/versionList',
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
      title: t('table.platform'),
      dataIndex: 'platform'
    },
    {
      title: t('table.version'),
      dataIndex: 'version'
    },
    {
      title: t('table.changeLog'),
      dataIndex: 'changeLog'
    },
    {
      title: t('table.createTime'),
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
            <CheckPermission code="user.save">
              <Button
                type="primary"
                onClick={() => {
                  // http({
                  //   url: 'user/detail',
                  //   method: 'get',
                  //   params: {
                  //     id: row.id
                  //   }
                  // }).then((res) => {
                  //   setModal({
                  //     ...modal,
                  //     data: res.data,
                  //     type: 'edit',
                  //     show: true
                  //   })
                  // })
                }}
              >
                {common('button.edit')}
              </Button>
            </CheckPermission>
            <CheckPermission code="user.remove">
              <Button
                type="primary"
                danger
                onClick={() => {
                  // Modal.confirm({
                  //   title: common('button.remove'),
                  //   content: t('message.remove.content'),
                  //   onCancel() {
                  //     console.log('Cancel')
                  //   },
                  //   onOk() {
                  //     return new Promise((resolve, reject) => {
                  //       http({
                  //         url: 'admin/user/remove',
                  //         method: 'delete',
                  //         params: {
                  //           id: row.id
                  //         }
                  //       })
                  //         .then(() => {
                  //           message.success(t('message.remove.success'))
                  //           getData()
                  //           resolve(true)
                  //         })
                  //         .catch(reject)
                  //     })
                  //   }
                  // })
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
        <CheckPermission code="user.save">
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
        onSearch={() => {
          getData()
        }}
      >
        <QueryItem label={t('table.platform')} column={1}>
          <Select
            value={query.platform}
            allowClear
            onChange={(e) => {
              setQuery({
                ...query,
                platform: e
              })
            }}
          >
            <Select.Option value="Android">Android</Select.Option>
            <Select.Option value="IOS">IOS</Select.Option>
          </Select>
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
          showTotal,
          onChange(page) {
            getData(page)
          },
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
      <ConfigUserRoleModal
        type={configUserRoleModal.type as 'create' | 'edit'}
        show={configUserRoleModal.show}
        data={configUserRoleModal.data}
        onCancel={() => {
          setConfigUserRoleModal({
            ...configUserRoleModal,
            show: false
          })
        }}
        onConfirm={() => {
          getData()
          setConfigUserRoleModal({
            ...configUserRoleModal,
            show: false
          })
        }}
      ></ConfigUserRoleModal>
    </section>
  )
}
