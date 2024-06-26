import React, { useEffect, useState } from 'react'
import {
  Form,
  Modal,
  Input,
  Space,
  Button,
  Table,
  Row,
  InputNumber,
  message,
  TableColumnsType
} from 'antd'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'

interface Query {
  id?: number
  name?: string
  color?: string
  price?: number
}

interface Result {
  data: Query[]
  selected: Query[]
}

interface modalProps {
  show?: boolean
  data: Record<string, any>[]
  onConfirm?: (result: Result) => void
  onCancel?: () => void
}

interface ModalState {
  type: 'create' | 'edit'
  index: number | undefined
  show: boolean
}

export function AreaModal(props: modalProps) {
  const [form] = Form.useForm()
  const [query, setQuery] = useState<Query>({})
  const [data, setData] = useState<Query[]>(props.data)
  const { t } = useTranslation(
    navigator.language as languageType,
    'theaterHall'
  )
  const { t: common } = useTranslation(
    navigator.language as languageType,
    'common'
  )
  const [modal, setModal] = useState<ModalState>({
    type: 'create',
    index: undefined,
    show: false
  })
  const [areaColor, setAreaColor] = useState([
    'red',
    'orange',
    'purple',
    'green',
    'yellow'
  ])
  const [selectedRows, setSelectedRows] = useState<Query[]>([])
  const [colorIndex, setColorIndex] = useState(0)

  const columns: TableColumnsType<Query> = [
    {
      title: t('areaModal.form.name.label'),
      dataIndex: 'name'
    },
    {
      title: t('areaModal.table.color'),
      dataIndex: 'color'
    },
    {
      title: t('areaModal.form.price.label'),
      dataIndex: 'price'
    },
    {
      title: t('areaModal.table.action'),
      key: 'operation',
      width: 100,
      render: (_, row, index: number) => {
        return (
          <Space>
            <Button
              type="primary"
              onClick={() => {
                setQuery({ ...row })
                form.setFieldsValue({ ...row })
                setModal({
                  type: 'edit',
                  index,
                  show: true
                })
              }}
            >
              {common('button.edit')}
            </Button>
            <Button
              type="primary"
              danger
              onClick={() => {
                console.log(index)
                data.splice(index, 1)
                setData([...data])
              }}
            >
              {common('button.remove')}
            </Button>
          </Space>
        )
      }
    }
  ]

  useEffect(() => {
    if (props.data) {
      setData([...props.data])
      setColorIndex(props.data.length)
    }
  }, [props.data])
  useEffect(() => {
    if (modal.show && modal.type === 'create') {
      setQuery({})
      form.resetFields()
    }
  }, [modal.show, modal.type, form])

  return (
    <>
      <Modal
        title={t('areaModal.title')}
        open={props.show}
        maskClosable={false}
        onOk={() => {
          if (selectedRows.length === 1) {
            props?.onConfirm?.({
              data,
              selected: selectedRows
            })
          } else {
            message.warning(t('areaModal.message.required'))
          }
        }}
        onCancel={props?.onCancel}
        width={'800px'}
      >
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
                setQuery({})
                form.setFieldsValue({})
                setModal({
                  ...modal,
                  type: 'create',
                  show: true
                })
              }}
            >
              {common('button.add')}
            </Button>
          </Row>
          <Table
            rowSelection={{
              type: 'radio',
              selectedRowKeys: selectedRows.map((item) => item.name as string),
              onChange: (
                selectedRowKeys: React.Key[],
                selectedRows: Query[]
              ) => {
                setSelectedRows(selectedRows)
              }
            }}
            rowKey={'name'}
            columns={columns}
            dataSource={data}
            pagination={false}
          />
        </section>
      </Modal>
      <Modal
        title={t('areaModal.title')}
        open={modal.show}
        maskClosable={false}
        onOk={() => {
          form.validateFields().then(() => {
            if (data.length < 5) {
              data.push({
                ...query,
                id: data.length,
                color: areaColor[colorIndex]
              })
              setColorIndex(colorIndex + 1)

              setAreaColor(areaColor)
              setData([...data])
              setModal({
                ...modal,
                show: false
              })
            } else {
              message.warning(t('areaModal.message.max'))
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
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
          form={form}
        >
          <Form.Item
            label={t('areaModal.form.name.label')}
            rules={[
              { required: true, message: t('areaModal.form.name.required') },
              {
                validator() {
                  if (modal.type === 'create') {
                    const findIndex = data.findIndex(
                      (item) => item.name === query.name
                    )

                    if (findIndex !== -1) {
                      return Promise.reject(
                        new Error(t('areaModal.form.name.repeat'))
                      )
                    } else {
                      return Promise.resolve()
                    }
                  } else {
                    const filter = data.filter(
                      (item, index) => index !== modal.index!
                    )
                    const findIndex = filter.findIndex(
                      (item) => item.name === query.name
                    )

                    if (findIndex !== -1) {
                      return Promise.reject(
                        new Error(t('areaModal.form.name.repeat'))
                      )
                    } else {
                      return Promise.resolve()
                    }
                  }
                },
                validateTrigger: ['onChange']
              }
            ]}
            name="name"
          >
            <Input
              value={query.name}
              placeholder={t('areaModal.form.name.required')}
              onChange={(e) => {
                setQuery({
                  ...query,
                  name: e.currentTarget.value
                })
              }}
            />
          </Form.Item>
          <Form.Item
            label={t('areaModal.form.price.label')}
            name={'price'}
            rules={[
              {
                required: true,
                message: t('areaModal.form.price.required')
              }
            ]}
          >
            <InputNumber
              min={1}
              value={query.price}
              precision={0}
              placeholder={t('areaModal.form.price.required')}
              style={{
                width: '315px'
              }}
              onChange={(val) => {
                setQuery({
                  ...query,
                  price: val as number
                })
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
