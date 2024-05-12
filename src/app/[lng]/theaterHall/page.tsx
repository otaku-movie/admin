'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Row, Col } from 'antd'
import type { TableColumnsType } from 'antd'
import { useRouter } from 'next/navigation'
import SeatModal from '@/dialog/seatModal'
import http from '@/api'
import { PageProps } from '../layout'
import { useTranslation } from '@/app/i18n/client'

export default function Page({ params: { lng } }: PageProps) {
  const router = useRouter()
  const [modal, setModal] = useState<any>({
    data: [],
    show: false
  })
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const { t } = useTranslation(lng, 'theaterHall')

  const getData = (page = 1) => {
    http({
      url: 'theater/hall/list',
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

  const columns: TableColumnsType<any> = [
    {
      title: 'シアター名',
      dataIndex: 'name'
    },
    {
      title: 'スクリーン規格',
      dataIndex: 'spec'
    },
    {
      title: 'シート数',
      dataIndex: 'seatCount'
    },
    {
      title: '操作',
      key: 'operation',
      fixed: 'right',
      width: 250,
      render: (_, row) => {
        const generate2DArray = (data: any[]) => {
          // 找到所有不同的xname值
          const uniqueXNameValues = Array.from(
            new Set(data.map((item) => item.xname))
          )

          // 创建二维数组，用于存放分组后的数据
          const result = []

          // 根据不同的xname值进行分组
          uniqueXNameValues.forEach((xNameValue) => {
            // 找到当前xname值对应的所有数据
            const groupedData = data.filter((item) => item.xname === xNameValue)
            // 将当前分组的数据添加到结果数组中
            result.push({
              row: xNameValue,
              children: groupedData
            })
          })

          return result
        }

        return (
          <Space>
            <Button
              type="primary"
              onClick={() => {
                http({
                  url: 'theater/hall/seat',
                  method: 'get',
                  params: {
                    theaterHallId: row.id
                  }
                }).then((res) => {
                  const data = generate2DArray(res.data)
                  console.log(data)

                  setModal({
                    data,
                    show: true
                  })
                })
              }}
            >
              シート詳細
            </Button>
            <Button
              type="primary"
              onClick={() => {

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
    <>
      <Row
        justify="end"
        style={{
          marginBottom: '30px'
        }}
      >
        <Button onClick={() => {}}>{t('button.add')}</Button>
      </Row>
      <Table
        columns={columns}
        dataSource={data}
        bordered={true}
        pagination={{
          pageSize: 10,
          position: ['bottomCenter']
        }}
      />
      <SeatModal
        type="create"
        show={modal.show}
        data={modal.data}
        onConfirm={() => {
          setModal({
            ...modal,
            show: false
          })
        }}
        onCancel={() => {
          setModal({
            ...modal,
            show: false
          })
        }}
      ></SeatModal>
    </>
  )
}
