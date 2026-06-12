'use client'

import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Input, Modal, message } from 'antd'
import type { TableColumnsType } from 'antd'
import { Query, QueryItem } from '@/components/query'
import http from '@/api/index'
import { useTranslation } from '@/app/i18n/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageProps } from '@/app/[lng]/layout'
import { CheckPermission } from '@/components/checkPermission'
import { showTotal } from '@/utils/pagination'
import { formatNumber } from '@/utils'
import { Dict } from '@/components/dict'
import { DictCode } from '@/enum/dict'
import { processPath } from '@/config/router'
import { CustomAntImage } from '@/components/CustomAntImage'

interface BenefitListItem {
  id: number
  movieId: number
  movieName?: string
  /** 电影封面（列表接口返回） */
  movieCover?: string
  name: string
  description?: string
  /** 列表首图（后端可能返回 imageUrls 或 images，这里只取第一张做封面） */
  imageUrls?: string[]
  images?: string[]
  startDate: string
  endDate: string
  orderNum?: number
  quantity?: number
  remaining?: number | null
  /** 阶段状态：字典 benefitPhaseStatus 1=之前 2=进行中 3=已结束 */
  status?: number
}

interface QueryState {
  name?: string
  [key: string]: unknown
}

export default function Page ({ params: { lng } }: Readonly<PageProps>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const movieIdFromUrl = searchParams.get('id')
  const movieId = movieIdFromUrl ? parseInt(movieIdFromUrl, 10) : null
  const [data, setData] = useState<BenefitListItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [query, setQuery] = useState<QueryState>({})
  const { t: common } = useTranslation(lng, 'common')

  const getData = (p = 1, size = 10) => {
    http({
      url: 'admin/benefit/list',
      method: 'post',
      data: {
        page: p,
        pageSize: size,
        ...(movieId != null && !Number.isNaN(movieId) ? { movieId } : {}),
        ...query
      }
    })
      .then((res: any) => {
        const d = res.data ?? res
        const list = d.list ?? d
        const totalCount =
          typeof d.total === 'number'
            ? d.total
            : Array.isArray(list)
            ? list.length
            : 0
        setData(Array.isArray(list) ? list : [])
        setPage(p)
        setPageSize(size)
        setTotal(totalCount)
      })
      .catch(() => {
        setData([])
      })
  }

  useEffect(() => {
    getData()
  }, [movieId])

  /** 阶段行操作 */
  const phaseActionRender = (row: BenefitListItem) => (
    <Space size='middle' wrap direction='vertical'>
      <CheckPermission code='benefit.save'>
        <Button
          type='link'
          size='small'
          style={{ padding: 0 }}
          onClick={() =>
            router.push(processPath('benefitDetail', { id: row.id }))
          }
        >
          {common('button.edit')}
        </Button>
      </CheckPermission>
      <CheckPermission code='benefit.stock.save'>
        <Button
          type='link'
          size='small'
          style={{ padding: 0 }}
          onClick={() =>
            router.push(
              processPath('benefitStock', {
                id: row.id,
                movieId: row.movieId,
                name: row.name
              })
            )
          }
        >
          {common('benefit.tab.stock')}
        </Button>
      </CheckPermission>
      <CheckPermission code='benefit.remove'>
        <Button
          type='link'
          size='small'
          danger
          style={{ padding: 0 }}
          onClick={() => {
            Modal.confirm({
              title: common('button.remove'),
              content: common('benefit.message.removeContent'),
              onOk () {
                return http({
                  url: 'admin/benefit/remove',
                  method: 'delete',
                  params: { id: row.id }
                }).then(() => {
                  message.success(common('benefit.message.removeSuccess'))
                  getData(page, pageSize)
                })
              }
            })
          }}
        >
          {common('button.remove')}
        </Button>
      </CheckPermission>
    </Space>
  )

  /** 特典数量单位：亿、万、千 */
  const quantityUnits = [
    { value: 1e8, unit: common('unit.billion') },
    { value: 1e4, unit: common('unit.million') },
    { value: 1e3, unit: common('unit.thousand') }
  ]

  const phaseThumbWrap: React.CSSProperties = {
    width: '100%',
    margin: '0 auto',
    border: '1px solid #e8e8e8',
    borderRadius: 8,
    overflow: 'hidden',
    background: '#fafafa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box'
  }

  /** 阶段列表列 */
  const phaseColumns: TableColumnsType<BenefitListItem> = [
    {
      title: common('benefit.table.image'),
      dataIndex: 'imageUrls',
      width: 120,
      align: 'center',
      render: (_: unknown, row) => {
        const src =
          (Array.isArray(row.imageUrls) && row.imageUrls[0]) ||
          (Array.isArray(row.images) && row.images[0])
        if (!src) {
          return (
            <div
              style={{
                ...phaseThumbWrap,
                color: '#bfbfbf',
                fontSize: 13
              }}
            >
              —
            </div>
          )
        }
        return (
          <div>
            <CustomAntImage
              src={src}
              style={{ objectFit: 'cover', display: 'block' }}
              preview
            />
          </div>
        )
      }
    },
    {
      title: common('benefit.table.name'),
      dataIndex: 'name',
      width: 140
    },
    {
      title: common('benefit.table.startDate'),
      dataIndex: 'startDate',
      width: 110
    },
    {
      title: common('benefit.table.endDate'),
      dataIndex: 'endDate',
      width: 110
    },
    {
      title: common('benefit.table.status'),
      dataIndex: 'status',
      width: 88,
      align: 'center',
      render: (v: number | null | undefined) =>
        v != null ? <Dict name={DictCode.BENEFIT_PHASE_STATUS} code={v} /> : '—'
    },
    {
      title: common('benefit.detail.quantity'),
      dataIndex: 'quantity',
      width: 90,
      align: 'center',
      render: (v: number) =>
        v != null ? formatNumber(Number(v), quantityUnits) : '—'
    },
    {
      title: common('benefit.table.remaining'),
      dataIndex: 'remaining',
      width: 90,
      align: 'center',
      render: (v: number | null | undefined) =>
        v != null
          ? formatNumber(Number(v), quantityUnits)
          : common('benefit.table.unknown')
    },
    {
      title: common('benefit.table.orderNum'),
      dataIndex: 'orderNum',
      width: 70,
      align: 'center',
      render: (v: number) => (v != null ? v : '—')
    },
    {
      title: common('table.action'),
      key: 'action',
      width: 90,
      fixed: 'right',
      render: (_, row) => phaseActionRender(row)
    }
  ]

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Query
        model={query}
        onSearch={() => getData(1, pageSize)}
        onClear={obj => {
          setQuery((obj || {}) as QueryState)
          getData(1, pageSize)
        }}
      >
        <QueryItem label={common('benefit.table.name')}>
          <Input
            allowClear
            placeholder={common('benefit.form.namePlaceholder')}
            value={query.name}
            onChange={e => setQuery({ ...query, name: e.target.value })}
          />
        </QueryItem>
        <QueryItem label=' ' colon={false}>
          <CheckPermission code='benefit.save'>
            <Button
              type='primary'
              onClick={() => {
                const path = processPath('benefitDetail', { movieId })
                router.push(path)
              }}
            >
              {common('benefit.button.addBenefit')}
            </Button>
          </CheckPermission>
        </QueryItem>
      </Query>
      <Table
        size='middle'
        columns={phaseColumns}
        dataSource={data}
        rowKey='id'
        bordered
        scroll={{ x: 1120 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showTotal,
          onChange: (p, size) => getData(p, (size as number) || pageSize),
          position: ['bottomCenter']
        }}
      />
    </section>
  )
}
