'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Input, Row, message, Modal, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '@/app/[lng]/layout'
import http from '@/api'
import { Query, QueryItem } from '@/components/query'
import { processPath } from '@/config/router'
import { CheckPermission } from '@/components/checkPermission'
import { showTotal } from '@/utils/pagination'

export default function CinemaPage({ params: { lng } }: PageProps) {
  const router = useRouter()

  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const { t } = useTranslation(lng, 'cinema')
  const { t: common } = useTranslation(lng, 'common')

  const getData = (page = 1) => {
    http({
      url: 'cinema/list',
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

  const columns: TableColumnsType = [
    {
      title: t('table.name'),
      width: 250,
      fixed: 'left',
      dataIndex: 'name'
    },
    {
      title: t('table.spec'),
      width: 250,
      render(_, row) {
        return (
          <Space direction="vertical">
            {row.spec?.map((item: { id: number; name: string }) => {
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
          </Space>
        )
      }
    },
    {
      title: t('table.theaterCount'),
      width: 150,
      dataIndex: 'theaterCount'
    },
    {
      title: t('table.address'),
      width: 300,
      dataIndex: 'address'
    },
    {
      title: t('table.tel'),
      width: 200,
      dataIndex: 'tel'
    },
    {
      title: t('table.homePage'),
      width: 300,
      dataIndex: 'homePage'
    },
    {
      width: 200,
      title: t('table.maxSelectSeatCount'),
      dataIndex: 'maxSelectSeatCount'
    },
    {
      title: t('table.action'),
      key: 'operation',
      fixed: 'right',
      align: 'center',
      width: 450,
      render: (_, row) => {
        return (
          <Space>
            <Button
              type="primary"
              onClick={() => {
                router.push(
                  processPath({
                    name: 'ticketType',
                    query: {
                      id: row.id
                    }
                  })
                )
              }}
            >
              {common('button.ticketType')}
            </Button>
            <Button
              type="primary"
              onClick={() => {
                router.push(
                  processPath({
                    name: 'theaterHall',
                    query: {
                      id: row.id
                    }
                  })
                )
              }}
            >
              {common('button.theaterHallDetail')}
            </Button>
            <CheckPermission code="cinema.save">
              <Button
                type="primary"
                onClick={() => {
                  router.push(
                    processPath({
                      name: 'cinemaDetail',
                      query: {
                        id: row.id
                      }
                    })
                  )
                }}
              >
                {common('button.edit')}
              </Button>
            </CheckPermission>
            <CheckPermission code="cinema.remove">
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
                        http({
                          url: 'cinema/remove',
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
                {common('button.remove')}
              </Button>
            </CheckPermission>
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
        <CheckPermission code="cinema.save">
          <Button
            onClick={() => {
              router.push(processPath('cinemaDetail'))
            }}
          >
            {common('button.add')}
          </Button>
        </CheckPermission>
      </Row>
      <Query>
        <QueryItem label={t('table.name')} column={1}>
          <Input></Input>
        </QueryItem>
      </Query>
      <Table
        columns={columns}
        dataSource={data}
        bordered={true}
        scroll={{
          x: columns.reduce(
            (total, current) => total + (current.width as number),
            0
          )
        }}
        pagination={{
          pageSize: 10,
          current: page,
          total,
          showTotal,
          onChange(page) {
            getData(page)
          },
          position: ['bottomCenter']
        }}
      />
    </section>
  )
}
