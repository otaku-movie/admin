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
import type { FormInstance, TableColumnsType } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../layout'
import http from '@/api'
import { Query, QueryItem } from '@/components/query'
import { CheckPermission } from '@/components/checkPermission'
import { showTotal } from '@/utils/pagination'
import { DictModal } from '@/dialog/dictModal'

interface DictItemModal {
  data: { name: string; code: string }[]
  show: boolean
  dictId: null | number
  form: [FormInstance]
}

interface SearchQuery {
  name?: string
  code?: string
}

export default function CinemaPage({ params: { lng } }: PageProps) {
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState<SearchQuery>({})
  const [modal, setModal] = useState<DictItemModal>({
    data: [],
    dictId: null,
    form: Form.useForm(),
    show: false
  })
  const [dictModal, setDictModal] = useState({
    type: 'create',
    show: false,
    data: {}
  })
  const { t } = useTranslation(lng, 'dict')
  const { t: common } = useTranslation(lng, 'common')
  const getData = (page = 1) => {
    http({
      url: 'dict/list',
      method: 'post',
      data: {
        page,
        pageSize: 10,
        ...query
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
            <CheckPermission code="dict.item.save">
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
                }}
              >
                {common('button.dictDetail')}
              </Button>
            </CheckPermission>
            <CheckPermission code="dict.save">
              <Button
                type="primary"
                onClick={() => {
                  setDictModal({
                    data: row,
                    show: true,
                    type: 'edit'
                  })
                }}
              >
                {common('button.edit')}
              </Button>
            </CheckPermission>
            <CheckPermission code="dict.remove">
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
                          url: 'admin/dict/remove',
                          method: 'delete',
                          params: {
                            id: row.id
                          }
                        })
                          .then((res) => {
                            message.success(res.message)
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

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '30px'
      }}
    >
      <Row justify="end">
        <CheckPermission code="dict.save">
          <Button
            onClick={() => {
              setDictModal({
                show: true,
                data: {},
                type: 'create'
              })
            }}
          >
            {common('button.add')}
          </Button>
        </CheckPermission>
      </Row>
      <Query
        initialValues={{}}
        onSearch={() => {
          getData()
        }}
        onClear={(obj) => {
          setQuery({ ...obj })
          getData()
        }}
      >
        <QueryItem label={t('table.name')} column={1}>
          <Input
            allowClear
            value={query.name}
            onChange={(e) => {
              setQuery({
                ...query,
                name: e.target.value
              })
            }}
          ></Input>
        </QueryItem>
        <QueryItem label={t('table.code')} column={1}>
          <Input
            allowClear
            value={query.code}
            onChange={(e) => {
              setQuery({
                ...query,
                code: e.target.value
              })
            }}
          ></Input>
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
          showTotal,
          onChange(page) {
            getData(page)
          },
          position: ['bottomCenter']
        }}
      />
      <DictModal
        type={dictModal.type as 'create' | 'edit'}
        show={dictModal.show}
        data={dictModal.data}
        onCancel={() => {
          setDictModal({
            ...dictModal,
            show: false
          })
        }}
        onConfirm={() => {
          getData()
          setDictModal({
            ...dictModal,
            show: false
          })
        }}
      ></DictModal>
      <Modal
        title={t('dictItemModal.title')}
        open={modal.show}
        maskClosable={false}
        onOk={() => {
          modal.form[0].validateFields().then(() => {
            const every = modal.data.every((item) => !!item.name && !!item.code)
            const map = modal.data.map((item) => item.code)

            if (!every) {
              return message.warning(t('dictItemModal.message.required'))
            }
            if (modal.data.length !== new Set(map).size) {
              return message.warning(t('dictItemModal.message.repeat'))
            } else {
              http({
                url: '/admin/dict/item/save',
                method: 'post',
                data: {
                  dictId: modal.dictId,
                  dictItem: modal.data
                }
              }).then(() => {
                setModal({
                  ...modal,
                  show: false
                })
              })
            }
          })
        }}
        onCancel={() => {
          setModal({
            ...modal,
            show: false
          })
        }}
      >
        <Form
          name="basic"
          {...formItemLayoutWithOutLabel}
          initialValues={modal.data}
          form={modal.form[0]}
        >
          <Form.Item
            label={''}
            name={['name', 'code']}
            required
            rules={[
              {
                required: true,
                validator() {
                  const every = modal.data.every(
                    (item) => !item.name && !item.code
                  )

                  if (every) {
                    return Promise.reject(
                      new Error(t('dictItemModal.message.required'))
                    )
                  } else {
                    return Promise.resolve()
                  }
                },
                validateTrigger: ['onBlur']
              },
              {
                required: true,
                validator() {
                  const map = modal.data.map((item) => item.code)

                  if (modal.data.length !== new Set(map).size) {
                    return Promise.reject(
                      new Error(t('dictItemModal.message.repeat'))
                    )
                  } else {
                    return Promise.resolve()
                  }
                },
                validateTrigger: ['onBlur']
              }
            ]}
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
                {common('button.add')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </section>
  )
}
