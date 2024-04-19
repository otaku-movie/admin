'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Input, Row } from 'antd'
import type { TableColumnsType } from 'antd'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../layout'
import http from '@/api'
import { Query, QueryItem } from '@/components/query'

interface Query {
  name: string
  email: string
}

export default function CinemaPage({ params: { lng } }: PageProps) {
  const router = useRouter()

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
      dataIndex: 'name'
    },
    {
      title: t('table.name'),
      dataIndex: 'name'
    },
    {
      title: t('table.email'),
      dataIndex: 'name'
    },
    {
      title: t('table.tel'),
      dataIndex: 'name'
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
                router.push(`/${lng}/screenDetail`)
              }}
            >
              {t('button.detail')}
            </Button>
            <Button
              type="primary"
              onClick={() => {
                router.push(`/${lng}/cinemaDetail?id=${row.id}`)
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
        <Button onClick={() => {}}>{t('button.add')}</Button>
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
    </section>
  )
}
