'use client'
import React, { useEffect, useState } from 'react'
import { Button, Empty, Form, Input, InputNumber, Modal, Select, Space, Switch, Tabs } from 'antd'
import { marked } from 'marked'
import http from '@/api'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'

interface Props {
  type: 'create' | 'edit'
  show?: boolean
  data: Record<string, any>
  onConfirm?: () => void
  onCancel?: () => void
}

type Query = {
  id?: number
  platform?: 'IOS' | 'Android'
  versionName?: string
  buildNumber?: number
  versionCode?: number
  downloadUrl?: string
  isForceUpdate?: boolean
  minSupportedVersion?: string
  isLatest?: boolean
  releasePercent?: number
  releaseNoteZh?: string
  releaseNoteJa?: string
  releaseNoteEn?: string
  releaseNoteInternal?: string
}

export function AppVersionModal(props: Props) {
  const { t } = useTranslation(navigator.language as languageType, 'appVersionList')
  const { t: common } = useTranslation(navigator.language as languageType, 'common')
  const [form] = Form.useForm()
  const [query, setQuery] = useState<Query>({})

  useEffect(() => {
    if (!props.show) return
    const d = props.data || {}
    const next: Query = {
      id: d.id,
      platform: d.platform ?? 'Android',
      versionName: d.versionName ?? '',
      buildNumber: d.buildNumber ?? d.versionCode ?? 0,
      versionCode: d.versionCode ?? d.buildNumber ?? 0,
      downloadUrl: d.downloadUrl ?? '',
      isForceUpdate: !!(d.isForceUpdate ?? d.forceUpdate),
      minSupportedVersion: d.minSupportedVersion ?? '',
      isLatest: !!d.isLatest,
      releasePercent: d.releasePercent ?? 100,
      releaseNoteZh: d.releaseNoteZh ?? d.updateMessage ?? '',
      releaseNoteJa: d.releaseNoteJa ?? '',
      releaseNoteEn: d.releaseNoteEn ?? '',
      releaseNoteInternal: d.releaseNoteInternal ?? ''
    }
    setQuery(next)
    form.setFieldsValue(next)
  }, [props.show, props.data, form])

  const onSave = () => {
    form.validateFields().then(() => {
      http({
        url: 'admin/app/version/save',
        method: 'post',
        data: query
      }).then(() => {
        props.onConfirm?.()
      })
    })
  }

  const insertMarkdown = (
    editorId: string,
    currentValue: string | undefined,
    syntax: { prefix?: string; suffix?: string; placeholder?: string; block?: string }
  ) => {
    const textarea = document.getElementById(editorId) as HTMLTextAreaElement | null
    const value = currentValue ?? ''
    if (!textarea) {
      const plain = syntax.block ?? `${syntax.prefix ?? ''}${syntax.placeholder ?? ''}${syntax.suffix ?? ''}`
      return `${value}${value ? '\n' : ''}${plain}`
    }
    const start = textarea.selectionStart ?? value.length
    const end = textarea.selectionEnd ?? value.length
    const selected = value.slice(start, end) || syntax.placeholder || ''
    const insert = syntax.block ?? `${syntax.prefix ?? ''}${selected}${syntax.suffix ?? ''}`
    return value.slice(0, start) + insert + value.slice(end)
  }

  const renderToolbar = (
    editorId: string,
    value: string | undefined,
    onChange: (value: string) => void
  ) => (
    <Space wrap size={[6, 6]} style={{ marginBottom: 8 }}>
      <Button size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => onChange(insertMarkdown(editorId, value, { prefix: '# ', placeholder: 'Heading' }))}>H1</Button>
      <Button size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => onChange(insertMarkdown(editorId, value, { prefix: '**', suffix: '**', placeholder: 'bold' }))}>B</Button>
      <Button size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => onChange(insertMarkdown(editorId, value, { prefix: '*', suffix: '*', placeholder: 'italic' }))}>I</Button>
      <Button size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => onChange(insertMarkdown(editorId, value, { prefix: '[', suffix: '](https://)', placeholder: 'text' }))}>Link</Button>
      <Button size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => onChange(insertMarkdown(editorId, value, { prefix: '- ', placeholder: 'item' }))}>UL</Button>
      <Button size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => onChange(insertMarkdown(editorId, value, { prefix: '1. ', placeholder: 'item' }))}>OL</Button>
      <Button size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => onChange(insertMarkdown(editorId, value, { prefix: '> ', placeholder: 'quote' }))}>Quote</Button>
      <Button size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => onChange(insertMarkdown(editorId, value, { block: '```\ncode\n```' }))}>Code</Button>
      <Button size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => onChange(insertMarkdown(editorId, value, { block: '---' }))}>HR</Button>
    </Space>
  )

  const renderMarkdownEditor = (
    editorId: string,
    value: string | undefined,
    onChange: (value: string) => void
  ) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12
      }}
    >
      <div>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>{t('form.editorTab')}</div>
        {renderToolbar(editorId, value, onChange)}
        <Input.TextArea
          id={editorId}
          rows={10}
          placeholder={t('form.markdownPlaceholder')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <div>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>{t('form.previewTab')}</div>
        {value && value.trim() ? (
          <div
            style={{
              minHeight: 240,
              maxHeight: 320,
              overflow: 'auto',
              padding: 12,
              border: '1px solid #f0f0f0',
              borderRadius: 6,
              background: '#fff'
            }}
            dangerouslySetInnerHTML={{ __html: marked.parse(value) as string }}
          />
        ) : (
          <div
            style={{
              minHeight: 240,
              border: '1px solid #f0f0f0',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Empty description={t('form.previewEmpty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        )}
      </div>
    </div>
  )

  return (
    <Modal
      title={props.type === 'edit' ? t('modal.title.edit') : t('modal.title.create')}
      open={props.show}
      width={820}
      maskClosable={false}
      onOk={onSave}
      onCancel={props.onCancel}
      okText={common('button.ok')}
      cancelText={common('button.cancel')}
    >
      <Form
        form={form}
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
      >
        <Form.Item label={t('form.platform')} name="platform" rules={[{ required: true }]}>
          <Select
            onChange={(v) => setQuery({ ...query, platform: v })}
            options={[{ label: 'Android', value: 'Android' }, { label: 'IOS', value: 'IOS' }]}
          />
        </Form.Item>
        <Form.Item label={t('form.versionName')} name="versionName" rules={[{ required: true }]}>
          <Input onChange={(e) => setQuery({ ...query, versionName: e.target.value })} />
        </Form.Item>
        <Form.Item label={t('form.buildNumber')} name="buildNumber" rules={[{ required: true }]}>
          <InputNumber
            min={1}
            style={{ width: '100%' }}
            onChange={(v) => setQuery({ ...query, buildNumber: Number(v || 0), versionCode: Number(v || 0) })}
          />
        </Form.Item>
        <Form.Item label={t('form.minSupportedVersion')} name="minSupportedVersion">
          <Input onChange={(e) => setQuery({ ...query, minSupportedVersion: e.target.value })} />
        </Form.Item>
        <Form.Item label={t('form.downloadUrl')} name="downloadUrl" rules={[{ required: true }]}>
          <Input onChange={(e) => setQuery({ ...query, downloadUrl: e.target.value })} />
        </Form.Item>
        <Form.Item label={t('form.releasePercent')} name="releasePercent">
          <InputNumber
            min={0}
            max={100}
            style={{ width: '100%' }}
            onChange={(v) => setQuery({ ...query, releasePercent: Number(v || 0) })}
          />
        </Form.Item>
        <Form.Item label={t('form.isForceUpdate')} name="isForceUpdate" valuePropName="checked">
          <Switch onChange={(v) => setQuery({ ...query, isForceUpdate: v, forceUpdate: v } as any)} />
        </Form.Item>
        <Form.Item label={t('form.isLatest')} name="isLatest" valuePropName="checked">
          <Switch onChange={(v) => setQuery({ ...query, isLatest: v })} />
        </Form.Item>
        <Form.Item label={t('form.releaseNotes')}>
          <Tabs
            items={[
              {
                key: 'zh',
                label: 'ZH',
                children: renderMarkdownEditor('app-version-md-zh', query.releaseNoteZh, (val) => setQuery({ ...query, releaseNoteZh: val }))
              },
              {
                key: 'ja',
                label: 'JA',
                children: renderMarkdownEditor('app-version-md-ja', query.releaseNoteJa, (val) => setQuery({ ...query, releaseNoteJa: val }))
              },
              {
                key: 'en',
                label: 'EN',
                children: renderMarkdownEditor('app-version-md-en', query.releaseNoteEn, (val) => setQuery({ ...query, releaseNoteEn: val }))
              },
              {
                key: 'internal',
                label: t('form.internalNote'),
                children: renderMarkdownEditor('app-version-md-internal', query.releaseNoteInternal, (val) => setQuery({ ...query, releaseNoteInternal: val }))
              }
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

