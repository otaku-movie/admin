'use client'
import React, { useEffect, useState } from 'react'
import { Button, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd'
import type { TableColumnsType } from 'antd'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../layout'
import http from '@/api'
import { processPath } from '@/config/router'
import { showTotal } from '@/utils/pagination'

interface AgreementRow {
  id: number
  code: string
  language: string
  title: string
  version: string
  status: 'DRAFT' | 'PUBLISHED' | 'OFFLINE'
  isRequiredAccept?: boolean
  publishedAt?: string
  updateTime?: string
}

interface Query {
  code?: string
  language?: string
  status?: string
}

export default function AgreementListPage ({ params: { lng } }: Readonly<PageProps>) {
  const router = useRouter()
  const { t } = useTranslation(lng, 'agreement')
  const { t: common } = useTranslation(lng, 'common')
  const [form] = Form.useForm<Query>()
  const [data, setData] = useState<AgreementRow[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState<Query>({})

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

  const getData = (nextPage = 1, nextQuery = query) => {
    http<AgreementRow[]>({
      url: 'admin/agreement/list',
      method: 'post',
      data: {
        page: nextPage,
        pageSize: 10,
        ...nextQuery
      }
    }).then(res => {
      setData(res.data.list)
      setPage(nextPage)
      setTotal(res.data.total)
    })
  }

  useEffect(() => {
    getData()
  }, [])

  const renderLanguage = (v: string) => {
    const key = `language.${v}`
    const text = t(key)
    return <Tag>{text === key ? v : text}</Tag>
  }

  const renderStatus = (v: AgreementRow['status']) => {
    const color = v === 'PUBLISHED' ? 'green' : v === 'DRAFT' ? 'orange' : 'default'
    const key = `status.${v}`
    const text = t(key)
    return <Tag color={color}>{text === key ? v : text}</Tag>
  }

  const columns: TableColumnsType<AgreementRow> = [
    { title: t('table.code'), dataIndex: 'code' },
    { title: t('table.language'), dataIndex: 'language', render: renderLanguage },
    { title: t('table.title'), dataIndex: 'title' },
    { title: t('table.version'), dataIndex: 'version' },
    {
      title: t('table.status'),
      dataIndex: 'status',
      render: renderStatus
    },
    {
      title: t('table.isRequiredAccept'),
      dataIndex: 'isRequiredAccept',
      render: v => v ? <Tag color="red">{t('yesNo.yes')}</Tag> : <Tag>{t('yesNo.no')}</Tag>
    },
    { title: t('table.publishedAt'), dataIndex: 'publishedAt', render: v => v || '-' },
    {
      title: common('table.action'),
      key: 'action',
      width: 260,
      render: (_, row) => (
        <Space>
          <Button onClick={() => router.push(processPath({ name: 'agreementDetail', query: { id: row.id } }))}>
            {common('button.edit')}
          </Button>
          {row.status !== 'PUBLISHED' && (
            <Button
              type="primary"
              onClick={() => {
                http({ url: 'admin/agreement/publish', method: 'post', data: { id: row.id } }).then(() => {
                  message.success(t('message.publishSuccess'))
                  getData(page)
                })
              }}
            >
              {t('button.publish')}
            </Button>
          )}
          <Button
            danger
            onClick={() => {
              Modal.confirm({
                title: t('message.removeConfirm'),
                onOk: () => http({ url: 'admin/agreement/remove', method: 'delete', params: { id: row.id } }).then(() => getData(page))
              })
            }}
          >
            {common('button.remove')}
          </Button>
        </Space>
      )
    }
  ]

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Form form={form} layout="inline" onFinish={(values) => { setQuery(values); getData(1, values) }}>
          <Form.Item name="code" label={t('form.code.label')}>
            <Input placeholder={t('form.code.placeholder')} allowClear />
          </Form.Item>
          <Form.Item name="language" label={t('form.language.label')}>
            <Select allowClear style={{ width: 120 }} options={languageOptions} />
          </Form.Item>
          <Form.Item name="status" label={t('form.status.label')}>
            <Select allowClear style={{ width: 140 }} options={statusOptions} />
          </Form.Item>
          <Button htmlType="submit" type="primary">{t('button.query')}</Button>
        </Form>
        <Button type="primary" onClick={() => router.push(processPath('agreementDetail'))}>
          {t('button.addAgreement')}
        </Button>
      </header>
      <Table
        rowKey="id"
        dataSource={data}
        columns={columns}
        pagination={{
          total,
          current: page,
          showTotal,
          onChange: p => getData(p)
        }}
      />
    </section>
  )
}
