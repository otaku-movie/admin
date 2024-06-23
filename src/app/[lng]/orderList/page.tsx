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
  const { t } = useTranslation(lng, 'order')
  const { t: common } = useTranslation(lng, 'common')

  const getData = (page = 1) => {
    http({
      url: 'movie/list',
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

  useEffect(() => {}, [query, setQuery])

  const columns: TableColumnsType<Movie> = [
    {
      title: t('table.name'),
      dataIndex: 'name',
      width: 350,
      render(_: any, row) {
        return (
          <Space align="start">
            <Image width={120} src={movie.src} alt="poster"></Image>
            <Space direction="vertical">
              <span>{row.name}</span>
              <section>
                {['IMAX', 'DOLBY cinema', '2D', 'DOLBY ATOMS'].map((item) => {
                  return (
                    <Tag
                      key={item}
                      style={{
                        marginBottom: '10px'
                      }}
                    >
                      {item}
                    </Tag>
                  )
                })}
              </section>
            </Space>
          </Space>
        )
      }
    },
    {
      title: t('table.showTime'),
      dataIndex: 'startTime'
    },
    {
      title: t('table.seatNumber'),
      dataIndex: ''
    },

    {
      title: t('table.orderNumber'),
      dataIndex: 'startTime'
    },
    {
      title: t('table.orderTotal'),
      dataIndex: ''
    },
    {
      title: t('table.orderTime'),
      dataIndex: ''
    },
    {
      title: t('table.orderState'),
      dataIndex: ''
    },
    {
      title: t('table.payTotal'),
      dataIndex: 'startTime'
    },
    {
      title: t('table.payTime'),
      dataIndex: 'startTime'
    },
    {
      title: t('table.payState'),
      dataIndex: ''
    },
    {
      title: t('table.payMethod'),
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
                      // http({
                      //   url: 'movie/remove',
                      //   method: 'delete',
                      //   params: {
                      //     id: row.id
                      //   }
                      // })
                      //   .then(() => {
                      //     message.success(t('message.remove.success'))
                      //     getData()
                      //     resolve(true)
                      //   })
                      //   .catch(reject)
                    })
                  }
                })
              }}
            >
              {common('button.remove')}
            </Button>
          </Space>
        )
      }
    }
  ]

  return (
    <section>
      <Space direction="vertical" size={30}>
        <Row justify="end">
          <Button
            onClick={() => {
              router.push(`/movieDetail`)
            }}
          >
            {common('button.add')}
          </Button>
        </Row>
        <Query
          model={query}
          onSearch={() => {
            console.log(query)
          }}
          onClear={(obj) => {
            setQuery({ ...obj })
          }}
        >
          {new Array(5).fill(undefined).map((_, index) => {
            return (
              <QueryItem label={t('table.name') + index} column={1} key={index}>
                <Input
                  value={query.name}
                  onChange={(e) => {
                    query.name = e.target.value

                    setQuery(query)
                  }}
                ></Input>
              </QueryItem>
            )
          })}
          <QueryItem label={t('table.status')}>
            <Select
              value={query.status}
              onChange={(val) => {
                query.status = val
                setQuery(query)
              }}
            >
              {Object.entries(status).map((item, index) => {
                const [key, value] = item

                return (
                  <Select.Option value={key} key={index}>
                    {value}
                  </Select.Option>
                )
              })}
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
            position: ['bottomCenter']
          }}
        />
      </Space>
    </section>
  )
}
