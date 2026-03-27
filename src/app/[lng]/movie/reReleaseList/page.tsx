'use client'
import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Row,
  Input,
  Tag,
  Select,
  Modal,
  message,
  Flex
} from 'antd'

import type { TableColumnsType } from 'antd'
import { status, notFoundImage } from '@/config/index'

import { Query, QueryItem } from '@/components/query'
import http from '@/api/index'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../../layout'
import { CheckPermission } from '@/components/checkPermission'
import { showTotal } from '@/utils/pagination'
import { ReReleaseModal } from '@/dialog/reReleaseModal'
import { CustomAntImage } from '@/components/CustomAntImage'

interface Query {
  name: string
  status: number
}

export default function Page({ params: { lng } }: PageProps) {
  type ReReleasePlan = {
    id: number
    movieId: number
    name?: string
    cover?: string
    levelName?: string
    startDate?: string
    endDate?: string
    status?: number
    versionInfo?: string
    displayNameOverride?: string
    posterOverride?: string
  }

  type ReReleaseMovieRow = {
    movieId: number
    name?: string
    cover?: string
    levelName?: string
    plans: ReReleasePlan[]
  }

  const [data, setData] = useState<ReReleaseMovieRow[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState<Partial<Query>>({})
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])
  const { t } = useTranslation(lng, 'movie')
  const { t: common } = useTranslation(lng, 'common')
  const [modal, setModal] = useState({
    show: false,
    data: {}
  })

  const PAGE_SIZE = 10

  const getData = () => {
    http({
      url: '/movie/reRelease/list',
      method: 'post',
      data: {
        page: 1,
        pageSize: 5000,
        ...query
      }
    }).then((res) => {
      const list: ReReleasePlan[] = res.data?.list ?? []
      const map = new Map<number, ReReleaseMovieRow>()
      for (const item of list) {
        if (!item?.movieId) continue
        const mid = Number(item.movieId)
        const existing = map.get(mid)
        if (!existing) {
          map.set(mid, {
            movieId: mid,
            name: item.name,
            cover: item.cover,
            levelName: item.levelName,
            plans: [item]
          })
        } else {
          existing.plans.push(item)
        }
      }
      const grouped = Array.from(map.values()).sort((a, b) => (b.movieId ?? 0) - (a.movieId ?? 0))
      setData(grouped)
      setPage(1)
      setTotal(grouped.length)
    })
  }

  useEffect(() => {
    getData()
  }, [])

  const columns: TableColumnsType<ReReleaseMovieRow> = [
    {
      title: t('table.name'),
      dataIndex: 'name',
      width: 350,
      fixed: 'left',
      render(_: any, row) {
        return (
          <Space
            align="start"
            style={{
              position: 'relative'
            }}
          >
            <CustomAntImage
              width={120}
              src={row.cover}
              alt="poster"
              fallback={notFoundImage}
              placeholder={true}
              style={{
                borderRadius: ' 4px',
                objectFit: 'cover'
              }}
            ></CustomAntImage>
            <Tag
              style={{
                position: 'absolute',
                top: '0',
                left: '0'
              }}
              color="green"
            >
              {row.levelName}
            </Tag>
            <Space direction="vertical">
              <span>{row.name}</span>
            </Space>
          </Space>
        )
      }
    },
    {
      title: '重映批次',
      width: 120,
      dataIndex: 'plans',
      render: (plans: ReReleasePlan[]) => <span>{plans?.length ?? 0}</span>
    },
    {
      title: t('table.action'),
      key: 'operation',
      fixed: 'right',
      width: 120,
      render: (_, row) => {
        const expanded = expandedRowKeys.includes(row.movieId)
        return (
          <Button
            onClick={() => {
              setExpandedRowKeys((prev) => {
                const set = new Set(prev)
                if (set.has(row.movieId)) set.delete(row.movieId)
                else set.add(row.movieId)
                return Array.from(set)
              })
            }}
          >
            {expanded ? common('button.cancel') : common('button.detail')}
          </Button>
        )
      }
    }
  ]

  const planColumns: TableColumnsType<ReReleasePlan> = [
    { title: t('table.startDate'), dataIndex: 'startDate', width: 120 },
    { title: t('table.endDate'), dataIndex: 'endDate', width: 120 },
    {
      title: t('table.reReleaseEnabled'),
      dataIndex: 'status',
      width: 100,
      render: (v) => (
        <Tag color={Number(v) === 1 ? 'green' : 'default'}>{Number(v) === 1 ? '启用' : '停用'}</Tag>
      )
    },
    { title: t('table.reReleaseVersionInfo'), dataIndex: 'versionInfo', width: 220, ellipsis: true },
    { title: t('table.reReleaseDisplayNameOverride'), dataIndex: 'displayNameOverride', width: 220, ellipsis: true },
    {
      title: t('table.reReleasePosterOverride'),
      dataIndex: 'posterOverride',
      width: 120,
      render: (v) =>
        v ? (
          <CustomAntImage
            width={60}
            src={v}
            alt="poster"
            fallback={notFoundImage}
            placeholder={true}
            style={{ borderRadius: '4px', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ color: '#999' }}>—</span>
        )
    },
    {
      title: t('table.action'),
      key: 'op',
      fixed: 'right',
      width: 140,
      render: (_, p) => (
        <Space>
          <Button
            size="small"
            onClick={() => setModal({ show: true, data: p as any })}
          >
            {common('button.edit')}
          </Button>
          <Button
            size="small"
            danger
            onClick={() => {
              Modal.confirm({
                title: common('button.remove'),
                content: t('message.remove.content'),
                onOk() {
                  return new Promise((resolve, reject) => {
                    http({
                      url: 'movie/reRelease/remove',
                      method: 'delete',
                      params: { id: p.id }
                    })
                      .then(() => {
                        message.success(t('message.remove.success'))
                        getData()
                        resolve(true)
                      })
                      .catch(reject)
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
  ]

  return (
    <section>
      <Flex vertical gap={30}>
        <Row justify="end">
          <CheckPermission code="movie.save">
            <Button
              onClick={() => {
                setModal({
                  show: true,
                  data: {}
                })
              }}
            >
              {common('button.add')}
            </Button>
          </CheckPermission>
        </Row>
        <Query
          model={query}
          initialValues={{}}
          onSearch={() => {
            console.log(query)
            getData()
          }}
          onClear={(obj) => {
            setQuery(obj)
          }}
        >
          <QueryItem label={t('table.name')}>
            <Input
              value={query.name}
              allowClear
              onChange={(e) => {
                query.name = e.target.value
                setQuery(query)
              }}
            ></Input>
          </QueryItem>
          <QueryItem label={t('table.status')}>
            <Select
              value={query.status}
              allowClear
              onChange={(val) => {
                query.status = val
                setQuery(query)
              }}
            >
              {Object.entries(status).map((item, index) => {
                const [key, value] = item

                return (
                  <Select.Option value={key} key={index}>
                    {value}
                  </Select.Option>
                )
              })}
            </Select>
          </QueryItem>
        </Query>

        <Table
          columns={columns}
          dataSource={data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
          rowKey="movieId"
          expandable={{
            expandedRowKeys,
            onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as React.Key[]),
            expandedRowRender: (row) => (
              <Table
                columns={planColumns}
                dataSource={row.plans}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: planColumns.reduce((acc, c) => acc + (c.width as number), 0) }}
              />
            )
          }}
          bordered={true}
          scroll={{
            x: columns.reduce(
              (total, current) => total + (current.width as number),
              0
            )
          }}
          sticky={{ offsetHeader: -20 }}
          pagination={{
            pageSize: PAGE_SIZE,
            current: page,
            total,
            showTotal,
            onChange(page) {
              setPage(page)
            },
            position: ['bottomCenter']
          }}
        />
      </Flex>
      <ReReleaseModal
        show={modal.show}
        data={modal.data}
        onCancel={() => {
          setModal({
            ...modal,
            show: false
          })
        }}
        onConfirm={() => {
          setModal({
            ...modal,
            show: false
          })
          getData()
        }}
        type={modal.data && Object.keys(modal.data).length ? 'edit' : 'create'}
      ></ReReleaseModal>
    </section>
  )
}
