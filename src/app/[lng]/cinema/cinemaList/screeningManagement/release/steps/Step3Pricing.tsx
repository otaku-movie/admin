'use client'

/**
 * 定价步骤：设置价格 / 默认规则 二选一；支持前售券（默认开启）。
 * 默认规则时获取并展示适合当日（或场次放映日）的票种。
 */
import React, { useEffect, useMemo, useState } from 'react'
import { Form, InputNumber, Switch, Row, Col, Space, Typography, Card, Spin } from 'antd'
import { DollarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useParams } from 'next/navigation'
import http from '@/api'
import { useTranslation } from '@/app/i18n/client'
import type { ReleaseFormState } from '../types'
import { PRICING_MODE_FIXED, PRICING_MODE_NONE } from '../types'

const { Title, Paragraph } = Typography

interface TicketTypeItem {
  id: number
  name: string
  price: number
  description?: string
  scheduleType?: number
  applicableWeekdays?: number[]
  applicableMonthDays?: number[]
  applicableDates?: string[]
  dailyStartTime?: string
  dailyEndTime?: string
}

interface Step3PricingProps {
  form: ReleaseFormState
  setForm: React.Dispatch<React.SetStateAction<ReleaseFormState>>
  t: (key: string) => string
  common: (key: string) => string
}

/** 星期几 1=周一…7=周日（dayjs .day() 0=周日 → 转为 7） */
function getWeekday(d: dayjs.Dayjs): number {
  const day = d.day()
  return day === 0 ? 7 : day
}

/** 渲染适用规则文案 */
function renderApplicableRule(
  tt: TicketTypeItem,
  weekdayLabels: { label: string; value: string }[],
  tTicketType: (key: string) => string
): string {
  const st = tt.scheduleType
  if (st == null) return '--'
  if (st === 1 && tt.applicableWeekdays?.length) {
    return tt.applicableWeekdays
      .map((d) => weekdayLabels.find((o) => o.value === String(d))?.label ?? String(d))
      .join('、')
  }
  if (st === 2 && tt.applicableMonthDays?.length) {
    const sorted = [...tt.applicableMonthDays].sort((a, b) => a - b)
    return tTicketType('schedule.monthlyPrefix') + sorted.join('、') + tTicketType('schedule.monthDaySuffix')
  }
  if (st === 3) {
    if (tt.dailyStartTime && tt.dailyEndTime) return `${tt.dailyStartTime} - ${tt.dailyEndTime}`
    return tTicketType('schedule.daily')
  }
  if (st === 4 && tt.applicableDates?.length) return [...tt.applicableDates].sort().join('、')
  return '--'
}

export function Step3Pricing({
  form,
  setForm,
  t,
  common
}: Step3PricingProps) {
  const params = useParams()
  const lng = (params?.lng as string) || 'ja'
  const { t: tTicketType } = useTranslation(lng as 'zh-CN' | 'ja' | 'en-US', 'ticketType')

  const [applicableTicketTypes, setApplicableTicketTypes] = useState<TicketTypeItem[]>([])
  const [loadingRules, setLoadingRules] = useState(false)

  const weekdayOptions = useMemo(
    () => [
      { label: tTicketType('weekday.mon'), value: '1' },
      { label: tTicketType('weekday.tue'), value: '2' },
      { label: tTicketType('weekday.wed'), value: '3' },
      { label: tTicketType('weekday.thu'), value: '4' },
      { label: tTicketType('weekday.fri'), value: '5' },
      { label: tTicketType('weekday.sat'), value: '6' },
      { label: tTicketType('weekday.sun'), value: '7' }
    ],
    [tTicketType]
  )

  const currentMode = form.pricingMode ?? PRICING_MODE_NONE
  const targetDate = form.screeningDate ?? dayjs()
  const weekday = getWeekday(targetDate)
  const targetDateStr = targetDate.format('YYYY-MM-DD')
  const weekdayLabel = t(`releasePage.step3.weekday${weekday}`)
  const applicableDateText = t('releasePage.step3.applicableDateLabel')
    .replace('{{date}}', targetDateStr)
    .replace('{{weekday}}', weekdayLabel)

  const showStartHHmm = form.startTime?.format('HH:mm')
  const showEndHHmm = form.endTime?.format('HH:mm')

  useEffect(() => {
    if (!form.cinemaId || currentMode !== PRICING_MODE_NONE) {
      setApplicableTicketTypes([])
      return
    }
    setLoadingRules(true)
    const data: Record<string, unknown> = {
      cinemaId: form.cinemaId,
      page: 1,
      pageSize: 500,
      weekday,
      targetDate: targetDateStr,
      includeDisabled: true
    }
    if (showStartHHmm && showEndHHmm) {
      data.startTime = showStartHHmm
      data.endTime = showEndHHmm
    }
    http({
      url: 'cinema/ticketType/list',
      method: 'post',
      data
    })
      .then((res) => {
        const list = (res.data || []).map((item: Record<string, unknown>) => ({
          id: item.id as number,
          name: item.name as string,
          price: item.price as number,
          description: item.description as string | undefined,
          scheduleType: item.scheduleType as number | undefined,
          applicableWeekdays: item.applicableWeekdays as number[] | undefined,
          applicableMonthDays: item.applicableMonthDays as number[] | undefined,
          applicableDates: item.applicableDates as string[] | undefined,
          dailyStartTime: item.dailyStartTime as string | undefined,
          dailyEndTime: item.dailyEndTime as string | undefined
        }))
        setApplicableTicketTypes(list)
      })
      .catch(() => setApplicableTicketTypes([]))
      .finally(() => setLoadingRules(false))
  }, [form.cinemaId, currentMode, weekday, targetDateStr, showStartHHmm, showEndHHmm])

  const modes = [
    {
      value: PRICING_MODE_FIXED,
      title: t('releasePage.step3.fixedPrice'),
      desc: t('releasePage.step3.fixedPriceDesc')
    },
    {
      value: PRICING_MODE_NONE,
      title: t('releasePage.step3.noActivity'),
      desc: t('releasePage.step3.noActivityDesc')
    }
  ]

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Space align="center" size={8} style={{ marginBottom: 8 }}>
          <DollarOutlined style={{ color: 'var(--ant-color-primary)', fontSize: 18 }} />
          <span style={{ color: 'var(--ant-color-primary)', fontWeight: 600 }}>STEP 3</span>
        </Space>
        <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
          {t('releasePage.step3.title')}
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {t('releasePage.step3.instruction')}
        </Paragraph>
      </div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {modes.map((m) => (
          <Col span={12} key={m.value}>
            <Card
              hoverable
              style={{
                borderColor: currentMode === m.value ? 'var(--ant-color-primary)' : undefined,
                borderWidth: currentMode === m.value ? 2 : 1
              }}
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  pricingMode: m.value,
                  activityId: undefined,
                  activityIds: undefined,
                  fixedAmount: m.value === PRICING_MODE_FIXED ? prev.fixedAmount : undefined
                }))
              }
            >
              <Paragraph strong style={{ marginBottom: 4 }}>
                {m.title}
              </Paragraph>
              <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 12 }}>
                {m.desc}
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
      {currentMode === PRICING_MODE_NONE && (
        <div style={{ marginBottom: 24 }}>
          <Paragraph strong style={{ marginBottom: 8, fontSize: 14 }}>
            {t('releasePage.step3.applicableTicketTypes')}
          </Paragraph>
          {!loadingRules && applicableTicketTypes.length > 0 && (
            <>
              <Paragraph
                type="secondary"
                style={{ marginBottom: 4, fontSize: 13 }}
              >
                {applicableDateText}
              </Paragraph>
              {form.startTime && form.endTime && (
                <Paragraph
                  type="secondary"
                  style={{ marginBottom: 8, fontSize: 13 }}
                >
                  {t('releasePage.step3.showTimeRangeLabel')
                    .replace('{{start}}', form.startTime.format('HH:mm'))
                    .replace('{{end}}', form.endTime.format('HH:mm'))}
                </Paragraph>
              )}
            </>
          )}
          {loadingRules ? (
            <div style={{ padding: '16px 0' }}>
              <Spin size="small" />
            </div>
          ) : applicableTicketTypes.length === 0 ? (
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {t('releasePage.step3.applicableTicketTypesEmpty')}
            </Paragraph>
          ) : (
            <>
              <Paragraph type="secondary" style={{ marginBottom: 8, fontSize: 12 }}>
                {t('releasePage.step3.ticketPriceOverrideHint')} {t('releasePage.step3.ticketTypeEnabledHint')}
              </Paragraph>
              <Card
                size="small"
                style={{
                  background: 'var(--ant-color-fill-quaternary)',
                  borderRadius: 8,
                  padding: '4px 12px'
                }}
                bodyStyle={{ padding: '4px 4px 8px' }}
              >
                {/* 表头与数据行使用相同 grid，保证列对齐 */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 150px 88px 132px',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px 10px',
                    borderBottom: '1px solid var(--ant-color-border-secondary)',
                    fontWeight: 600,
                    fontSize: 13,
                    color: 'var(--ant-color-text-secondary)'
                  }}
                >
                  <span>{t('releasePage.step3.ticketTypeColumnHeader')}</span>
                  <span>{t('releasePage.step3.applicableRuleColumnHeader')}</span>
                  <span style={{ textAlign: 'center' }}>{t('releasePage.step3.ticketTypeEnabledColumnHeader')}</span>
                  <span style={{ textAlign: 'right' }}>{t('releasePage.step3.priceColumnHeader')}</span>
                </div>
                {applicableTicketTypes.map((tt, index) => {
                  const enabled = form.ticketTypeEnabled?.[tt.id] !== false
                  return (
                    <div
                      key={tt.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 150px 88px 132px',
                        alignItems: 'center',
                        gap: 12,
                        padding:
                          index === applicableTicketTypes.length - 1
                            ? '10px 12px 12px'
                            : '10px 12px',
                        borderBottom:
                          index < applicableTicketTypes.length - 1
                            ? '1px solid var(--ant-color-border-secondary)'
                            : undefined,
                        opacity: enabled ? 1 : 0.6
                      }}
                    >
                      <span style={{ fontSize: 14, minWidth: 0 }}>
                        {tt.name}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--ant-color-text-secondary)',
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={renderApplicableRule(tt, weekdayOptions, tTicketType)}
                      >
                        {renderApplicableRule(tt, weekdayOptions, tTicketType)}
                      </span>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Switch
                          size="small"
                          checked={enabled}
                          onChange={(checked) => {
                            setForm((prev) => {
                              const next = { ...(prev.ticketTypeEnabled || {}) }
                              if (checked) delete next[tt.id]
                              else next[tt.id] = false
                              return {
                                ...prev,
                                ticketTypeEnabled: Object.keys(next).length ? next : undefined
                              }
                            })
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <InputNumber
                          min={0}
                          step={100}
                          value={form.ticketTypeOverrides?.[tt.id] ?? tt.price}
                          onChange={(v) => {
                            const num = v === null || v === undefined ? undefined : Number(v)
                            setForm((prev) => {
                              const next = { ...(prev.ticketTypeOverrides || {}) }
                              if (num === undefined) delete next[tt.id]
                              else next[tt.id] = num
                              return {
                                ...prev,
                                ticketTypeOverrides: Object.keys(next).length ? next : undefined
                              }
                            })
                          }}
                          addonBefore={t('releasePage.step3.priceUnitSymbol')}
                          controls={false}
                          style={{ width: 112 }}
                          disabled={!enabled}
                        />
                      </div>
                    </div>
                  )
                })}
              </Card>
            </>
          )}
        </div>
      )}
      {currentMode === PRICING_MODE_FIXED && (
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item label={t('showTimeModal.form.fixedAmount.label')} name="fixedAmount">
              <InputNumber
                min={0}
                step={100}
                value={form.fixedAmount}
                onChange={(v) => setForm((prev) => ({ ...prev, fixedAmount: v ?? undefined }))}
                addonAfter={common('unit.jpy')}
                style={{ width: '100%' }}
                placeholder={t('showTimeModal.form.fixedAmount.placeholder')}
              />
            </Form.Item>
          </Col>
        </Row>
      )}
      <Form.Item label={t('releasePage.step3.allowMubiTicket')}>
        <Switch
          checked={form.allowPresale !== false}
          onChange={(v) => setForm((prev) => ({ ...prev, allowPresale: v }))}
        />
      </Form.Item>
    </>
  )
}
