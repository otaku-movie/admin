'use client'

import React from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography
} from 'antd'
import type { FormInstance } from 'antd'
import {
  MUBITIKE_KEYS,
  DELIVERY_KEYS,
  type StepProps,
  type PresaleFormValues,
  type SpecificationFormItem
} from '../types'

function DerivedBySpecsSummary({
  form,
  t
}: {
  form: FormInstance<PresaleFormValues>
  t: (key: string, opts?: Record<string, string>) => string
}) {
  const specifications = Form.useWatch('specifications', form) as
    | SpecificationFormItem[]
    | undefined
  const list = Array.isArray(specifications) ? specifications : []
  const ticketTypeSet = new Set(
    list
      .map((s) => s.ticketType)
      .filter(
        (v): v is (typeof MUBITIKE_KEYS)[number] =>
          typeof v === 'string' &&
          MUBITIKE_KEYS.includes(v as (typeof MUBITIKE_KEYS)[number])
      )
  )
  const deliveryTypeSet = new Set(
    list
      .map((s) => s.deliveryType)
      .filter(
        (v): v is (typeof DELIVERY_KEYS)[number] =>
          typeof v === 'string' &&
          DELIVERY_KEYS.includes(v as (typeof DELIVERY_KEYS)[number])
      )
  )
  const ticketTypes = [...ticketTypeSet]
  const deliveryTypes = [...deliveryTypeSet]
  const mubitikeLabel = (v: string) => t(`presale.mubitikeType.${v}`)
  const deliveryLabel = (v: string) => t(`presale.deliveryType.${v}`)
  if (list.length === 0) {
    return (
      <Alert
        type="info"
        message={t('presale.form.derivedBySpecs.setInSpecs')}
        showIcon
      />
    )
  }
  const mubitikeSummary =
    ticketTypes.length === 0
      ? '—'
      : ticketTypes.length === 1
        ? mubitikeLabel(ticketTypes[0]!)
        : t('presale.form.derivedBySpecs.multiple', {
            list: ticketTypes.map((k) => mubitikeLabel(k)).join('、')
          })
  const deliverySummary =
    deliveryTypes.length === 0
      ? '—'
      : deliveryTypes.length === 1
        ? deliveryLabel(deliveryTypes[0]!)
        : t('presale.form.derivedBySpecs.multiple', {
            list: deliveryTypes.map((k) => deliveryLabel(k)).join('、')
          })
  return (
    <Alert
      type="info"
      showIcon
      message={
        <>
          <div>{t('presale.form.derivedBySpecs.hint')}</div>
          <div style={{ marginTop: 8 }}>
            {t('presale.form.mubitikeType.label')}：{mubitikeSummary}{' '}
            {t('presale.form.deliveryType.label')}：{deliverySummary}
          </div>
        </>
      }
    />
  )
}

function PriceSummaryFromSpecs({
  form,
  t,
  common
}: {
  form: FormInstance<PresaleFormValues>
  t: (key: string, opts?: Record<string, string | number>) => string
  common: (key: string) => string
}) {
  const specifications = Form.useWatch('specifications', form) as
    | SpecificationFormItem[]
    | undefined
  const list = Array.isArray(specifications) ? specifications : []
  const unit = common('unit.jpy') || ''
  const fmtPrice = (n: number) =>
    `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}${unit}`
  const allItems: { label: string; price: number }[] = []
  list.forEach((s) => {
    if (Array.isArray(s.priceItems) && s.priceItems.length > 0) {
      s.priceItems.forEach((pi) => {
        if (
          typeof pi.price === 'number' &&
          pi.price >= 0 &&
          typeof pi.label === 'string' &&
          pi.label.trim().length > 0
        ) {
          allItems.push({ label: pi.label.trim(), price: pi.price })
        }
      })
    }
  })
  const hasPrices = allItems.length > 0
  const priceLabel = t('presale.form.price.label')
  if (list.length === 0 || !hasPrices) {
    return (
      <Form.Item label={priceLabel}>
        <Typography.Text type="secondary">
          {t('presale.form.price.setInSpecs')}
        </Typography.Text>
      </Form.Item>
    )
  }
  return (
    <Form.Item label={priceLabel}>
      <Typography.Text>
        {allItems
          .map(({ label, price }) => `${label}：${fmtPrice(price)}`)
          .join('／')}
        <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
          {t('presale.form.price.derivedHint')}
        </Typography.Text>
      </Typography.Text>
    </Form.Item>
  )
}

export interface StepBasicProps extends StepProps {
  selectedMovieLabel?: string
  onOpenMovieModal: () => void
}

export function StepBasic({
  form,
  t,
  common,
  selectedMovieLabel = '',
  onOpenMovieModal
}: StepBasicProps) {
  return (
    <Row gutter={[0, 24]}>
      <Col span={24}>
        <Card title={t('presale.form.section.basic')} size="small">
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item label={t('presale.form.code.label')} name="code">
                <Input disabled placeholder={t('presale.form.code.generated')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('presale.form.type.label')} name="type">
                <Select
                  disabled
                  options={[{ value: 'presale', label: t('presale.type.presale') }]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col xs={24} md={24}>
              <Form.Item
                label={t('presale.form.title.label')}
                name="title"
                rules={[{ required: true, message: t('presale.form.title.required') }]}
              >
                <Input placeholder={t('presale.form.title.placeholder')} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col span={24}>
              <DerivedBySpecsSummary form={form} t={t} />
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col span={24}>
              <Form.Item
                label={t('presale.form.movie.label')}
                name="movieId"
                rules={[
                  { required: true, message: t('presale.form.movie.required') }
                ]}
              >
                <Space align="center">
                  <Input
                    readOnly
                    value={selectedMovieLabel}
                    placeholder={t('presale.form.movie.placeholder')}
                    style={{ width: 200 }}
                  />
                  <Button type="primary" onClick={onOpenMovieModal}>
                    {common('button.select')}
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>
      <Col span={24}>
        <Card title={t('presale.form.section.sales')} size="small">
          <Row gutter={[24, 0]}>
            <Col xs={24} md={24}>
              <PriceSummaryFromSpecs form={form} t={t} common={common} />
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label={t('presale.form.perUserLimit.label')}
                name="perUserLimit"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={0}
                  placeholder={
                    t('presale.form.perUserLimit.placeholder') || '不填则不限制'
                  }
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  )
}
