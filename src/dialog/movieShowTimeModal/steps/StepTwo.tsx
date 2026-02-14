'use client'

import React from 'react'
import { Form, Select, Switch, InputNumber } from 'antd'
import { DictSelect } from '@/components/DictSelect'
import { DictCode } from '@/enum/dict'
import type { MovieShowTimeStepContext } from '../types'

interface StepTwoProps {
  ctx: MovieShowTimeStepContext
}

export function StepTwo({ ctx }: StepTwoProps) {
  const {
    query,
    setQuery,
    t,
    common,
    getPromotionListForCinema,
    promotionList
  } = ctx

  return (
    <>
      <Form.Item label={t('showTimeModal.form.pricingMode.label')} name="pricingMode">
        <DictSelect
          code={DictCode.PRICING_MODE}
          value={query.pricingMode}
          onChange={(val) => {
            setQuery({
              ...query,
              pricingMode: val,
              activityId: val === 1 ? query.activityId : undefined,
              fixedAmount: val === 2 ? query.fixedAmount : undefined
            })
          }}
          style={{ width: 200 }}
        />
      </Form.Item>
      <Form.Item label={t('showTimeModal.form.activity.label')} name="activityId">
        <Select
          allowClear
          showSearch
          style={{ width: 200 }}
          placeholder={t('showTimeModal.form.activity.placeholder')}
          value={query.activityId}
          disabled={query.pricingMode !== 1 || !query.cinemaId}
          onFocus={() => {
            if (query.cinemaId) getPromotionListForCinema(query.cinemaId)
          }}
          onChange={(val) => setQuery({ ...query, activityId: val })}
          options={promotionList.map((p) => ({ value: p.id, label: p.name }))}
        />
      </Form.Item>
      <Form.Item label={t('showTimeModal.form.fixedAmount.label')} name="fixedAmount">
        <InputNumber
          style={{ width: 200 }}
          min={0}
          precision={0}
          step={100}
          value={query.fixedAmount}
          placeholder={t('showTimeModal.form.fixedAmount.placeholder')}
          onChange={(val) => setQuery({ ...query, fixedAmount: val ?? undefined })}
          addonAfter={common('unit.jpy')}
          disabled={query.pricingMode !== 2}
        />
      </Form.Item>
      <Form.Item label={t('showTimeModal.form.surcharge.label')} name="surcharge">
        <InputNumber
          style={{ width: 200 }}
          min={0}
          precision={0}
          step={100}
          value={query.surcharge}
          placeholder={t('showTimeModal.form.surcharge.placeholder')}
          onChange={(val) => setQuery({ ...query, surcharge: val ?? undefined })}
          addonAfter={common('unit.jpy')}
        />
      </Form.Item>
      <Form.Item label={t('showTimeModal.form.allowPresale.label')}>
        <Switch
          checked={query.allowPresale}
          onChange={(val) => setQuery({ ...query, allowPresale: val })}
        />
      </Form.Item>
      <Form.Item label={t('showTimeModal.form.open.label')}>
        <Switch
          value={query.open}
          onChange={(val) => setQuery({ ...query, open: val })}
        />
      </Form.Item>
      <Form.Item label={t('showTimeModal.form.price.label')} name="price">
        <InputNumber
          style={{ width: 200 }}
          min={0}
          precision={0}
          step={100}
          value={query.price}
          placeholder={t('showTimeModal.form.price.placeholder')}
          onChange={(val) => setQuery({ ...query, price: val ?? undefined })}
          addonAfter={common('unit.jpy')}
        />
      </Form.Item>
    </>
  )
}
