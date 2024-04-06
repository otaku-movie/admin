'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Row, Col, Image, Tag } from 'antd'

import type { TableColumnsType } from 'antd'
import movie from '../../assets/image/conan-movie.png'
import { status } from '../../config/index'
import { useRouter } from 'next/navigation'

export default function Theater() {
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
      title: '劇場名',
      dataIndex: 'level'
    },
    {
      title: '住所',
      dataIndex: 'commentCount'
    },
    {
      title: '電話番号',
      dataIndex: 'watchCount'
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
                router.push(`/screenDetail`)
              }}
            >
              シアター詳細
            </Button>
            <Button type="primary">編集</Button>
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
