'use client'

import React from 'react'
import { Card, Col, Form, Input, Row } from 'antd'
import type { StepProps } from '../types'

export function StepExtra({ form, t }: StepProps) {
  return (
    <Row gutter={[0, 24]}>
      <Col span={24}>
        <Card title={t('presale.form.section.extra')} size="small">
          <Row gutter={[24, 0]}>
            <Col span={24}>
              <Form.Item
                label={t('presale.form.pickupNotes.label')}
                name="pickupNotes"
              >
                <Input.TextArea
                  rows={3}
                  placeholder={t('presale.form.pickupNotes.placeholder')}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  )
}
