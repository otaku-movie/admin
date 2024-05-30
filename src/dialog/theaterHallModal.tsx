'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import { Form, Modal, Input, Select, Space } from 'antd'
import { useSearchParams } from 'next/navigation'
import http from '@/api'
import { languageType } from '@/config'

interface Query {
  name: string
  spec: number | undefined
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
  const [data, setData] = useState<Query>({
    name: '',
    spec: undefined
  })
  const searchParams = useSearchParams()
  const [form] = Form.useForm()

  const onConfirm = () => {
    console.log(data)
    form.validateFields().then(() => {
      http({
        url: 'admin/theater/hall/save',
        method: 'post',
        data: {
          ...data,
          cinemaId: searchParams.get('id')
        }
      }).then(() => {
        props.onConfirm?.()
      })
    })
  }

  useEffect(() => {
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
            value={data.name}
            onChange={(e) => {
              // data.name = e.currentTarget.value
              setData({
                ...data,
                name: e.currentTarget.value
              })
            }}
          ></Input>
        </Form.Item>
        <Form.Item
          label={t('theaterHallModal.form.spec.label')}
          name="specId"
          rules={[
            {
              required: !true,
              message: t('theaterHallModal.form.spec.required')
            }
          ]}
        >
          <Space>
            <Select style={{ width: 200 }}>
              {/* {theaterHallData.map((item: any) => {
                return (
                  <Select.Option value={item.id} key={item.id}>
                    {item.name}
                  </Select.Option>
                )
              })} */}
            </Select>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}
