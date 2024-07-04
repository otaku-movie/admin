'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import { Form, Modal, Input } from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import { Upload } from '@/components/upload/Upload'

interface modalProps {
  type: 'create' | 'edit'
  show?: boolean
  data: Record<string, any>
  onConfirm?: () => void
  onCancel?: () => void
}

interface Query {
  id?: number
  cover?: string
  originalName?: string
  name?: string
  description?: string
}

export function StaffModal(props: modalProps) {
  const { t } = useTranslation(navigator.language as languageType, 'staff')
  const [form] = Form.useForm()
  const [query, setQuery] = useState<Query>({})

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
            url: 'admin/staff/save',
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
          label={t('modal.form.cover.label')}
          rules={[{ required: false, message: t('modal.form.cover.required') }]}
        >
          <Upload
            value={query.cover || ''}
            crop={true}
            cropperOptions={{
              aspectRatio: 160 / 190
            }}
            onChange={(val) => {
              setQuery({
                ...query,
                cover: val
              })
            }}
          />
        </Form.Item>
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
          label={t('modal.form.originalName.label')}
          rules={[
            { required: true, message: t('modal.form.originalName.required') }
          ]}
          name="originalName"
        >
          <Input
            value={query.originalName}
            onChange={(e) => {
              setQuery({
                ...query,
                originalName: e.currentTarget.value
              })
            }}
          />
        </Form.Item>
        <Form.Item
          label={t('modal.form.description.label')}
          rules={[
            { required: true, message: t('modal.form.description.required') }
          ]}
          name="description"
        >
          <Input.TextArea
            value={query.description}
            rows={5}
            onChange={(e) => {
              setQuery({
                ...query,
                description: e.currentTarget.value
              })
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
