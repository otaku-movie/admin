'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Button, Col, Form, Input, InputNumber, Row, Select, Space, Switch, Tabs, Typography, message } from 'antd'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageProps } from '../../layout'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'
import http from '@/api'
import { Editor } from '@bytemd/react'
import gfm from '@bytemd/plugin-gfm'
import 'bytemd/dist/index.css'
import zhHans from 'bytemd/locales/zh_Hans.json'
import ja from 'bytemd/locales/ja.json'
import en from 'bytemd/locales/en.json'

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

  useEffect(() => {
    if (!isEdit || editingId == null) {
      form.setFieldsValue(query)
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
        router.push(`/${lng}/appVersionList`)
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
          <Button onClick={() => router.push(`/${lng}/appVersionList`)}>{common('button.cancel')}</Button>
          <Button type="primary" onClick={onSave}>{common('button.save')}</Button>
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
            items={[
              {
                key: 'zh',
                label: 'ZH',
                children: (
                  <Editor
                    value={query.releaseNoteZh || ''}
                    plugins={plugins}
                    mode="split"
                    locale={editorLocale}
                    onChange={(v) => setQuery({ ...query, releaseNoteZh: v })}
                  />
                )
              },
              {
                key: 'ja',
                label: 'JA',
                children: (
                  <Editor
                    value={query.releaseNoteJa || ''}
                    plugins={plugins}
                    mode="split"
                    locale={editorLocale}
                    onChange={(v) => setQuery({ ...query, releaseNoteJa: v })}
                  />
                )
              },
              {
                key: 'en',
                label: 'EN',
                children: (
                  <Editor
                    value={query.releaseNoteEn || ''}
                    plugins={plugins}
                    mode="split"
                    locale={editorLocale}
                    onChange={(v) => setQuery({ ...query, releaseNoteEn: v })}
                  />
                )
              },
              {
                key: 'internal',
                label: t('form.internalNote'),
                children: (
                  <Editor
                    value={query.releaseNoteInternal || ''}
                    plugins={plugins}
                    mode="split"
                    locale={editorLocale}
                    onChange={(v) => setQuery({ ...query, releaseNoteInternal: v })}
                  />
                )
              }
            ]}
          />
        </Form.Item>
      </Form>
      <style jsx global>{`
        /* 隐藏 ByteMD 内置「代码块」按钮（左侧第 7 个） */
        .main-container .bytemd-toolbar-left .bytemd-toolbar-icon:nth-child(7) {
          display: none !important;
        }
        /* 隐藏 ByteMD 右侧 Github 按钮（最右） */
        .main-container .bytemd-toolbar-right .bytemd-toolbar-icon:last-child {
          display: none !important;
        }
        /* Markdown 预览表格样式（避免被全局样式重置） */
        .main-container .bytemd-preview table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
          font-size: 13px;
          line-height: 1.6;
        }
        .main-container .bytemd-preview th,
        .main-container .bytemd-preview td {
          border: 1px solid #d9d9d9;
          padding: 6px 10px;
          text-align: left;
          vertical-align: top;
        }
        .main-container .bytemd-preview thead th {
          background: #fafafa;
          font-weight: 600;
        }
        .main-container .bytemd-preview tbody tr:nth-child(2n) {
          background: #fcfcfc;
        }
      `}</style>
    </section>
  )
}

