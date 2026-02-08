'use client'

import React from 'react'
import { Card, Col, Form, Row } from 'antd'
import { Upload as ImageUpload } from '@/components/upload/Upload'
import type { StepProps } from '../types'

export function StepMedia({ form, t }: StepProps) {
  return (
    <Row gutter={[0, 24]}>
      <Col span={24}>
        <Card title={t('presale.form.section.media')} size="small" style={{ marginBottom: 0 }}>
          <Row gutter={[24, 0]}>
            <Col span={24}>
              <Form.Item
                label={t('presale.form.cover.label')}
                name="cover"
                rules={[{ required: true, message: t('presale.form.cover.required') }]}
              >
                <ImageUpload
                  value={form.getFieldValue('cover') || ''}
                  onChange={(val) => form.setFieldsValue({ cover: val })}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col span={24}>
              <Form.Item
                label={t('presale.form.gallery.label')}
                name="gallery"
                getValueFromEvent={(v: string[]) => v}
                trigger="onChange"
              >
                <ImageUpload
                  value={form.getFieldValue('gallery') || []}
                  multiple
                  onChange={(val) => form.setFieldsValue({ gallery: val })}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  )
}
