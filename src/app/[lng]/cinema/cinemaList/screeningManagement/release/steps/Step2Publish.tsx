'use client'

/**
 * 定时公开与开放购票步骤：是否公开、公开方式、定时公开时间、开放购票时间。
 * 使用自定义 24/30h AppTimePicker（日期 DatePicker + 时间 AppTimePicker）。
 */
import React from 'react'
import { Form, Row, Col, Space, Typography, Radio, DatePicker, Card, Switch, Button } from 'antd'
import { ClockCircleOutlined, GlobalOutlined, ShoppingOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { AppTimePicker, type TimeDisplayMode } from '@/components/AppTimePicker'
import type { ReleaseFormState } from '../types'

const { Title, Paragraph } = Typography

interface Step2PublishProps {
  form: ReleaseFormState
  setForm: React.Dispatch<React.SetStateAction<ReleaseFormState>>
  t: (key: string) => string
  common: (key: string) => string
  timeDisplayMode?: TimeDisplayMode
  baseDate?: Dayjs
}

export function Step2Publish({
  form,
  setForm,
  t,
  timeDisplayMode = '30h',
  baseDate
}: Step2PublishProps) {
  const base = baseDate ?? dayjs().startOf('day')

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Space align="center" size={8} style={{ marginBottom: 8 }}>
          <ClockCircleOutlined style={{ color: 'var(--ant-color-primary)', fontSize: 18 }} />
          <span style={{ color: 'var(--ant-color-primary)', fontWeight: 600 }}>STEP 2</span>
        </Space>
        <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
          {t('releasePage.step2.title')}
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {t('releasePage.step2.instruction')}
        </Paragraph>
      </div>

      <Card size="small" style={{ marginBottom: 24 }} title={<Space><GlobalOutlined /><span>{t('releasePage.step2.publishSection')}</span></Space>}>
        <Row gutter={[24, 16]}>
          <Col span={24}>
            <Form.Item label={t('showTimeModal.form.open.label')} style={{ marginBottom: 0 }}>
              <Space align="center">
                <Switch
                  checked={form.open !== false}
                  onChange={(v) => setForm((prev) => ({ ...prev, open: v }))}
                />
                <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
                  {form.open !== false ? t('releasePage.step4.openYes') : t('releasePage.step4.openNo')}
                </span>
              </Space>
            </Form.Item>
          </Col>
          {form.open !== false && (
            <>
              <Col span={24}>
                <Form.Item label={t('showTimeModal.form.publishMode.label')} style={{ marginBottom: 0 }}>
                  <Radio.Group
                    value={form.publishMode ?? 'immediate'}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, publishMode: e.target.value as 'immediate' | 'scheduled' }))
                    }
                  >
                    <Radio value="immediate">{t('showTimeModal.form.publishMode.immediate')}</Radio>
                    <Radio value="scheduled">{t('showTimeModal.form.publishMode.scheduled')}</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              {form.publishMode === 'scheduled' && (
                <Col span={24}>
                  <Form.Item label={t('showTimeModal.form.publishAt.label')} style={{ marginBottom: 0 }}>
                    <Space align="center" wrap>
                      <Space.Compact style={{ width: '100%', maxWidth: 320 }}>
                        <DatePicker
                          value={form.publishAt ?? null}
                          onChange={(d) =>
                            setForm((prev) => ({
                              ...prev,
                              publishAt: d
                                ? d.hour(prev.publishAt?.hour() ?? 0).minute(prev.publishAt?.minute() ?? 0)
                                : undefined
                            }))
                          }
                          style={{ flex: 1, minWidth: 120 }}
                        />
                        <AppTimePicker
                          value={form.publishAt ?? null}
                          baseDate={(form.publishAt ?? base).startOf('day')}
                          mode={timeDisplayMode}
                          onChange={(time) => setForm((prev) => ({ ...prev, publishAt: time ?? undefined }))}
                          style={{ flex: 1, minWidth: 120 }}
                        />
                      </Space.Compact>
                      <Button type="link" size="small" onClick={() => setForm((prev) => ({ ...prev, publishAt: dayjs() }))}>
                        {t('releasePage.step2.setToNow')}
                      </Button>
                    </Space>
                  </Form.Item>
                </Col>
              )}
            </>
          )}
        </Row>
      </Card>

      {form.open !== false && (
        <Card size="small" title={<Space><ShoppingOutlined /><span>{t('releasePage.step2.saleSection')}</span></Space>}>
          <Row gutter={[24, 16]}>
            <Col span={24}>
              <Form.Item label={t('releasePage.step2.enableSaleOpenAt')} style={{ marginBottom: 16 }}>
                <Space align="center">
                  <Switch
                    checked={form.enableSaleOpenAt !== false}
                    onChange={(v) =>
                      setForm((prev) => ({
                        ...prev,
                        enableSaleOpenAt: v,
                        saleOpenAt: v ? prev.saleOpenAt ?? dayjs() : undefined
                      }))
                    }
                  />
                  <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
                    {form.enableSaleOpenAt !== false ? t('releasePage.step4.openYes') : t('releasePage.step4.openNo')}
                  </span>
                </Space>
              </Form.Item>
            </Col>
            {form.enableSaleOpenAt !== false && (
              <Col span={24}>
                <Form.Item label={t('showTimeModal.form.saleOpenAt.label')} style={{ marginBottom: 0 }}>
                  <Space align="center" wrap>
                    <Space.Compact style={{ width: '100%', maxWidth: 320 }}>
                      <DatePicker
                        value={form.saleOpenAt ?? null}
                        onChange={(d) =>
                          setForm((prev) => ({
                            ...prev,
                            saleOpenAt: d
                              ? d.hour(prev.saleOpenAt?.hour() ?? 0).minute(prev.saleOpenAt?.minute() ?? 0)
                              : undefined
                          }))
                        }
                        style={{ flex: 1, minWidth: 120 }}
                      />
                      <AppTimePicker
                        value={form.saleOpenAt ?? null}
                        baseDate={(form.saleOpenAt ?? base).startOf('day')}
                        mode={timeDisplayMode}
                        onChange={(time) => setForm((prev) => ({ ...prev, saleOpenAt: time ?? undefined }))}
                        style={{ flex: 1, minWidth: 120 }}
                      />
                    </Space.Compact>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => setForm((prev) => ({ ...prev, saleOpenAt: dayjs() }))}
                    >
                      {t('releasePage.step2.setToNow')}
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            )}
          </Row>
        </Card>
      )}
    </>
  )
}
