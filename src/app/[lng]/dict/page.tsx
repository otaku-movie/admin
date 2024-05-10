'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Input, Row, message, Modal, Form } from 'antd'
import type { TableColumnsType } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../layout'
import http from '@/api'
import { Query, QueryItem } from '@/components/query'

export default function CinemaPage({ params: { lng } }: PageProps) {
  const router = useRouter()

  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const form = Form.useFormInstance()
  const [modal, setModal] = useState({
    data: [],
    form: Form.useFormInstance(),
    show: false
  })
  const { t } = useTranslation(lng, 'dict')

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
            <Button
              type="primary"
              onClick={() => {
                http({
                  url: 'dictItem/list',
                  method: 'get',
                  params: {
                    id: row.id
                  }
                }).then((res) => {
                  // modal.form.setFields(res.data)
                  // modal.form.setFieldsValue(res.data)
                  // form.setFields(res.data)

                  setModal({
                    ...modal,
                    data: res.data,
                    show: true
                  })
                })

                // router.push(`/${lng}/cinemaDetail?id=${row.id}`)
              }}
            >
              {t('button.detail')}
            </Button>
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
              {t('button.remove')}
            </Button>
          </Space>
        )
      }
    }
  ]
  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 4 }
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 20 }
    }
  }

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
          {t('button.add')}
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
        onOk={() => {
          setModal({
            ...modal,
            data: [],
            show: false
          })
        }}
        onCancel={() => {
          setModal({
            ...modal,
            data: [],
            show: false
          })
        }}
      >
        <Form
          name="dynamic_form_item"
          {...formItemLayoutWithOutLabel}
          onFinish={onFinish}
          style={{ maxWidth: 600 }}
        >
          <Form.List
            name="names"
            rules={[
              {
                validator: async (_, names) => {
                  if (!names || names.length < 2) {
                    return Promise.reject(new Error('At least 2 passengers'))
                  }
                }
              }
            ]}
          >
            {(fields, { add, remove }, { errors }) => {
              console.log(fields)
              return (
                <>
                  {fields.map((item, index) => (
                    <Form.Item
                      {...(index === 0
                        ? formItemLayout
                        : formItemLayoutWithOutLabel)}
                      label={index === 0 ? 'Passengers' : ''}
                      required={false}
                      key={item.key}
                    >
                      <Form.Item
                        validateTrigger={['onChange', 'onBlur']}
                        name={[item.name, 'name']}
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message:
                              "Please input passenger's name or delete this field."
                          }
                        ]}
                        noStyle
                      >
                        <Input
                          placeholder="passenger name"
                          style={{ width: '60%' }}
                        />
                      </Form.Item>
                      {fields.length > 1 ? (
                        <MinusCircleOutlined
                          className="dynamic-delete-button"
                          onClick={() => remove(item.name)}
                        />
                      ) : null}
                    </Form.Item>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      style={{ width: '60%' }}
                      icon={<PlusOutlined />}
                    >
                      Add field
                    </Button>
                    <Form.ErrorList errors={errors} />
                  </Form.Item>
                </>
              )
            }}
          </Form.List>
        </Form>
      </Modal>
    </section>
  )
}
