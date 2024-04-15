'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Row, Image, Tag, Input, Select } from 'antd'

import type { TableColumnsType } from 'antd'
import movie from '@/assets/image/conan-movie.png'
import { status } from '@/config/index'
import { useRouter } from 'next/navigation'

import { Query, QueryItem } from '@/components/query'
import http from '@/api/index'
import { Movie, paginationResponse, response } from '@/type/api'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../layout'

export default function MoviePage({ params: { lng } }: PageProps) {
  const router = useRouter()

  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const { t } = useTranslation(lng, 'movie')

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
      render() {
        return <span>{status[1]}</span>
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
            <Button
              type="primary"
              onClick={() => {
                router.push(`/movieDetail?id=${row.id}`)
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
    <section>
      <Space direction="vertical" size={30}>
        <Row justify="end">
          <Button
            onClick={() => {
              router.push(`/movieDetail`)
            }}
          >
            {t('button.add')}
          </Button>
        </Row>
        <Query>
          <QueryItem label={t('table.name')} column={1}>
            <Input></Input>
          </QueryItem>
          <QueryItem label={t('table.status')}>
            <Select>
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
