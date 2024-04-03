'use client'
import React from 'react';
import { Table } from 'antd';
import { useState, useEffect } from 'react';
import type { TableColumnsType } from 'antd';

export default function Movie () {
  const [data, setData] = useState([
    {
      name: 'すずめの戸締り',
      level: 'G',
      watchCount: 1000,
      commentCount: 100
    }
  ])
  const columns = [
    {
      title: 'タイトル',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: 'レベル',
      dataIndex: 'level',
    },
    {
      title: 'コメント数',
      dataIndex: 'commentCount',
    },
    {
      title: '鑑賞数',
      dataIndex: 'watchCount',
    },
    {
      title: '上映開始時期',
      dataIndex: '',
    },
    {
      title: '上映終了時期',
      dataIndex: '',
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