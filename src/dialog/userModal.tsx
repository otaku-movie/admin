'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import { Form, Modal, Input } from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import { user } from '@/type/api'
import { emailRegExp, passwordRegExp, usernameRegExp } from '@/utils'
import { Upload } from '@/components/upload/Upload'


interface UserModalProps {
  type: 'create' | 'edit'
  show?: boolean
  data: Partial<user>
  onConfirm?: () => void
  onCancel?: () => void
}

interface Query {
  id?: number
  cover?: string
  name?: string
  password?: string
  password2?: string
  email?: string
}

export default function UserModal(props: UserModalProps) {
  const { t } = useTranslation(navigator.language as languageType, 'user')
  const [form] = Form.useForm()
  const [query, setQuery] = useState<Query>({})

  useEffect(() => {
    if (props.show) {
      form.resetFields()
    }
    if (props.data?.id) {
      form.setFieldsValue(props.data)
      setQuery(props.data)
      console.log(props.data, query)
    }
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
            url: 'admin/user/save',
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
          name="cover"
        >
          <Upload
            value={query.cover || ''}
            crop={true}
            options={{
              aspectRatio: 100 / 100
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
          label={t('modal.form.username.label')}
          name="name"
          rules={[
            { required: true, message: t('modal.form.username.required') },
            {
              pattern: usernameRegExp,
              validateTrigger: ['onChange', 'onBlur'],
              message: t('modal.form.username.error')
            }
          ]}
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
          label={t('modal.form.email.label')}
          name="email"
          rules={[
            {
              required: true,
              message: t('modal.form.email.required')
            },
            {
              pattern: emailRegExp,
              validateTrigger: ['onChange', 'onBlur'],
              message: t('modal.form.email.error')
            }
          ]}
        >
          <Input
            value={query.email}
            onChange={(e) => {
              setQuery({
                ...query,
                email: e.currentTarget.value
              })
            }}
          />
        </Form.Item>

        <Form.Item
          label={t('modal.form.password.label')}
          name="password"
          rules={[
            { required: true, message: t('modal.form.password.required') },
            {
              pattern: passwordRegExp,
              validateTrigger: ['onChange', 'onBlur'],
              message: t('modal.form.password.error')
            }
          ]}
        >
          <Input.Password
            value={query.password}
            onChange={(e) => {
              setQuery({
                ...query,
                password: e.currentTarget.value
              })
            }}
          />
        </Form.Item>
        <Form.Item
          label={t('modal.form.password2.label')}
          name="password2"
          rules={[
            { required: true, message: t('modal.form.password2.required') },
            {
              pattern: passwordRegExp,
              validateTrigger: ['onChange', 'onBlur'],
              message: t('modal.form.password.error')
            },
            {
              validator() {
                if (query.password !== query.password2) {
                  return Promise.reject(
                    new Error(t('modal.form.password2.repeat'))
                  )
                }
                return Promise.resolve()
              }
            }
          ]}
        >
          <Input.Password
            value={query.password2}
            onChange={(e) => {
              setQuery({
                ...query,
                password2: e.currentTarget.value
              })
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
