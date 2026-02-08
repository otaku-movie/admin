'use client'

import React from 'react'
import { Card, Col, DatePicker, Form, Row } from 'antd'
import type { StepProps } from '../types'

export function StepUsage({ form, t }: StepProps) {
  return (
    <Row gutter={[0, 24]}>
      <Col span={24}>
        <Card title={t('presale.form.section.usage')} size="small">
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={t('presale.form.usageStart.label')}
                extra={t('presale.form.usageStart.hint')}
                name="usageStart"
                dependencies={['usageEnd']}
                rules={[
                  {
                    required: true,
                    message: t('presale.form.usageStart.required')
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const end = getFieldValue('usageEnd') as
                        | import('dayjs').Dayjs
                        | undefined
                      if (!value || !end) {
                        return Promise.resolve()
                      }
                      if (value.isBefore(end) || value.isSame(end)) {
                        return Promise.resolve()
                      }
                      return Promise.reject(
                        t('presale.form.usageStart.beforeEnd')
                      )
                    }
                  })
                ]}
              >
                <DatePicker
                  format="YYYY-MM-DD HH:mm"
                  showTime={{ format: 'HH:mm' }}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={t('presale.form.usageEnd.label')}
                extra={t('presale.form.usageEnd.hint')}
                name="usageEnd"
                dependencies={['usageStart']}
                rules={[
                  {
                    required: true,
                    message: t('presale.form.usageEnd.required')
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const start = getFieldValue('usageStart') as
                        | import('dayjs').Dayjs
                        | undefined
                      if (!value || !start) {
                        return Promise.resolve()
                      }
                      if (value.isAfter(start) || value.isSame(start)) {
                        return Promise.resolve()
                      }
                      return Promise.reject(
                        t('presale.form.usageEnd.afterStart')
                      )
                    }
                  })
                ]}
              >
                <DatePicker
                  format="YYYY-MM-DD HH:mm:ss"
                  showTime={{ format: 'HH:mm:ss' }}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={t('presale.form.launchTime.label')}
                name="launchTime"
                dependencies={['endTime']}
                rules={[
                  {
                    required: true,
                    message: t('presale.form.launchTime.required')
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const end = getFieldValue('endTime') as
                        | import('dayjs').Dayjs
                        | undefined
                      if (!value || !end) {
                        return Promise.resolve()
                      }
                      if (value.isBefore(end) || value.isSame(end)) {
                        return Promise.resolve()
                      }
                      return Promise.reject(
                        t('presale.form.launchTime.beforeEnd')
                      )
                    }
                  })
                ]}
              >
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={t('presale.form.endTime.label')}
                extra={t('presale.form.endTime.hint')}
                name="endTime"
                dependencies={['launchTime']}
                rules={[
                  {
                    required: true,
                    message: t('presale.form.endTime.required')
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const launch = getFieldValue('launchTime') as
                        | import('dayjs').Dayjs
                        | undefined
                      if (!value || !launch) {
                        return Promise.resolve()
                      }
                      if (value.isAfter(launch)) {
                        return Promise.resolve()
                      }
                      return Promise.reject(
                        t('presale.form.endTime.afterLaunch')
                      )
                    }
                  })
                ]}
              >
                <DatePicker
                  showTime={{ format: 'HH:mm:ss' }}
                  format="YYYY-MM-DD HH:mm:ss"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  )
}
