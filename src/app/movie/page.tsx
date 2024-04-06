'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Row, Col, Image, Tag } from 'antd'

import type { TableColumnsType } from 'antd'
import movie from '../../assets/image/conan-movie.png'
import { status } from '../../config/index'
import { useRouter } from 'next/navigation'
import { Form, Input, Select, theme } from 'antd'
import { Query, QueryItem } from '@/components/query'

export default function Movie() {
  const router = useRouter()
  const [data, setData] = useState([
    {
      name: '劇場版『名探偵コナン 100万ドルの五稜星（みちしるべ）』',
      level: 'G',
      time: 113,
      watchCount: 1000,
      commentCount: 100
    },
    {
      name: '劇場版『名探偵コナン 100万ドルの五稜星（みちしるべ）』',
      level: 'G',
      time: 113,
      watchCount: 1000,
      commentCount: 100
    }
  ])
  const columns = [
    {
      title: '作品',
      dataIndex: 'name',
      width: 350,
      render(_: any, row: any) {
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
      dataIndex: 'watchCount'
    },
    {
      title: 'みたい数',
      dataIndex: 'watchCount'
    },
    {
      title: '上映開始時期',
      dataIndex: ''
    },
    {
      title: '上映終了時期',
      dataIndex: ''
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
      render: () => {
        return (
          <Space>
            <Button
              type="primary"
              onClick={() => {
                router.push(`/movieDetail`)
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
      <Query>
        <QueryItem label="作品" column={1}>
          <Input></Input>
        </QueryItem>
        <QueryItem label="上映ステータス">
          <Select>
            {Object.entries(status).map((item, index) => {
              const [key, value] = item

              return <Select.Option value={key}>{value}</Select.Option>
            })}
          </Select>
        </QueryItem>
      </Query>
      <section
        style={{
          margin: '30px 0'
        }}
      ></section>
      <Table
        columns={columns}
        dataSource={data}
        bordered={true}
        pagination={{
          pageSize: 10,
          position: ['bottomCenter']
        }}
      />
    </section>
  )
}
