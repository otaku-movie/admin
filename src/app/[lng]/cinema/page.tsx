'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Input, Row } from 'antd'
import type { TableColumnsType } from 'antd'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../layout'
import http from '@/api'
import { Query, QueryItem } from '@/components/query'

export default function CinemaPage({ params: { lng } }: PageProps) {
  const router = useRouter()

  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const { t } = useTranslation(lng, 'cinema')

  const getData = (page = 1) => {
    http({
      url: 'cinema/list',
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
      title: t('table.name'),
      dataIndex: 'name'
    },
    {
      title: t('table.description'),
      dataIndex: 'description'
    },
    {
      title: t('table.address'),
      dataIndex: 'address'
    },
    {
      title: t('table.tel'),
      dataIndex: 'tel'
    },
    {
      title: t('table.homePage'),
      dataIndex: 'homePage'
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
        <Button
          onClick={() => {
            router.push(`/${lng}/cinemaDetail`)
          }}
        >
          {t('button.add')}
        </Button>
      </Row>
      <Query>
        <QueryItem label={t('table.name')} column={1}>
          <Input></Input>
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
