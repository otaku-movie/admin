'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Input, Row, message, Modal } from 'antd'
import type { TableColumnsType } from 'antd'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../../../../layout'
import http from '@/api'
import { Query, QueryItem } from '@/components/query'
import { processPath } from '@/config/router'
import { CheckPermission } from '@/components/checkPermission'
import { ReplyModal } from '@/dialog/replyModal'
import { showTotal } from '@/utils/pagination'

export default function CinemaPage({ params: { lng } }: PageProps) {
  const router = useRouter()

  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const { t } = useTranslation(lng, 'reply')
  const [modal, setModal] = useState({
    type: 'create',
    show: false,
    action: 'comment',
    data: {}
  })

  const getData = (page = 1) => {
    http({
      url: 'movie/reply/list',
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
      title: 'Id',
      dataIndex: 'id'
    },
    {
      title: t('table.commentUser'),
      dataIndex: 'commentUserName'
    },
    {
      title: t('table.replyUser'),
      dataIndex: 'replyUserName'
    },
    {
      title: t('table.content'),
      dataIndex: 'content'
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
            <Button
              type="primary"
              onClick={() => {
                http({
                  url: 'movie/reply/detail',
                  method: 'get',
                  params: {
                    id: row.id
                  }
                }).then((res) => {
                  setModal({
                    ...modal,
                    action: 'comment',
                    data: res.data,
                    type: 'edit',
                    show: true
                  })
                })
              }}
            >
              {t('button.edit')}
            </Button>
            <Button
              type="primary"
              onClick={() => {
                setModal({
                  ...modal,
                  action: 'reply',
                  data: {
                    id: row.id,
                    parentReplyId: row.id,
                    commentUserId: row.commentUserId
                  },
                  type: 'edit',
                  show: true
                })
              }}
            >
              {t('button.reply')}
            </Button>
            <CheckPermission code="">
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
                          url: 'movie/reply/remove',
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
        <Button
          onClick={() => {
            setModal({
              ...modal,
              data: {},
              action: 'comment',
              type: 'create',
              show: true
            })
          }}
        >
          {t('button.add')}
        </Button>
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
      <ReplyModal
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
      ></ReplyModal>
    </section>
  )
}
