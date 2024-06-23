'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import { Form, Modal, Input, InputNumber, Select, Space } from 'antd'
import { useSearchParams } from 'next/navigation'
import http from '@/api'
import { languageType } from '@/config'

interface Query {
  id?: number
  name: string
  cinemaSpecId: number | undefined
  rowCount?: number
  columnCount?: number
}

interface TheaterHallModalProps {
  type: 'create' | 'edit'
  show?: boolean
  data: Query
  onConfirm?: () => void
  onCancel?: () => void
}

export default function TheaterHallModal(props: TheaterHallModalProps) {
  const { t } = useTranslation(
    navigator.language as languageType,
    'theaterHall'
  )
  const [query, setQuery] = useState<Query>({
    name: '',
    cinemaSpecId: undefined
  })
  const [specList, setSpecList] = useState<any[]>([])
  const searchParams = useSearchParams()
  const [form] = Form.useForm()

  const onConfirm = () => {
    const save = () => {
      http({
        url: 'admin/theater/hall/save',
        method: 'post',
        data: {
          ...query,
          cinemaId: searchParams.get('id')
        }
      }).then(() => {
        props.onConfirm?.()
      })
    }
    form.validateFields().then(() => {
      if (
        props.data.rowCount !== query.rowCount ||
        props.data.columnCount !== query.columnCount
      ) {
        Modal.confirm({
          // title: common('button.remove'),
          content: t('message.changeSeatCount.content'),
          onCancel() {
            console.log('Cancel')
          },
          onOk() {
            save()
          }
        })
      } else {
        save()
      }
    })
  }

  const getData = () => {
    http({
      url: 'cinema/spec',
      method: 'get',
      params: {
        cinemaId: searchParams.get('id')
      }
    }).then((res) => {
      setSpecList(res.data)
    })
  }

  useEffect(() => {
    getData()
    setQuery(props.data)
    form.resetFields()
    form.setFieldsValue({ ...props.data })
    // form.setFieldsValue()
  }, [form, props.data])

  return (
    <Modal
      title={
        props.type === 'edit'
          ? t('theaterHallModal.title.edit')
          : t('theaterHallModal.title.create')
      }
      width={700}
      open={props.show}
      maskClosable={false}
      onOk={onConfirm}
      okButtonProps={{
        htmlType: 'submit'
      }}
      onCancel={props?.onCancel}
    >
      <Form
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ width: '400px' }}
        // initialValues={data}
        autoComplete="off"
        form={form}
      >
        <Form.Item
          label={t('theaterHallModal.form.name.label')}
          name="name"
          rules={[
            {
              required: true,
              message: t('theaterHallModal.form.name.required')
            }
          ]}
        >
          <Input
            value={query.name}
            onChange={(e) => {
              // data.name = e.currentTarget.value
              setQuery({
                ...query,
                name: e.currentTarget.value
              })
            }}
          ></Input>
        </Form.Item>
        <Form.Item
          label={t('theaterHallModal.form.spec.label')}
          name="cinemaSpecId"
          rules={[
            {
              required: !true,
              message: t('theaterHallModal.form.spec.required')
            }
          ]}
        >
          <Space>
            <Select
              style={{ width: 200 }}
              value={query.cinemaSpecId}
              onChange={(val) => {
                setQuery({
                  ...query,
                  cinemaSpecId: val
                })
              }}
            >
              {specList.map((item: any) => {
                return (
                  <Select.Option value={item.id} key={item.id}>
                    {item.name}
                  </Select.Option>
                )
              })}
            </Select>
          </Space>
        </Form.Item>
        <Form.Item
          label={t('theaterHallModal.form.rowCount.label')}
          rules={[
            {
              required: true,
              message: t('theaterHallModal.form.rowCount.required')
            }
          ]}
          name="rowCount"
        >
          <InputNumber
            style={{ width: '100%' }}
            value={query.rowCount}
            precision={0}
            disabled={!!query?.id}
            onChange={(val) => {
              setQuery({
                ...query,
                rowCount: val as number
              })
            }}
          />
        </Form.Item>
        <Form.Item
          label={t('theaterHallModal.form.columnCount.label')}
          rules={[
            {
              required: true,
              message: t('theaterHallModal.form.columnCount.required')
            }
          ]}
          name="columnCount"
        >
          <InputNumber
            style={{ width: '100%' }}
            value={query.columnCount}
            precision={0}
            disabled={!!query?.id}
            onChange={(val) => {
              setQuery({
                ...query,
                columnCount: val as number
              })
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
