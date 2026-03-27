'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Modal, Table, Tag, Space, Input, Select, Flex } from 'antd'
import type { TableColumnsType } from 'antd'
import { useTranslation } from '@/app/i18n/client'
import { languageType, notFoundImage, status as movieStatusDict } from '@/config'
import { Query, QueryItem } from '@/components/query'
import { showTotal } from '@/utils/pagination'
import { getMovieList } from '@/api/request/movie'
import http from '@/api'
import { CustomAntImage } from '@/components/CustomAntImage'

type SelectType = 'all' | 'movie' | 'reRelease'

type RowItem = {
  key: string
  type: 'movie' | 'reRelease'
  movieId: number
  name?: string
  cover?: string
  levelName?: string
  startDate?: string
  endDate?: string
  reReleaseId?: number
  versionInfo?: string
}

interface ModalQuery {
  name?: string
  status?: number
  type?: SelectType
}

interface MovieReReleaseModalProps {
  show?: boolean
  zIndex?: number
  onCancel?: () => void
  onConfirm?: (payload: { movieId: number; movieName?: string; reReleaseId?: number }) => void
}

export function MovieReReleaseModal(props: MovieReReleaseModalProps) {
  const { t } = useTranslation(navigator.language as languageType, 'movie')
  const { t: common } = useTranslation(navigator.language as languageType, 'common')

  const [query, setQuery] = useState<Partial<ModalQuery>>({ type: 'all' })
  const [data, setData] = useState<RowItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [selectedRow, setSelectedRow] = useState<RowItem | null>(null)

  const PAGE_SIZE = 10

  const fetchData = async () => {
    const type = query.type ?? 'all'
    const name = query.name
    const status = query.status

    const rows: RowItem[] = []

    if (type === 'all' || type === 'movie') {
      const res: any = await getMovieList({
        page: 1,
        pageSize: 200,
        ...(name ? { name } : {}),
        ...(status != null ? { status } : {})
      })
      const list = res?.data?.list ?? []
      for (const m of list) {
        rows.push({
          key: `movie_${m.id}`,
          type: 'movie',
          movieId: Number(m.id),
          name: m.name,
          cover: m.cover,
          levelName: m.levelName,
          startDate: m.startDate,
          endDate: m.endDate
        })
      }
    }

    if (type === 'all' || type === 'reRelease') {
      const res: any = await http({
        url: '/movie/reRelease/list',
        method: 'post',
        data: {
          page: 1,
          pageSize: 2000,
          ...(name ? { name } : {}),
          ...(status != null ? { status } : {})
        }
      })
      const list = res?.data?.list ?? []
      for (const r of list) {
        rows.push({
          key: `reRelease_${r.id}`,
          type: 'reRelease',
          movieId: Number(r.movieId),
          name: r.name,
          cover: r.cover,
          levelName: r.levelName,
          startDate: r.startDate,
          endDate: r.endDate,
          reReleaseId: Number(r.id),
          versionInfo: r.versionInfo
        })
      }
    }

    // 默认按 type 排序：重映在前，然后按 movieId/开始日期
    rows.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'reRelease' ? -1 : 1
      if (a.movieId !== b.movieId) return b.movieId - a.movieId
      return String(b.startDate ?? '').localeCompare(String(a.startDate ?? ''))
    })

    setData(rows)
    setPage(1)
    setTotal(rows.length)
  }

  useEffect(() => {
    if (props.show) {
      fetchData()
      setSelectedRowKeys([])
      setSelectedRow(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.show])

  const columns: TableColumnsType<RowItem> = useMemo(
    () => [
      {
        title: t('table.name'),
        dataIndex: 'name',
        width: 420,
        fixed: 'left',
        render: (_, row) => (
          <Space align="start" style={{ position: 'relative' }}>
            <CustomAntImage
              width={90}
              src={row.cover}
              alt="poster"
              fallback={notFoundImage}
              placeholder={true}
              style={{ borderRadius: '4px', objectFit: 'cover' }}
            />
            <Tag
              style={{ position: 'absolute', top: 0, left: 0 }}
              color="green"
            >
              {row.levelName}
            </Tag>
            <Space direction="vertical" size={6}>
              <Space size={8}>
                {row.type === 'reRelease' && <Tag color="blue">重映</Tag>}
                <span>{row.name}</span>
              </Space>
              {row.type === 'reRelease' && row.versionInfo ? (
                <span style={{ color: '#666' }}>{row.versionInfo}</span>
              ) : null}
            </Space>
          </Space>
        )
      },
      {
        title: t('table.startDate'),
        dataIndex: 'startDate',
        width: 140
      },
      {
        title: t('table.endDate'),
        dataIndex: 'endDate',
        width: 140,
        render: (v) => (v ? v : '—')
      },
      {
        title: common('table.status'),
        dataIndex: 'type',
        width: 120,
        render: (v) => (v === 'reRelease' ? '重映' : common('cinemaList_movies_nowShowing') ?? 'Movie')
      }
    ],
    [t, common]
  )

  const pagedData = useMemo(
    () => data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [data, page]
  )

  return (
    <Modal
      title={t('movieModal.title')}
      open={props.show}
      maskClosable={false}
      width="85%"
      style={{ top: 40 }}
      zIndex={props.zIndex ?? 1100}
      onOk={() => {
        if (!selectedRow) return
        props.onConfirm?.({
          movieId: selectedRow.movieId,
          movieName: selectedRow.name,
          reReleaseId: selectedRow.reReleaseId
        })
      }}
      onCancel={props.onCancel}
    >
      <Flex vertical gap={16}>
        <Query
          model={query}
          initialValues={{}}
          onSearch={() => fetchData()}
          onClear={(obj) => setQuery(obj)}
        >
          <QueryItem label={t('table.name')}>
            <Input
              value={query.name}
              allowClear
              onChange={(e) => {
                query.name = e.target.value
                setQuery({ ...query })
              }}
            />
          </QueryItem>
          <QueryItem label={t('table.status')}>
            <Select
              value={query.status}
              allowClear
              onChange={(val) => setQuery({ ...query, status: val })}
              style={{ width: 180 }}
            >
              {Object.entries(movieStatusDict).map(([key, label]) => (
                <Select.Option value={key} key={key}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </QueryItem>
          <QueryItem label="是否重映">
            <Select
              value={query.type}
              onChange={(val) => setQuery({ ...query, type: val })}
              style={{ width: 180 }}
            >
              <Select.Option value="all">全部</Select.Option>
              <Select.Option value="movie">仅电影</Select.Option>
              <Select.Option value="reRelease">仅重映</Select.Option>
            </Select>
          </QueryItem>
        </Query>

        <Table
          columns={columns}
          dataSource={pagedData}
          rowKey="key"
          bordered
          scroll={{
            x: columns.reduce((acc, c) => acc + (c.width as number), 0)
          }}
          rowSelection={{
            type: 'radio',
            selectedRowKeys,
            onChange: (keys, rows) => {
              const k = (keys as string[]) ?? []
              setSelectedRowKeys(k)
              setSelectedRow((rows?.[0] as RowItem) ?? null)
            }
          }}
          pagination={{
            pageSize: PAGE_SIZE,
            current: page,
            total,
            showTotal,
            onChange: (p) => setPage(p),
            position: ['bottomCenter']
          }}
        />
      </Flex>
    </Modal>
  )
}

