'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import { Form, Modal, Input } from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import { usePermissionStore } from '@/store/usePermissionStore'

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
  code?: string
}

export function DictModal(props: modalProps) {
  const { t } = useTranslation(navigator.language as languageType, 'dict')
  const { t: common } = useTranslation(
    navigator.language as languageType,
    'common'
  )
  const [form] = Form.useForm()
  const [query, setQuery] = useState<Query>({})

  const getData = () => {}
  useEffect(() => {
    if (props.show) {
      form.resetFields()
      getData()
    }
    form.setFieldsValue(props.data)
    setQuery(props.data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.show, props.data])

  return (
    <Modal
      title={
        props.type === 'edit'
          ? t('dictModal.title.edit')
          : t('dictModal.title.create')
      }
      open={props.show}
      maskClosable={false}
      onOk={() => {
        form.validateFields().then(() => {
          http({
            url: 'admin/dict/save',
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
          label={t('dictModal.form.name.label')}
          rules={[
            { required: true, message: t('dictModal.form.name.required') }
          ]}
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
          label={t('dictModal.form.code.label')}
          rules={[
            { required: true, message: t('dictModal.form.code.required') }
          ]}
          name="code"
        >
          <Input
            value={query.code}
            onChange={(e) => {
              setQuery({
                ...query,
                code: e.currentTarget.value
              })
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
