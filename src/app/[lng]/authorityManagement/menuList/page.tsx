'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Row, Input, Switch, Modal, message } from 'antd'

import type { TableColumnsType } from 'antd'
import { useRouter } from 'next/navigation'

import { Query, QueryItem } from '@/components/query'
import http from '@/api/index'
import { Movie, paginationResponse, response } from '@/type/api'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../../layout'
import { processPath } from '@/config/router'

interface Query {
  name: string
}

export default function MoviePage({ params: { lng } }: PageProps) {
  const router = useRouter()
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState<Partial<Query>>({})
  const { t } = useTranslation(lng, 'menu')

  const getData = (page = 1) => {
    http({
      url: 'permission/api/list',
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

  const columns: TableColumnsType<Movie> = [
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
            <Button
              type="primary"
              onClick={() => {
                router.push(
                  processPath('movieDetail', {
                    id: row.id
                  })
                )
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
            router.push(processPath(`movieDetail`))
          }}
        >
          {t('button.add')}
        </Button>
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
