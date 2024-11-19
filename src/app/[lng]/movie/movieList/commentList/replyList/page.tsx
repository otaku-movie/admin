'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Row, message, Modal } from 'antd'
import type { TableColumnsType } from 'antd'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../../../../layout'
import http from '@/api'
import { CheckPermission } from '@/components/checkPermission'
import { ReplyModal } from '@/dialog/replyModal'
import { showTotal } from '@/utils/pagination'
import { useSearchParams } from 'next/navigation'

export default function Page({ params: { lng } }: PageProps) {
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const searchParams = useSearchParams()
  const { t } = useTranslation(lng, 'reply')
  const { t: common } = useTranslation(lng, 'common')
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
        pageSize: 10,
        commentId: searchParams.get('id')
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
    }
    // {
    //   title: t('table.action'),
    //   key: 'operation',
    //   fixed: 'right',
    //   width: 200,
    //   render: (_, row) => {
    //     return (
    //       <Space>
    //         <Button
    //           type="primary"
    //           onClick={() => {
    //             http({
    //               url: 'movie/reply/detail',
    //               method: 'get',
    //               params: {
    //                 id: row.id
    //               }
    //             }).then((res) => {
    //               setModal({
    //                 ...modal,
    //                 action: 'comment',
    //                 data: res.data,
    //                 type: 'edit',
    //                 show: true
    //               })
    //             })
    //           }}
    //         >
    //           {common('button.edit')}
    //         </Button>
    //         <Button
    //           type="primary"
    //           onClick={() => {
    //             const parentReplyId =
    //               row.parentReplyId === null
    //                 ? `${row.id}`
    //                 : `${row.parentReplyId}-${row.id}`

    //             setModal({
    //               ...modal,
    //               action: 'reply',
    //               data: {
    //                 id: row.id,
    //                 parentReplyId,
    //                 commentUserId: row.commentUserId
    //               },
    //               type: 'edit',
    //               show: true
    //             })
    //           }}
    //         >
    //           {common('button.reply.reply')}
    //         </Button>
    //         <CheckPermission code="reply.remove">
    //           <Button
    //             type="primary"
    //             danger
    //             onClick={() => {
    //               Modal.confirm({
    //                 title: common('button.remove'),
    //                 content: t('message.remove.content'),
    //                 onCancel() {
    //                   console.log('Cancel')
    //                 },
    //                 onOk() {
    //                   return new Promise((resolve, reject) => {
    //                     http({
    //                       url: 'movie/reply/remove',
    //                       method: 'delete',
    //                       params: {
    //                         id: row.id
    //                       }
    //                     })
    //                       .then((res) => {
    //                         message.success(res.message)
    //                         getData()
    //                         resolve(true)
    //                       })
    //                       .catch(reject)
    //                   })
    //                 }
    //               })
    //             }}
    //           >
    //             {common('button.remove')}
    //           </Button>
    //         </CheckPermission>
    //       </Space>
    //     )
    //   }
    // }
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
              action: 'comment',
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
