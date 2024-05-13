'use client'
import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Row,
  Image,
  Tag,
  Input,
  Select,
  Modal,
  message
} from 'antd'

import type { TableColumnsType } from 'antd'
import movie from '@/assets/image/conan-movie.png'
import { status } from '@/config/index'
import { useRouter } from 'next/navigation'

import { Query, QueryItem } from '@/components/query'
import http from '@/api/index'
import { Movie, paginationResponse, response } from '@/type/api'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../layout'

interface Query {
  name: string
  status: number
}

export default function MoviePage({ params: { lng } }: PageProps) {
  const router = useRouter()

  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState<Partial<Query>>({})
  const { t } = useTranslation(lng, 'selectSeat')

  const getData = (page = 1) => {
    http({
      url: '/theater/hall/select_seat/list',
      method: 'get'
    }).then((res) => {})
  }

  useEffect(() => {
    getData()
  }, [])

  useEffect(() => {}, [query, setQuery])

  const columns: TableColumnsType<Movie> = [
    {
      title: '用户信息'
    },
    {
      title: '场次',
      dataIndex: ''
    },
    {
      title: '已选座位',
      dataIndex: ''
    },
    {
      title: '座位状态',
      dataIndex: ''
    },
    {
      title: t('table.action'),
      key: 'operation',
      fixed: 'right',
      // width: 100,
      render: (_, row) => {
        return (
          <Space>
            <Button
              type="primary"
              onClick={() => {
                // router.push(`movieDetail?id=${row.id}`)
              }}
            >
              {t('button.detail')}
            </Button>
            <Button
              type="primary"
              onClick={() => {
                router.push(`movieDetail?id=${row.id}`)
              }}
            >
              {t('button.edit')}
            </Button>
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
                        url: 'movie/remove',
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
