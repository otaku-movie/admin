'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Button, Col, Form, Input, InputNumber, Row, Select, Space, Switch, Tabs, Typography, message } from 'antd'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageProps } from '@/app/[lng]/layout'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'
import http from '@/api'
import { processPath } from '@/config/router'
import { CheckPermission } from '@/components/checkPermission'
import { Editor } from '@bytemd/react'
import gfm from '@bytemd/plugin-gfm'
import 'bytemd/dist/index.css'
import zhHans from 'bytemd/locales/zh_Hans.json'
import ja from 'bytemd/locales/ja.json'
import en from 'bytemd/locales/en.json'
import './style.scss'

const plugins = [gfm()]
const { Title } = Typography

type Query = {
  id?: number
  platform?: 'IOS' | 'Android'
  versionName?: string
  buildNumber?: number
  versionCode?: number
  downloadUrl?: string
  isForceUpdate?: boolean
  forceUpdate?: boolean
  minSupportedVersion?: string
  isLatest?: boolean
  releasePercent?: number
  releaseNoteZh?: string
  releaseNoteJa?: string
  releaseNoteEn?: string
  releaseNoteInternal?: string
}

export default function AppVersionDetailPage({ params: { lng } }: PageProps) {
  const { t } = useTranslation(lng as languageType, 'appVersionList')
  const { t: common } = useTranslation(lng as languageType, 'common')
  const [form] = Form.useForm()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState<Query>({
    platform: 'Android',
    buildNumber: 1,
    versionCode: 1,
    releasePercent: 100
  })

  const editingId = useMemo(() => {
    const id = searchParams.get('id')
    if (!id) return undefined
    const num = Number(id)
    return Number.isNaN(num) ? undefined : num
  }, [searchParams])
  const isEdit = editingId != null
  const editorLocale = useMemo(() => {
    if (lng === 'zh-CN') return zhHans as any
    if (lng === 'ja') return ja as any
    return en as any
  }, [lng])

  const noteFields: { key: string; label: string; field: keyof Query }[] = [
    { key: 'zh', label: 'ZH', field: 'releaseNoteZh' },
    { key: 'ja', label: 'JA', field: 'releaseNoteJa' },
    { key: 'en', label: 'EN', field: 'releaseNoteEn' },
    { key: 'internal', label: t('form.internalNote'), field: 'releaseNoteInternal' }
  ]

  // 各语言发布日志的「已保存原始值」，用于判断本次是否有未保存改动（红点）
  const [originalNotes, setOriginalNotes] = useState<Record<string, string>>({})

  const snapshotNotes = (src: Partial<Query>): Record<string, string> =>
    noteFields.reduce((acc, { field }) => {
      acc[field as string] = (src[field] as string | undefined) || ''
      return acc
    }, {} as Record<string, string>)

  useEffect(() => {
    if (!isEdit || editingId == null) {
      form.setFieldsValue(query)
      // 新建：原始值都为空，填了内容即视为「未保存改动」
      setOriginalNotes(snapshotNotes({}))
      return
    }
    http({ url: 'admin/app/version/detail', method: 'get', params: { id: editingId } }).then((res) => {
      const d = res.data || {}
      const next: Query = {
        id: d.id,
        platform: d.platform ?? 'Android',
        versionName: d.versionName ?? '',
        buildNumber: d.buildNumber ?? d.versionCode ?? 1,
        versionCode: d.versionCode ?? d.buildNumber ?? 1,
        downloadUrl: d.downloadUrl ?? '',
        isForceUpdate: !!(d.isForceUpdate ?? d.forceUpdate),
        forceUpdate: !!(d.isForceUpdate ?? d.forceUpdate),
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
      setOriginalNotes(snapshotNotes(next))
    })
  }, [editingId, form, isEdit])

  const onSave = () => {
    form.validateFields().then(() => {
      http({
        url: 'admin/app/version/save',
        method: 'post',
        data: { ...query, forceUpdate: query.isForceUpdate }
      }).then(() => {
        message.success(common('message.save'))
        router.push(processPath('appVersionList'))
      })
    })
  }

  return (
    <section style={{ padding: '0 24px 100px', maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>
          {isEdit ? t('modal.title.edit') : t('modal.title.create')}
        </Title>
        <Space>
          <Button onClick={() => router.push(processPath('appVersionList'))}>{common('button.cancel')}</Button>
          <CheckPermission code='appVersion.save'>
            <Button type="primary" onClick={onSave}>{common('button.save')}</Button>
          </CheckPermission>
        </Space>
      </header>

      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('form.platform')} name="platform" rules={[{ required: true }]}>
              <Select
                onChange={(v) => setQuery({ ...query, platform: v })}
                options={[{ label: 'Android', value: 'Android' }, { label: 'IOS', value: 'IOS' }]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('form.versionName')} name="versionName" rules={[{ required: true }]}>
              <Input onChange={(e) => setQuery({ ...query, versionName: e.target.value })} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('form.buildNumber')} name="buildNumber" rules={[{ required: true }]}>
              <InputNumber
                min={1}
                style={{ width: '100%' }}
                onChange={(v) => setQuery({ ...query, buildNumber: Number(v || 0), versionCode: Number(v || 0) })}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('form.minSupportedVersion')} name="minSupportedVersion">
              <Input onChange={(e) => setQuery({ ...query, minSupportedVersion: e.target.value })} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('form.downloadUrl')} name="downloadUrl" rules={[{ required: true }]}>
              <Input onChange={(e) => setQuery({ ...query, downloadUrl: e.target.value })} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('form.releasePercent')} name="releasePercent">
              <InputNumber
                min={0}
                max={100}
                style={{ width: '100%' }}
                onChange={(v) => setQuery({ ...query, releasePercent: Number(v || 0) })}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('form.isForceUpdate')} name="isForceUpdate" valuePropName="checked">
              <Switch onChange={(v) => setQuery({ ...query, isForceUpdate: v, forceUpdate: v })} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('form.isLatest')} name="isLatest" valuePropName="checked">
              <Switch onChange={(v) => setQuery({ ...query, isLatest: v })} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label={t('form.releaseNotes')}>
          <Tabs
            type="card"
            className="release-notes-tabs"
            items={noteFields.map(({ key, label, field }) => {
              const val = (query[field] as string | undefined) || ''
              const original = originalNotes[field as string] ?? ''
              // 三态：未保存改动(红) > 有内容已保存(绿) > 空(灰)
              const dirty = val !== original
              const state = dirty ? 'dirty' : val.trim() ? 'filled' : 'empty'
              const stateTitle = dirty
                ? t('form.noteDirty')
                : val.trim()
                  ? t('form.noteFilled')
                  : t('form.noteEmpty')
              return {
                key,
                label: (
                  <span>
                    {label}
                    <span className={`note-dot ${state}`} title={stateTitle} />
                  </span>
                ),
                // 不能用 forceRender：bytemd 的 CodeMirror 在隐藏(display:none)状态下挂载会渲染成空白，
                // 切到该 Tab 时编辑区是空的。让编辑器在 Tab 变可见时再挂载，内容来自 query state 不会丢。
                children: (
                  <div className="release-notes-editor">
                    <Editor
                      value={val}
                      plugins={plugins}
                      mode="split"
                      locale={editorLocale}
                      onChange={(v) => setQuery({ ...query, [field]: v })}
                    />
                  </div>
                )
              }
            })}
          />
        </Form.Item>
      </Form>
    </section>
  )
}

