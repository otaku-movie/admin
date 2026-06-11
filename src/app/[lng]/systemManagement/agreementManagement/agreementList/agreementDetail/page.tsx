'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Button, Col, Form, Input, Row, Select, Space, Switch, Typography, message } from 'antd'
import { useRouter, useSearchParams } from 'next/navigation'
import { Editor } from '@bytemd/react'
import gfm from '@bytemd/plugin-gfm'
import 'bytemd/dist/index.css'
import 'github-markdown-css/github-markdown-light.css'
import http from '@/api'
import { useTranslation } from '@/app/i18n/client'
import { processPath } from '@/config/router'
import { PageProps } from '@/app/[lng]/layout'
import { CheckPermission } from '@/components/checkPermission'
import './style.scss'

const { Title } = Typography
const plugins = [gfm()]

interface AgreementForm {
  id?: number
  code?: string
  language?: string
  title?: string
  content?: string
  version?: string
  status?: string
  isRequiredAccept?: boolean
}

export default function AgreementDetailPage ({ params: { lng } }: Readonly<PageProps>) {
  const router = useRouter()
  const { t } = useTranslation(lng, 'agreement')
  const { t: common } = useTranslation(lng, 'common')
  const searchParams = useSearchParams()
  const [form] = Form.useForm<AgreementForm>()
  const [query, setQuery] = useState<AgreementForm>({
    code: 'USER_TERMS',
    language: 'ja',
    version: '1.0.0',
    status: 'DRAFT',
    isRequiredAccept: true,
    content: ''
  })
  const [editorReady, setEditorReady] = useState(false)
  const [contentError, setContentError] = useState<string>('')

  const editingId = useMemo(() => {
    const id = searchParams.get('id')
    if (!id) return undefined
    const num = Number(id)
    return Number.isNaN(num) ? undefined : num
  }, [searchParams])

  useEffect(() => {
    if (!editingId) {
      form.setFieldsValue(query)
      setEditorReady(true)
      return
    }
    setEditorReady(false)
    http<AgreementForm>({ url: 'admin/agreement/detail', method: 'get', params: { id: editingId } }).then(res => {
      const next = res.data || {}
      setQuery(next)
      form.setFieldsValue(next)
      setEditorReady(true)
    })
  }, [editingId, form])

  const codeOptions = [
    { label: t('code.USER_TERMS'), value: 'USER_TERMS' },
    { label: t('code.PRIVACY_POLICY'), value: 'PRIVACY_POLICY' },
    { label: t('code.THIRD_PARTY_SDK'), value: 'THIRD_PARTY_SDK' }
  ]

  const languageOptions = [
    { label: t('language.zh'), value: 'zh' },
    { label: t('language.ja'), value: 'ja' },
    { label: t('language.en'), value: 'en' }
  ]

  const statusOptions = [
    { label: t('status.DRAFT'), value: 'DRAFT' },
    { label: t('status.PUBLISHED'), value: 'PUBLISHED' },
    { label: t('status.OFFLINE'), value: 'OFFLINE' }
  ]

  const onSave = () => {
    form.validateFields().then(() => {
      if (!query.content?.trim()) {
        setContentError(t('form.content.required'))
        return
      }
      setContentError('')
      http({
        url: 'admin/agreement/save',
        method: 'post',
        data: query
      }).then(() => {
        message.success(t('message.saveSuccess'))
        router.push(processPath('agreementList'))
      })
    })
  }

  return (
    <section className="agreement-detail">
      <header className="agreement-detail__header">
        <Title level={3}>{editingId ? t('title.edit') : t('title.create')}</Title>
        <Space>
          <Button onClick={() => router.push(processPath('agreementList'))}>{common('button.cancel')}</Button>
          <CheckPermission code='agreement.save'>
            <Button type="primary" onClick={onSave}>{common('button.save')}</Button>
          </CheckPermission>
        </Space>
      </header>

      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={t('form.code.label')}
              name="code"
              rules={[{ required: true, message: t('form.code.required') }]}
            >
              <Select
                onChange={v => setQuery({ ...query, code: v })}
                options={codeOptions}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={t('form.language.label')}
              name="language"
              rules={[{ required: true, message: t('form.language.required') }]}
            >
              <Select
                onChange={v => setQuery({ ...query, language: v })}
                options={languageOptions}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={t('form.version.label')}
              name="version"
              rules={[{ required: true, message: t('form.version.required') }]}
            >
              <Input onChange={e => setQuery({ ...query, version: e.target.value })} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('form.title.label')}
              name="title"
              rules={[{ required: true, message: t('form.title.required') }]}
            >
              <Input onChange={e => setQuery({ ...query, title: e.target.value })} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label={t('form.status.label')} name="status">
              <Select
                onChange={v => setQuery({ ...query, status: v })}
                options={statusOptions}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label={t('form.isRequiredAccept.label')} name="isRequiredAccept" valuePropName="checked">
              <Switch onChange={v => setQuery({ ...query, isRequiredAccept: v })} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={t('form.content.label')}
          required
          validateStatus={contentError ? 'error' : ''}
          help={contentError || undefined}
          className="agreement-detail__editor"
        >
          {editorReady ? (
            <Editor
              key={editingId ?? 'new'}
              value={query.content || ''}
              plugins={plugins}
              onChange={v => {
                setQuery(prev => ({ ...prev, content: v }))
                if (contentError && v.trim()) setContentError('')
              }}
            />
          ) : null}
        </Form.Item>
      </Form>
    </section>
  )
}
