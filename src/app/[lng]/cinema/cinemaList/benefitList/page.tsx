'use client'

import React, { useState, useEffect } from 'react'
import { Table, Button, Tabs, message, Modal, Form, Input } from 'antd'
import http from '@/api/index'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '@/app/[lng]/layout'
import { showTotal } from '@/utils/pagination'
import { useSearchParams, useRouter } from 'next/navigation'
import { processPath } from '@/config/router'

interface StockRow {
  id: number
  cinemaId: number
  cinemaName?: string
  benefitId: number
  benefitName?: string
  quota?: number | null
  remaining?: number | null
}

interface FeedbackRow {
  id: number
  cinemaId: number
  cinemaName?: string
  benefitId: number
  benefitName?: string
  feedbackType?: number
  createTime?: string
}

/** 影院维度 - 入场者特典（本院线库存与用户反馈），路径 /cinema/benefit */
export default function CinemaBenefitPage ({
  params: { lng }
}: Readonly<PageProps>) {
  const router = useRouter()
  const { t: common } = useTranslation(lng, 'common')
  const [activeTab, setActiveTab] = useState('stock')
  const [stockList, setStockList] = useState<StockRow[]>([])
  const [stockPage, setStockPage] = useState(1)
  const [stockTotal, setStockTotal] = useState(0)
  const [stockPageSize, setStockPageSize] = useState(10)
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [stockForm] = Form.useForm()
  const [feedbackList, setFeedbackList] = useState<FeedbackRow[]>([])
  const [feedbackPage, setFeedbackPage] = useState(1)
  const [feedbackTotal, setFeedbackTotal] = useState(0)
  const [feedbackPageSize, setFeedbackPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const cinemaId = searchParams.get('cinemaId')


  const loadStockList = (p = 1, size = 10) => {
    setLoading(true)
    http({
      url: 'admin/cinema/benefit/stock/list',
      method: 'post',
      data: {
        page: p,
        pageSize: size,
        cinemaId: cinemaId ? Number(cinemaId) : undefined
      }
    })
      .then((res: any) => {
        const d = res.data ?? res
        const list = d.list ?? d ?? []
        setStockList(Array.isArray(list) ? list : [])
        setStockPage(p)
        setStockPageSize(size)
        setStockTotal(typeof d.total === 'number' ? d.total : 0)
      })
      .catch(() => {
        setStockList([])
      })
      .finally(() => setLoading(false))
  }

  const loadFeedbackList = (p = 1, size = 10) => {
    setLoading(true)
    http({
      url: 'admin/cinema/benefit/feedback/list',
      method: 'post',
      data: {
        page: p,
        pageSize: size,
        cinemaId: cinemaId ? Number(cinemaId) : undefined
      }
    })
      .then((res: any) => {
        const d = res.data ?? res
        const list = d.list ?? d ?? []
        setFeedbackList(Array.isArray(list) ? list : [])
        setFeedbackPage(p)
        setFeedbackPageSize(size)
        setFeedbackTotal(typeof d.total === 'number' ? d.total : 0)
      })
      .catch(() => {
        setFeedbackList([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (activeTab === 'stock' && cinemaId) loadStockList(stockPage, stockPageSize)
  }, [activeTab, cinemaId])

  useEffect(() => {
    if (activeTab === 'feedback' && cinemaId) loadFeedbackList(feedbackPage, feedbackPageSize)
  }, [activeTab, cinemaId])

  const onStockSave = () => {
    stockForm.validateFields().then((v) => {
      const quota = v.quota === '' || v.quota == null ? null : Number(v.quota)
      const remaining =
        v.remaining === '' || v.remaining == null ? null : Number(v.remaining)
      http({
        url: 'admin/cinema/benefit/stock/save',
        method: 'post',
        data: {
          id: v.id,
          cinemaId: v.cinemaId,
          benefitId: v.benefitId,
          quota,
          remaining: remaining ?? quota
        }
      })
        .then(() => {
          message.success(common('message.save'))
          setStockModalOpen(false)
          stockForm.resetFields()
          loadStockList(stockPage, stockPageSize)
        })
        .catch(() => {})
    })
  }

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>
        {common('benefit.cinema.title') ?? '本院线入场者特典'}
      </h2>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'stock',
            label: common('benefit.tab.stock') ?? '本院线库存',
            children: (
              <>
                <p style={{ marginBottom: 12, color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                  {common('benefit.cinema.stockTip') ?? '仅可编辑本院线已分配的物料配额与剩余；新增物料分配请由运营在「电影管理-入场者特典」中操作。'}
                </p>
                {cinemaId && (
                  <div style={{ marginBottom: 12 }}>
                    <Button
                      type="primary"
                      onClick={() =>
                        router.push(
                          processPath('benefitList', {
                            tab: 'stock',
                            cinemaId
                          })
                        )
                      }
                    >
                      {common('benefit.cinema.goAddStock') ?? '去分配库存'}
                    </Button>
                  </div>
                )}
                <Table
                  size='small'
                  rowKey='id'
                  loading={loading}
                  dataSource={stockList}
                  columns={[
                    {
                      title: common('benefit.table.benefitName') ?? '阶段',
                      dataIndex: 'benefitName',
                      width: 120,
                      ellipsis: true
                    },
                    {
                      title: common('benefit.table.benefitName') ?? '阶段',
                      dataIndex: 'benefitName',
                      width: 140
                    },
                    {
                      title: common('benefit.table.quota') ?? '配额',
                      dataIndex: 'quota',
                      width: 80,
                      align: 'right',
                      render: (val: number | null) =>
                        val != null
                          ? String(val)
                          : (common('benefit.table.unknown') ?? '—')
                    },
                    {
                      title: common('benefit.table.remaining') ?? '剩余',
                      dataIndex: 'remaining',
                      width: 80,
                      align: 'right',
                      render: (val: number | null) =>
                        val != null
                          ? String(val)
                          : (common('benefit.table.unknown') ?? '—')
                    },
                    {
                      title: common('table.action') ?? '操作',
                      width: 80,
                      render: (_, row) => (
                        <Button
                          type='link'
                          size='small'
                          onClick={() => {
                            stockForm.setFieldsValue({
                              id: row.id,
                              cinemaId: row.cinemaId,
                              benefitId: row.benefitId,
                              quota: row.quota,
                              remaining: row.remaining
                            })
                            setStockModalOpen(true)
                          }}
                        >
                          {common('button.edit') ?? '编辑'}
                        </Button>
                      )
                    }
                  ]}
                  pagination={{
                    current: stockPage,
                    pageSize: stockPageSize,
                    total: stockTotal,
                    showTotal,
                    onChange: (p, size) =>
                      loadStockList(p, (size as number) || stockPageSize),
                    position: ['bottomCenter']
                  }}
                />
              </>
            )
          },
          {
            key: 'feedback',
            label: common('benefit.cinema.tabFeedback') ?? '用户反馈',
            children: (
              <>
                <Table
                  size='small'
                  rowKey='id'
                  loading={loading}
                  dataSource={feedbackList}
                  columns={[
                    {
                      title: common('benefit.table.benefitName') ?? '阶段',
                      dataIndex: 'benefitName',
                      width: 140
                    },
                    {
                      title: common('benefit.table.feedbackType') ?? '类型',
                      dataIndex: 'feedbackType',
                      width: 80,
                      render: (t: number) =>
                        t === 1 ? (common('benefit.detail.soldOut') ?? '已领完') : String(t)
                    },
                    {
                      title: common('benefit.table.createTime') ?? '反馈时间',
                      dataIndex: 'createTime',
                      width: 160
                    }
                  ]}
                  pagination={{
                    current: feedbackPage,
                    pageSize: feedbackPageSize,
                    total: feedbackTotal,
                    showTotal,
                    onChange: (p, size) =>
                      loadFeedbackList(p, (size as number) || feedbackPageSize),
                    position: ['bottomCenter']
                  }}
                />
              </>
            )
          }
        ]}
      />

      <Modal
        title={common('benefit.button.addStock') ?? '库存'}
        open={stockModalOpen}
        maskClosable={false}
        onOk={onStockSave}
        onCancel={() => {
          setStockModalOpen(false)
          stockForm.resetFields()
        }}
        width={440}
      >
        <Form form={stockForm} layout='vertical' preserve={false}>
          <Form.Item name='id' hidden>
            <Input type='hidden' />
          </Form.Item>
          <Form.Item name='cinemaId' hidden>
            <Input type='hidden' />
          </Form.Item>
          <Form.Item name='benefitId' hidden>
            <Input type='hidden' />
          </Form.Item>
          <Form.Item
            name='quota'
            label={common('benefit.table.quota') ?? '配额'}
          >
            <Input type='number' min={0} placeholder={common('benefit.table.stockUnknownPlaceholder') ?? '不填表示未知'} />
          </Form.Item>
          <Form.Item
            name='remaining'
            label={common('benefit.table.remaining') ?? '剩余'}
          >
            <Input type='number' min={0} placeholder={common('benefit.table.stockUnknownPlaceholder') ?? '不填表示未知'} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
