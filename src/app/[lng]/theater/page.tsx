'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Row, Col, Image, Tag } from 'antd'

import type { TableColumnsType } from 'antd'
import movie from '@/assets/image/conan-movie.png'
import { status } from '@/config/index'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../layout'
import http from '@/api'

export default function Theater({ params: { lng } }: PageProps) {
  const router = useRouter()

  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const { t } = useTranslation(lng, 'theater')

  const getData = (page = 1) => {
    http({
      url: 'theater/list',
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
      dataIndex: 'level'
    },
    {
      title: t('table.address'),
      dataIndex: 'commentCount'
    },
    {
      title: t('table.tel'),
      dataIndex: 'watchCount'
    },
    {
      title: t('table.action'),
      key: 'operation',
      fixed: 'right',
      // width: 100,
      render: () => {
        return (
          <Space>
            <Button
              type="primary"
              onClick={() => {
                router.push(`/screenDetail`)
              }}
            >
              {t('table.detail')}
            </Button>
            <Button type="primary">{t('table.delete')}</Button>
            <Button type="primary" danger>
              {t('table.remove')}
            </Button>
          </Space>
        )
      }
    }
  ]

  return (
    <section>
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
