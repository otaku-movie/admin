'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Input, Row, message, Modal } from 'antd'
import type { TableColumnsType } from 'antd'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../../../layout'
import http from '@/api'
import { Query, QueryItem } from '@/components/query'
import { processPath } from '@/config/router'
import { CheckPermission } from '@/components/checkPermission'
import { CommentModal } from '@/dialog/commentModal'
import { showTotal } from '@/utils/pagination'

export default function Page({ params: { lng } }: PageProps) {
  const router = useRouter()

  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const { t } = useTranslation(lng, 'comment')
  const { t: common } = useTranslation(lng, 'common')
  const searchParams = useSearchParams()

  const [modal, setModal] = useState({
    type: 'create',
    show: false,
    data: {}
  })

  const getData = (page = 1) => {
    http({
      url: 'movie/comment/list',
      method: 'post',
      data: {
        movieId: searchParams.get('id'),
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
      title: t('table.user'),
      dataIndex: 'commentUserName'
    },
    {
      title: t('table.content'),
      dataIndex: 'content'
    },
    {
      title: t('table.replyCount'),
      dataIndex: 'replyCount'
    },
    {
      title: t('table.likeCount'),
      dataIndex: 'likeCount'
    },
    {
      title: t('table.stepOnCount'),
      dataIndex: 'unlikeCount'
    },
    {
      title: t('table.action'),
      key: 'operation',
      fixed: 'right',
      width: 200,
      render: (_, row) => {
        return (
          <Space>
            {/* <Button
              type="primary"
              onClick={() => {
                http({
                  url: 'movie/comment/detail',
                  method: 'get',
                  params: {
                    id: row.id
                  }
                }).then((res) => {
                  setModal({
                    ...modal,
                    data: res.data,
                    type: 'edit',
                    show: true
                  })
                })
              }}
            >
              {common('button.edit')}
            </Button> */}
            <Button
              type="primary"
              onClick={() => {
                router.push(
                  processPath({
                    name: 'replyList',
                    query: {
                      id: row.id,
                      movieId: searchParams.get('id')
                    }
                  })
                )
              }}
            >
              {common('button.comment.replyList')}
            </Button>
            {/* <CheckPermission code="comment.remove">
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
                          url: 'movie/comment/remove',
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
            </CheckPermission> */}
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
        {/* <Button
          onClick={() => {
            setModal({
              ...modal,
              data: {},
              type: 'create',
              show: true
            })
          }}
        >
          {common('button.add')}
        </Button> */}
      </Row>
      {/* <Query>
        <QueryItem label={t('table.user')} column={1}>
          <Input></Input>
        </QueryItem>
      </Query> */}
      <Table
        columns={columns}
        dataSource={data}
        bordered={true}
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
      <CommentModal
        type={modal.type as 'create' | 'edit'}
        show={modal.show}
        data={modal.data}
        onCancel={() => {
          setModal({
            ...modal,
            show: false
          })
        }}
        onConfirm={() => {
          setModal({
            ...modal,
            show: false
          })
          getData()
        }}
      ></CommentModal>
    </section>
  )
}
