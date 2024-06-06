'use client'
import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Input,
  Row,
  message,
  Modal,
  Form,
  InputNumber
} from 'antd'
import type { TableColumnsType } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../layout'
import http from '@/api'
import { Query, QueryItem } from '@/components/query'
import { CheckPermission } from '@/components/checkPermission'

export default function CinemaPage({ params: { lng } }: PageProps) {
  const router = useRouter()

  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  // const form = Form.useFormInstance()
  const [modal, setModal] = useState({
    data: [],
    dictId: null,
    form: Form.useFormInstance(),
    show: false
  })
  const { t } = useTranslation(lng, 'dict')
  const { t: common } = useTranslation(lng, 'common')
  const getData = (page = 1) => {
    http({
      url: 'dict/list',
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
      title: t('table.code'),
      dataIndex: 'code'
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
                onClick={() => {
                  http({
                    url: 'dict/detail',
                    method: 'get',
                    params: {
                      id: row.id
                    }
                  }).then((res) => {
                    setModal({
                      ...modal,
                      data: res.data,
                      dictId: row.id,
                      show: true
                    })
                  })

                  // router.push(`/${lng}/cinemaDetail?id=${row.id}`)
                }}
              >
                {t('button.detail')}
              </Button>
            </CheckPermission>
            <CheckPermission code="">
              <Button type="primary" onClick={() => {}}>
                {common('button.edit')}
              </Button>
            </CheckPermission>
            <CheckPermission code="">
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
                          url: 'dict/remove',
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

  const formItemLayoutWithOutLabel = {
    wrapperCol: {
      xs: { span: 24, offset: 0 },
      sm: { span: 20, offset: 4 }
    }
  }

  const onFinish = (values: any) => {
    console.log('Received values of form:', values)
  }

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
            router.push(`/${lng}/cinemaDetail`)
          }}
        >
          {common('button.add')}
        </Button>
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
      <Modal
        title="Basic Modal"
        open={modal.show}
        maskClosable={false}
        onOk={() => {
          http({
            url: '/dict/item/edit',
            method: 'post',
            data: {
              dictId: modal.dictId,
              dictItem: modal.data
            }
          }).then(() => {
            setModal({
              ...modal,
              data: [],
              dictId: null,
              show: false
            })
          })
        }}
        onCancel={() => {
          setModal({
            ...modal,
            data: [],
            dictId: null,
            show: false
          })
        }}
      >
        <Form
          name="dynamic_form_item"
          {...formItemLayoutWithOutLabel}
          onFinish={onFinish}
          initialValues={modal.data}
        >
          <Form.Item
            label={''}
            name="username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Space direction="vertical" size={15}>
              {modal.data.map((item: any, index: number) => {
                return (
                  <Space size={15} key={item.id}>
                    <InputNumber
                      min={1}
                      value={item.code}
                      onChange={(val) => {
                        item.code = val

                        setModal({
                          ...modal,
                          data: modal.data
                        })
                      }}
                    />
                    <Input
                      value={item.name}
                      style={{ width: '250px' }}
                      onChange={(e) => {
                        item.name = e.currentTarget.value

                        setModal({
                          ...modal,
                          data: modal.data
                        })
                      }}
                    ></Input>
                    <MinusCircleOutlined
                      onClick={() => {
                        modal.data.splice(index, 1)

                        setModal({
                          ...modal,
                          data: modal.data
                        })
                      }}
                    />
                  </Space>
                )
              })}
              <Button
                type="dashed"
                style={{
                  width: '100%'
                }}
                onClick={() => {
                  modal.data.push({
                    dictId: modal.dictId,
                    code: undefined,
                    name: ''
                  } as never)
                  setModal({
                    ...modal,
                    data: modal.data
                  })
                }}
                icon={<PlusOutlined />}
              >
                Add field
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </section>
  )
}
