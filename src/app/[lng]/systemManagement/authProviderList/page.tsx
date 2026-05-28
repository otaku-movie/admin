'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Button, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, Tag, message } from 'antd'
import type { TableColumnsType } from 'antd'
import Icon, {
  AndroidFilled,
  AppleFilled,
  CheckCircleFilled,
  GlobalOutlined,
  MailOutlined,
  StopOutlined
} from '@ant-design/icons'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../../layout'
import http from '@/api'
import './style.scss'

const XIconSvg = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const GoogleColorIconSvg = () => (
  <svg viewBox="0 0 48 48" width="1em" height="1em">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
)

interface AuthProviderRow {
  id: number
  code: 'EMAIL' | 'GOOGLE' | 'APPLE' | 'X'
  name: string
  enabled: boolean
  platform: 'ALL' | 'Android' | 'IOS'
  sort: number
  minAppVersion?: string
  remark?: string
  updateTime?: string
}

interface EditingForm {
  name: string
  enabled: boolean
  platform: 'ALL' | 'Android' | 'IOS'
  sort: number
  minAppVersion?: string
  remark?: string
}

const renderProviderIcon = (code: AuthProviderRow['code']) => {
  const style = { fontSize: 16 }
  switch (code) {
    case 'EMAIL':  return <MailOutlined style={{ ...style, color: '#1989FA' }} />
    case 'GOOGLE': return <Icon component={GoogleColorIconSvg} style={style} />
    case 'APPLE':  return <AppleFilled style={{ ...style, color: '#1A1A1A' }} />
    case 'X':      return <Icon component={XIconSvg} style={{ ...style, color: '#1A1A1A' }} />
    default:       return null
  }
}

const renderPlatformIcon = (platform: AuthProviderRow['platform']) => {
  switch (platform) {
    case 'Android': return <AndroidFilled style={{ color: '#3DDC84' }} />
    case 'IOS':     return <AppleFilled style={{ color: '#1A1A1A' }} />
    case 'ALL':
    default:        return <GlobalOutlined style={{ color: '#1989FA' }} />
  }
}

const getEditingInitialValues = (row: AuthProviderRow): EditingForm => ({
  name: row.name,
  enabled: row.enabled,
  platform: row.platform,
  sort: row.sort,
  minAppVersion: row.minAppVersion,
  remark: row.remark
})

export default function AuthProviderListPage ({ params: { lng } }: Readonly<PageProps>) {
  const { t } = useTranslation(lng, 'authProvider')
  const { t: common } = useTranslation(lng, 'common')
  const [form] = Form.useForm<EditingForm>()
  const [data, setData] = useState<AuthProviderRow[]>([])
  const [editing, setEditing] = useState<AuthProviderRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const fetchedRef = useRef(false)

  const getData = () => {
    setLoading(true)
    http<AuthProviderRow[]>({
      url: 'admin/auth/provider/list',
      method: 'post'
    }).then(res => {
      setData(res.data || [])
    }).finally(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    getData()
  }, [])

  const saveRow = async (row: AuthProviderRow, values: EditingForm) => {
    setSaving(true)
    try {
      await http({
        url: 'admin/auth/provider/save',
        method: 'post',
        data: {
          id: row.id,
          code: row.code,
          ...values
        }
      })
      message.success(common('message.save'))
      setEditing(null)
      getData()
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (row: AuthProviderRow) => {
    setEditing(row)
  }

  const handleOk = async () => {
    if (!editing) return
    const values = await form.validateFields()
    await saveRow(editing, values)
  }

  const handleCancel = () => {
    if (saving) return
    setEditing(null)
    form.resetFields()
  }

  const columns: TableColumnsType<AuthProviderRow> = [
    {
      title: t('table.code'),
      dataIndex: 'code',
      width: 140,
      render: (code: AuthProviderRow['code']) => (
        <Space size={8}>
          {renderProviderIcon(code)}
          <Tag color={code === 'EMAIL' ? 'default' : 'blue'} style={{ margin: 0 }}>{code}</Tag>
        </Space>
      )
    },
    {
      title: t('table.name'),
      dataIndex: 'name'
    },
    {
      title: t('table.enabled'),
      dataIndex: 'enabled',
      width: 120,
      render: (enabled: boolean) => enabled
        ? (
          <Space size={6} className="status-enabled">
            <CheckCircleFilled />
            <span>{t('value.enabled')}</span>
          </Space>
        )
        : (
          <Space size={6} className="status-disabled">
            <StopOutlined />
            <span>{t('value.disabled')}</span>
          </Space>
        )
    },
    {
      title: t('table.platform'),
      dataIndex: 'platform',
      width: 130,
      render: (platform: AuthProviderRow['platform']) => (
        <Space size={6}>
          {renderPlatformIcon(platform)}
          <span>{t(`platform.${platform}`)}</span>
        </Space>
      )
    },
    {
      title: t('table.sort'),
      dataIndex: 'sort',
      width: 100
    },
    {
      title: t('table.minAppVersion'),
      dataIndex: 'minAppVersion',
      width: 150,
      render: v => v || '-'
    },
    {
      title: t('table.remark'),
      dataIndex: 'remark',
      render: v => v || '-'
    },
    {
      title: t('table.updateTime'),
      dataIndex: 'updateTime',
      width: 180,
      render: v => v || '-'
    },
    {
      title: common('table.action'),
      key: 'action',
      width: 120,
      render: (_, row) => (
        <Button onClick={() => startEdit(row)}>{common('button.edit')}</Button>
      )
    }
  ]

  return (
    <section className="auth-provider-list-page">
      <header>
        <h2>{t('title')}</h2>
        <p>{t('description')}</p>
      </header>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
        pagination={false}
      />

      <Modal
        open={Boolean(editing)}
        title={editing
          ? (
            <Space size={8}>
              {renderProviderIcon(editing.code)}
              <span>{editing.code} - {editing.name}</span>
            </Space>
          )
          : ''}
        okText={common('button.save')}
        cancelText={common('button.cancel')}
        confirmLoading={saving}
        maskClosable={!saving}
        destroyOnClose
        forceRender
        afterOpenChange={open => {
          if (open && editing) {
            form.setFieldsValue(getEditingInitialValues(editing))
          }
          if (!open) {
            form.resetFields()
          }
        }}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          initialValues={editing ? getEditingInitialValues(editing) : undefined}
        >
          <Form.Item
            name="name"
            label={t('form.name')}
            rules={[{ required: true, message: t('message.nameRequired') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="enabled" label={t('form.enabled')} valuePropName="checked">
            <Switch checkedChildren={t('value.enabled')} unCheckedChildren={t('value.disabled')} />
          </Form.Item>
          <Form.Item name="platform" label={t('form.platform')} rules={[{ required: true }]}>
            <Select
              options={[
                { label: <Space size={6}>{renderPlatformIcon('ALL')}{t('platform.ALL')}</Space>, value: 'ALL' },
                { label: <Space size={6}>{renderPlatformIcon('Android')}{t('platform.Android')}</Space>, value: 'Android' },
                { label: <Space size={6}>{renderPlatformIcon('IOS')}{t('platform.IOS')}</Space>, value: 'IOS' }
              ]}
            />
          </Form.Item>
          <Form.Item name="sort" label={t('form.sort')} rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="minAppVersion" label={t('form.minAppVersion')}>
            <Input placeholder="1.0.0" allowClear />
          </Form.Item>
          <Form.Item name="remark" label={t('form.remark')}>
            <Input.TextArea rows={3} allowClear />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  )
}
