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
import { PageProps } from '../../layout'
import { Dict } from '@/components/dict'
import { dictStore } from '@/store/dictStore'
import { processPath } from '@/config/router'
import { CheckPermission } from '@/components/checkPermission'

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
  const { t } = useTranslation(lng, 'movie')
  const getDict = dictStore((state) => state.getDict)

  const getData = (page = 1) => {
    http({
      url: 'movie/list',
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
    getDict(['release_status'])
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
                {row.spec.map((item) => {
                  return (
                    <Tag
                      key={item.id}
                      style={{
                        marginBottom: '10px'
                      }}
                    >
                      {item.name}
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
      title: t('table.originalName'),
      dataIndex: 'originalName'
    },
    {
      title: t('table.time'),
      dataIndex: 'time',
      render(text: number) {
        return <span>{text}分</span>
      }
    },
    {
      title: t('table.level'),
      dataIndex: 'level'
    },
    {
      title: t('table.commentCount'),
      dataIndex: 'commentCount'
    },
    {
      title: t('table.watchedCount'),
      dataIndex: 'watchedCount'
    },
    {
      title: t('table.wantToSeeCount'),
      dataIndex: 'wantToSeeCount'
    },
    {
      title: t('table.startDate'),
      dataIndex: 'startDate'
    },
    {
      title: t('table.endDate'),
      dataIndex: 'endDate'
    },
    {
      title: t('table.status'),
      dataIndex: '',
      render(_, row) {
        return <Dict code={row.status} name={'release_status'}></Dict>
      }
    },
    {
      title: t('table.action'),
      key: 'operation',
      fixed: 'right',
      // width: 100,
      render: (_, row) => {
        return (
          <Space>
            <CheckPermission code="movie.edit">
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
            </CheckPermission>
            <CheckPermission code="movie.remove">
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
            </CheckPermission>
          </Space>
        )
      }
    }
  ]

  return (
    <section>
      <Space direction="vertical" size={30}>
        <Row justify="end">
          <CheckPermission code="movie.add">
            <Button
              onClick={() => {
                router.push(processPath(`movieDetail`))
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
          <QueryItem label={t('table.status')}>
            <Select
              value={query.status}
              allowClear
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