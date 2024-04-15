'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Row, Col, Image, Tag } from 'antd'

import type { TableColumnsType } from 'antd'
import { useRouter } from 'next/navigation'

export default function Theater() {
  const router = useRouter()
  const [data, setData] = useState([
    {
      name: '劇場版『名探偵コナン 100万ドルの五稜星（みちしるべ）』',
      level: 'G',
      time: 113,
      watchCount: 1000,
      commentCount: 100,
      key: 1,
      children: [
        {
          key: '1-1'
        },
        {
          key: '1-2'
        }
      ]
    },
    {
      name: '劇場版『名探偵コナン 100万ドルの五稜星（みちしるべ）』',
      level: 'G',
      time: 113,
      watchCount: 1000,
      commentCount: 100,
      key: 2,
      children: [
        {
          key: '2-1'
        }
      ]
    }
  ])
  const columns = [
    {
      title: 'シアター名',
      dataIndex: ''
    },
    {
      title: 'スクリーン規格',
      dataIndex: ''
    },
    {
      title: 'シート数',
      dataIndex: ''
    },
    {
      title: '操作',
      key: 'operation',
      fixed: 'right',
      width: 250,
      render: () => {
        return (
          <Space>
            <Button
              type="primary"
              onClick={() => {
                // router.push(`/screenDetail`)
              }}
            >
              シート詳細
            </Button>
            <Button
              type="primary"
              onClick={() => {
                router.push(`/screenDetail`)
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

  const subTableColumn = [
    {
      title: '作品',
      dataIndex: ''
    },
    {
      title: '開始時間',
      dataIndex: ''
    },
    {
      title: '終了時間',
      dataIndex: ''
    },
    {
      title: '購入人数',
      dataIndex: ''
    },
    {
      title: '操作',
      key: 'operation',
      fixed: 'right',
      width: 100,
      render: () => {
        return (
          <Space>
            <Button
              type="primary"
              onClick={() => {
                router.push(`/screenDetail`)
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
      <Table
        columns={columns}
        rowKey="key"
        expandable={{
          // defaultExpandAllRows: true,
          expandedRowRender(row) {
            return (
              <Table
                rowKey="key"
                columns={subTableColumn}
                dataSource={row.children}
                bordered={true}
                pagination={false}
              />
            )
          }
        }}
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
