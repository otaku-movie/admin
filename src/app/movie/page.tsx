'use client'
import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Row,
  Col,
  Image,
  Tag,
  Input,
  Select,
  theme
} from 'antd'

import type { TableColumnsType } from 'antd'
import movie from '../../assets/image/conan-movie.png'
import { status } from '../../config/index'
import { useRouter } from 'next/navigation'

import { Query, QueryItem } from '@/components/query'
import http from '../../api/index'
import { Movie, paginationResponse, response } from '@/type/api'

export default function MoviePage() {
  const router = useRouter()
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

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
      title: '作品',
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
      title: 'タイム',
      dataIndex: 'time',
      render(text: number) {
        return <span>{text}分</span>
      }
    },
    {
      title: 'レベル',
      dataIndex: 'level'
    },
    {
      title: 'コメント数',
      dataIndex: 'commentCount'
    },
    {
      title: '鑑賞数',
      dataIndex: 'watchedCount'
    },
    {
      title: 'みたい数',
      dataIndex: 'wantToSeeCount'
    },
    {
      title: '上映開始時期',
      dataIndex: 'startDate'
    },
    {
      title: '上映終了時期',
      dataIndex: 'endDate'
    },
    {
      title: '上映ステータス',
      dataIndex: '',
      render(text: number) {
        return <span>{status[1]}</span>
      }
    },
    {
      title: '操作',
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
              編集
            </Button>
            <Button type="primary" danger>
              削除
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
            新規
          </Button>
        </Row>
        <Query>
          <QueryItem label="作品" column={1}>
            <Input></Input>
          </QueryItem>
          <QueryItem label="上映ステータス">
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
            showTotal: (total) => `データ数：${total}`,
            position: ['bottomCenter']
          }}
        />
      </Space>
    </section>
  )
}
