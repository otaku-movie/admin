'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import { Form, Modal, Input } from 'antd'
import http from '@/api'
import { languageType } from '@/config'

interface modalProps {
  type: 'create' | 'edit'
  show?: boolean
  data: Record<string, any>
  onConfirm?: () => void
  onCancel?: () => void
}

interface Query {
  id?: number
  name?: string
}

export function BrandModal(props: modalProps) {
  const { t } = useTranslation(navigator.language as languageType, 'brandList')
  const [form] = Form.useForm()
  const [query, setQuery] = useState<Query>({})

  useEffect(() => {
    if (props.show) {
      form.resetFields()
    }
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
            url: 'admin/brand/save',
            method: 'post',
            data: {
              ...query
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
      </Form>
    </Modal>
  )
}
