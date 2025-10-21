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
  TableColumnsType,
  ColorPicker
} from 'antd'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'

interface Query {
  id?: number
  name?: string
  color?: string
  price?: number
  hover: boolean
  selected?: boolean
}

interface Result {
  data: Query[]
  selected: Query[]
}

interface modalProps {
  show?: boolean
  data: Query[]
  onConfirm?: (result: Result) => void
  onCancel?: () => void
  hasSelectedSeats?: boolean
}

interface ModalState {
  type: 'create' | 'edit'
  index: number | undefined
  show: boolean
}

export function AreaModal(props: modalProps) {
  const [form] = Form.useForm()
  const [query, setQuery] = useState<Query>({
    hover: false,
    selected: false
  })
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
  const [selectedRows, setSelectedRows] = useState<Query[]>([])

  // 预设颜色选项
  const presetColors = [
    '#ff4d4f', // 红色
    '#fa8c16', // 橙色
    '#faad14', // 黄色
    '#52c41a', // 绿色
    '#1890ff', // 蓝色
    '#722ed1', // 紫色
    '#eb2f96', // 粉色
    '#13c2c2', // 青色
    '#8c8c8c', // 灰色
    '#f5222d', // 深红色
    '#fa541c', // 深橙色
    '#a0d911' // 浅绿色
  ]

  const columns: TableColumnsType<Query> = [
    {
      title: t('areaModal.form.name.label'),
      dataIndex: 'name'
    },
    {
      title: t('areaModal.table.color'),
      dataIndex: 'color',
      render: (color: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: color,
              border: '1px solid #d9d9d9',
              borderRadius: '4px'
            }}
          />
          <span>{color}</span>
        </div>
      )
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
                setQuery({
                  ...row,
                  hover: row.hover || false,
                  selected: row.selected || false
                })
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
    }
  }, [props.data])
  useEffect(() => {
    if (modal.show && modal.type === 'create') {
      setQuery({
        hover: false,
        selected: false
      })
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
                setQuery({
                  hover: false,
                  selected: false
                })
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
          {props.hasSelectedSeats ? (
            <Table
              rowSelection={{
                type: 'radio',
                selectedRowKeys: selectedRows.map(
                  (item) => item.name as string
                ),
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
          ) : (
            <div>
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  color: '#52c41a'
                }}
              >
                {t('areaModal.message.noSeatsSelected')}
              </div>
              <Table
                rowKey={'name'}
                columns={columns}
                dataSource={data}
                pagination={false}
              />
            </div>
          )}
        </section>
      </Modal>
      <Modal
        title={t('areaModal.title')}
        open={modal.show}
        maskClosable={false}
        onOk={() => {
          form.validateFields().then(() => {
            if (data.length < 5) {
              if (modal.type === 'create') {
                data.push({
                  ...query,
                  id: data.length,
                  hover: false,
                  selected: false
                })
              } else {
                // 编辑模式
                data[modal.index!] = {
                  ...query,
                  id: data[modal.index!].id,
                  hover: data[modal.index!].hover,
                  selected: data[modal.index!].selected
                }
              }

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
            label={t('areaModal.form.color.label')}
            name={'color'}
            rules={[
              {
                required: true,
                message: t('areaModal.form.color.required')
              }
            ]}
          >
            <ColorPicker
              value={query.color}
              onChange={(color) => {
                setQuery({
                  ...query,
                  color: color.toHexString()
                })
              }}
              showText
              presets={[
                {
                  label: t('areaModal.form.color.presets'),
                  colors: presetColors
                }
              ]}
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
              min={0}
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
