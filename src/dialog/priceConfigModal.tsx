'use client'
import React, { useEffect, useState } from 'react'
import { useTranslation } from '@/app/i18n/client'
import { Form, Modal, InputNumber, Select } from 'antd'
import http from '@/api'
import { useCommonStore } from '@/store/useCommonStore'
import { DictCode } from '@/enum/dict'
import { languageType } from '@/config'
import { useSearchParams } from 'next/navigation'

interface ModalProps {
  type: 'create' | 'edit'
  show?: boolean
  data: Record<string, unknown>
  onConfirm?: () => void
  onCancel?: () => void
}

export function PriceConfigModal(props: ModalProps) {
  const { t } = useTranslation(
    (navigator.language as languageType) || 'ja',
    'ticketType'
  )
  const [form] = Form.useForm()
  const searchParams = useSearchParams()
  const dict = useCommonStore((state) => state.dict)
  const [query, setQuery] = useState<{
    dimensionType?: number
    surcharge?: number
  }>({})

  const displayTypes = dict[DictCode.DIMENSION_TYPE] || []

  useEffect(() => {
    if (props.show) {
      form.resetFields()
    }
    form.setFieldsValue(props.data)
    setQuery(props.data as { dimensionType?: number; surcharge?: number })
  }, [props.show, props.data, form])

  return (
    <Modal
      title={
        props.type === 'edit'
          ? t('priceConfig.modal.title.edit')
          : t('priceConfig.modal.title.create')
      }
      open={props.show}
      maskClosable={false}
      onOk={() => {
        form.validateFields().then((values) => {
          http({
            url: 'admin/cinema/priceConfig/save',
            method: 'post',
            data: {
              ...values,
              id: props.data?.id,
              cinemaId: +(searchParams.get('id') || 0)
            }
          }).then(() => {
            props?.onConfirm?.()
          })
        })
      }}
      onCancel={props?.onCancel}
    >
      <Form
        name="priceConfig"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        form={form}
      >
        <Form.Item
          label={t('priceConfig.modal.form.displayType.label')}
          rules={[
            { required: true, message: t('priceConfig.modal.form.displayType.required') }
          ]}
          name="dimensionType"
        >
          <Select
            placeholder={t('priceConfig.modal.form.displayType.placeholder')}
            value={query.dimensionType}
            onChange={(val) => setQuery({ ...query, dimensionType: val })}
            disabled={props.type === 'edit'}
            options={displayTypes.map((item: { id: number; code: number; name: string }) => ({
              value: item.code,
              label: item.name
            }))}
          />
        </Form.Item>
        <Form.Item
          label={t('priceConfig.modal.form.surcharge.label')}
          rules={[
            { required: true, message: t('priceConfig.modal.form.surcharge.required') }
          ]}
          name="surcharge"
        >
          <InputNumber
            style={{ width: '100%' }}
            value={query.surcharge}
            precision={0}
            min={0}
            onChange={(val) => setQuery({ ...query, surcharge: val as number })}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
