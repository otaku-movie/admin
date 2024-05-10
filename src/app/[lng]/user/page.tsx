'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Input, Row } from 'antd'
import type { TableColumnsType } from 'antd'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../layout'
import http from '@/api'
import { Query, QueryItem } from '@/components/query'
import UserModal from '@/dialog/userModal'

interface Query {
  name: string
  email: string
}

export default function CinemaPage({ params: { lng } }: PageProps) {
  const router = useRouter()
  const [modal, setModal] = useState({
    show: false
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
            <Button
              type="primary"
              onClick={() => {
                setModal({
                  ...modal,
                  show: true
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
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '30px'
      }}
    >
      <Row justify="end">
        <Button
          onClick={() => {
            setModal({
              ...modal,
              show: true
            })
          }}
        >
          {t('button.add')}
        </Button>
      </Row>
      <Query>
        <QueryItem label={t('table.name')} column={1}>
          <Input
            value={query.name}
            onChange={(e) => {
              query.name = e.target.value

              setQuery(query)
            }}
          ></Input>
        </QueryItem>
        <QueryItem label={t('table.email')} column={1}>
          <Input
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
        show={modal.show}
        onCancel={() => {
          setModal({
            ...modal,
            show: false
          })
        }}
        onConfirm={() => {
          setModal({
            ...modal,
            show: false
          })
        }}
      ></UserModal>
    </section>
  )
}
