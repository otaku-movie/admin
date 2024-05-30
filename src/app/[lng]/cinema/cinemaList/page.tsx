'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Input, Row, message, Modal } from 'antd'
import type { TableColumnsType } from 'antd'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '@/app/[lng]/layout'
import http from '@/api'
import { Query, QueryItem } from '@/components/query'
import { processPath } from '@/config/router'
import { CheckPermission } from '@/components/checkPermission'

export default function CinemaPage({ params: { lng } }: PageProps) {
  const router = useRouter()

  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const { t } = useTranslation(lng, 'cinema')

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
      dataIndex: 'name'
    },
    {
      title: t('table.description'),
      dataIndex: 'description'
    },
    {
      title: t('table.address'),
      dataIndex: 'address'
    },
    {
      title: t('table.tel'),
      dataIndex: 'tel'
    },
    {
      title: t('table.homePage'),
      dataIndex: 'homePage'
    },
    {
      title: t('table.action'),
      key: 'operation',
      fixed: 'right',
      width: 200,
      render: (_, row) => {
        return (
          <Space>
            <CheckPermission code="">
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
                {t('button.detail')}
              </Button>
            </CheckPermission>
            <CheckPermission code="cinema.edit">
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
                {t('button.edit')}
              </Button>
            </CheckPermission>
            <CheckPermission code="cinema.remove">
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
                {t('button.remove')}
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
        <CheckPermission code="cinema.add">
          <Button
            onClick={() => {
              router.push(processPath('cinemaDetail'))
            }}
          >
            {t('button.add')}
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
        pagination={{
          pageSize: 10,
          current: page,
          total,
          position: ['bottomCenter']
        }}
      />
    </section>
  )
}
