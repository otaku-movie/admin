'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import { Form, Modal, Input, InputNumber } from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import { useSearchParams } from 'next/navigation'

interface modalProps {
  type: 'create' | 'edit'
  show?: boolean
  data: Record<string, any>
  onConfirm?: () => void
  onCancel?: () => void
}

interface Query {
  name?: string
  price?: number
  cinemaId?: number
}

export function TicketTypeModal(props: modalProps) {
  const { t } = useTranslation(navigator.language as languageType, 'ticketType')

  const [form] = Form.useForm()
  const [query, setQuery] = useState<Query>({})
  const searchParams = useSearchParams()

  useEffect(() => {
    if (props.show) {
      form.resetFields()
    }
    form.setFieldsValue(props.data)
    setQuery(props.data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.show, props.data])

  return (
    <Modal
      title={
        props.type === 'edit' ? t('modal.title.edit') : t('modal.title.create')
      }
      open={props.show}
      maskClosable={false}
      onOk={() => {
        form.validateFields().then(() => {
          http({
            url: 'admin/movie/ticketType/save',
            method: 'post',
            data: {
              ...query,
              cinemaId: searchParams.get('id')
            }
          }).then(() => {
            props?.onConfirm?.()
          })
        })
      }}
      onCancel={props?.onCancel}
    >
      <Form
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        form={form}
      >
        <Form.Item
          label={t('modal.form.name.label')}
          rules={[{ required: true, message: t('modal.form.name.required') }]}
          name="name"
        >
          <Input
            value={query.name}
            onChange={(e) => {
              setQuery({
                ...query,
                name: e.currentTarget.value
              })
            }}
          />
        </Form.Item>
        <Form.Item
          label={t('modal.form.price.label')}
          rules={[{ required: true, message: t('modal.form.price.required') }]}
          name="price"
        >
          <InputNumber
            style={{ width: '100%' }}
            value={query.price}
            precision={0}
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
  )
}
