'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import { Form, Modal, Input, message } from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import { useSearchParams } from 'next/navigation'

interface Modal {
  type: 'create' | 'edit'
  show: boolean
  data: Record<string, unknown>
  onConfirm?: () => void
  onCancel?: () => void
}

interface Query {
  id?: number
  movieId?: number
  content?: string
}

export function ReplyModal(props: Modal) {
  const { t } = useTranslation(navigator.language as languageType, 'reply')
  const searchParams = useSearchParams()

  const [form] = Form.useForm()
  const [query, setQuery] = useState<Query>({})

  useEffect(() => {
    if (props.show) {
      form.resetFields()
    }

    if (props.data.id) {
      setQuery(props.data)
      form.setFieldsValue(props.data)
    } else {
      setQuery({})
      form.setFieldsValue({})
    }
  }, [props.show, props.data])

  return (
    <Modal
      title={
        props.type === 'edit' ? t('modal.title.edit') : t('modal.title.create')
      }
      width={700}
      open={props.show}
      maskClosable={false}
      onOk={() => {
        // debugger
        form.validateFields().then(() => {
          http({
            url: 'movie/reply/save',
            method: 'post',
            data: {
              ...query,
              movieId: searchParams.get('movieId'),
              movieCommentId: searchParams.get('id')
            }
          }).then((res) => {
            console.log(res)
            message.success(res.message)
            props.onConfirm?.()
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
        initialValues={{ remember: true }}
        autoComplete="off"
        form={form}
      >
        <Form.Item
          label={t('modal.form.comment.label')}
          rules={[
            { required: true, message: t('modal.form.comment.required') },
            { max: 1000, message: t('modal.form.comment.max') }
          ]}
          name="content"
        >
          <Input.TextArea
            value={query.content}
            rows={6}
            showCount
            maxLength={1000}
            onChange={(e) => {
              setQuery({
                ...query,
                content: e.currentTarget.value
              })
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
