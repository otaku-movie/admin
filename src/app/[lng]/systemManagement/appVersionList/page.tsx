'use client'
import React, { useEffect, useState } from 'react'
import { Table, Button, Space, Row, message, Modal, Tag, Tabs } from 'antd'
import type { TableColumnsType } from 'antd'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../layout'
import http from '@/api'
import { showTotal } from '@/utils/pagination'

interface Query {
  platform: string
}

interface AppVersionRow {
  id: number
  platform: 'IOS' | 'Android'
  versionName: string
  buildNumber: number
  isForceUpdate?: boolean
  minSupportedVersion?: string
  isLatest?: boolean
  releasePercent?: number
  createTime?: string
}

export default function Page ({ params: { lng } }: Readonly<PageProps>) {
  const router = useRouter()
  const [data, setData] = useState<AppVersionRow[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState<Partial<Query>>({})
  const { t } = useTranslation(lng, 'appVersionList')
  const { t: common } = useTranslation(lng, 'common')
  const [activePlatformTab, setActivePlatformTab] = useState<string>('ALL')

  const getData = (page = 1, queryOverride?: Partial<Query>) => {
    const requestQuery = { ...(queryOverride ?? query) }
    if (!requestQuery.platform) delete requestQuery.platform
    http({
      url: 'admin/app/versionList',
      method: 'post',
      data: {
        page,
        pageSize: 10,
        ...requestQuery
      }
    }).then(res => {
      setData(res.data.list)
      setPage(page)
      setTotal(res.data.total)
    })
  }

  useEffect(() => {
    getData()
  }, [])

  const columns: TableColumnsType<AppVersionRow> = [
    {
      title: t('table.platform'),
      dataIndex: 'platform',
      render: v => <Tag>{v}</Tag>
    },
    {
      title: t('table.version'),
      dataIndex: 'versionName',
      sorter: (a, b) => (a.buildNumber || 0) - (b.buildNumber || 0),
      defaultSortOrder: 'descend'
    },
    {
      title: t('table.buildNumber'),
      dataIndex: 'buildNumber'
    },
    {
      title: t('table.forceUpdate'),
      dataIndex: 'isForceUpdate',
      render: v =>
        v ? <Tag color='red'>{t('value.yes')}</Tag> : <Tag>{t('value.no')}</Tag>
    },
    {
      title: t('table.minSupportedVersion'),
      dataIndex: 'minSupportedVersion',
      render: v => v || '-'
    },
    {
      title: t('table.isLatest'),
      dataIndex: 'isLatest',
      render: v => (v ? <Tag color='blue'>{t('value.latest')}</Tag> : '-')
    },
    {
      title: t('table.createTime'),
      dataIndex: 'createTime'
    },
    {
      title: t('table.action'),
      key: 'operation',
      fixed: 'right',
      width: 320,
      render: (_, row: AppVersionRow) => {
        return (
          <Space>
            <Button
              onClick={() => {
                router.push(`/${lng}/appVersionList/versionDetail?id=${row.id}`)
              }}
            >
              {common('button.edit')}
            </Button>
            {!row.isLatest && (
              <Button
                type='primary'
                onClick={() => {
                  http({
                    url: 'admin/app/version/setLatest',
                    method: 'post',
                    data: { id: row.id }
                  }).then(() => {
                    message.success(t('message.setLatestSuccess'))
                    getData(page)
                  })
                }}
              >
                {t('button.setLatest')}
              </Button>
            )}
            <Button
              danger
              onClick={() => {
                Modal.confirm({
                  title: common('button.remove'),
                  content: t('message.remove.content'),
                  onOk () {
                    return http({
                      url: 'admin/app/version/remove',
                      method: 'delete',
                      params: { id: row.id }
                    }).then(() => {
                      message.success(t('message.remove.success'))
                      getData(page)
                    })
                  }
                })
              }}
            >
              {common('button.remove')}
            </Button>
          </Space>
        )
      }
    }
  ]

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      <Row justify='end'>
        <Button
          onClick={() => {
            router.push(`/${lng}/appVersionList/versionDetail`)
          }}
        >
          {common('button.add')}
        </Button>
      </Row>
      <div style={{ background: '#fff', borderRadius: 8, padding: 16 }}>
        <Row justify='space-between' align='middle'>
          <Space size={12} align='center'>
            <Tabs
              activeKey={activePlatformTab}
              onChange={key => {
                setActivePlatformTab(key)
                const nextPlatform = key === 'ALL' ? '' : key
                const nextQuery = {
                  ...query,
                  platform: nextPlatform
                }
                setQuery(nextQuery)
                getData(1, nextQuery)
              }}
              items={[
                { key: 'ALL', label: t('tab.all') },
                { key: 'Android', label: t('tab.android') },
                { key: 'IOS', label: t('tab.ios') }
              ]}
              style={{ marginBottom: 0 }}
            />
          </Space>
        </Row>
        <Table
          style={{ marginTop: 12 }}
          columns={columns}
          dataSource={data}
          rowKey='id'
          bordered={true}
          pagination={{
            pageSize: 10,
            current: page,
            total,
            showTotal,
            onChange (page) {
              getData(page)
            },
            position: ['bottomCenter']
          }}
        />
      </div>
    </section>
  )
}
