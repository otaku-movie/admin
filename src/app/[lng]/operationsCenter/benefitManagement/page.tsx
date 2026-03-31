'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Button, Col, Input, Row, Space, Table, theme, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import http from '@/api/index'
import { useTranslation } from '@/app/i18n/client'
import { useRouter } from '@bprogress/next/app'
import { PageProps } from '@/app/[lng]/layout'
import { processPath } from '@/config/router'
import { CustomAntImage } from '@/components/CustomAntImage'

type MovieBenefitRow = {
  movieId: number
  movieName: string
  movieCover?: string
  benefitCount: number
}

export default function Page ({ params: { lng } }: Readonly<PageProps>) {
  const router = useRouter()
  const { t: common } = useTranslation(lng, 'common')
  const { t: tComponents } = useTranslation(lng, 'components')
  const { token } = theme.useToken()

  const [draftName, setDraftName] = useState('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<MovieBenefitRow[]>([])

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await http({
        url: 'admin/benefit/movie/list',
        method: 'post',
        data: { page: 1, pageSize: 5000, movieName: '' }
      })
      const d = res?.data ?? res
      const list: any[] = (d?.list ?? d ?? []) as any
      setRows(
        (Array.isArray(list) ? list : []).map((it) => ({
          movieId: Number(it.movieId),
          movieName: it.movieName || `${it.movieId}`,
          movieCover: it.movieCover,
          benefitCount: Number(it.benefitCount ?? 0)
        }))
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredRows = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return rows
    return rows.filter((r) => (r.movieName || '').toLowerCase().includes(kw))
  }, [rows, keyword])

  const columns: TableColumnsType<MovieBenefitRow> = [
    {
      title: common('benefit.table.movieName'),
      dataIndex: 'movieName',
      render: (_: any, row) => {
        const posterBox: React.CSSProperties = {
          width: 100,
          flexShrink: 0,
          border: '1px solid #e8e8e8',
          borderRadius: 4,
          overflow: 'hidden',
          background: '#fafafa',
          boxSizing: 'border-box'
        }
        return (
          <Space size={12} align="start" style={{ textAlign: 'left' }}>
            <div style={posterBox}>
              {row.movieCover ? (
                <CustomAntImage
                  src={row.movieCover}
                  style={{ objectFit: 'cover', display: 'block' }}
                  preview
                />
              ) : null}
            </div>
            <Tooltip title={row.movieName}>
              <span
                style={{
                  maxWidth: 320,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                  verticalAlign: 'top',
                  textAlign: 'left'
                }}
              >
                {row.movieName}
              </span>
            </Tooltip>
          </Space>
        )
      }
    },
    {
      title: common('benefit.table.phaseCount'),
      dataIndex: 'benefitCount',
      width: 120,
      align: 'center'
    },
    {
      title: common('table.action'),
      width: 120,
      align: 'center',
      render: (_: any, row) => (
        <Button
          type="link"
          onClick={() => {
            router.push(processPath('benefitList', { id: row.movieId }))
          }}
        >
          {common('benefit.button.detail')}
        </Button>
      )
    }
  ]

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <section
        style={{
          background: token.colorFillAlter,
          borderRadius: token.borderRadiusLG,
          padding: 24
        }}
      >
        <Row gutter={16} align="middle" wrap>
          <Col flex="none">
            <Space align="center" wrap>
              <span style={{ whiteSpace: 'nowrap' }}>{common('benefit.table.movieName')}:</span>
              <Input
                allowClear
                style={{ width: 260 }}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onPressEnter={(e) => e.preventDefault()}
              />
            </Space>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setDraftName('')
                  setKeyword('')
                }}
              >
                {tComponents('query.clear')}
              </Button>
              <Button type="primary" onClick={() => setKeyword(draftName)}>
                {tComponents('query.search')}
              </Button>
            </Space>
          </Col>
        </Row>
      </section>

      <Table<MovieBenefitRow>
        rowKey="movieId"
        columns={columns}
        dataSource={filteredRows}
        loading={loading}
        bordered
        pagination={false}
      />
    </section>
  )
}

