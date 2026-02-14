'use client'
import React, { useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import { Form, Modal, InputNumber } from 'antd'
import http from '@/api'
import { DictCode } from '@/enum/dict'
import { DictSelect } from '@/components/DictSelect'
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

  useEffect(() => {
    if (props.show) {
      form.resetFields()
    }
    form.setFieldsValue(props.data)
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
          <DictSelect
            code={DictCode.DIMENSION_TYPE}
            placeholder={t('priceConfig.modal.form.displayType.placeholder')}
            disabled={props.type === 'edit'}
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
            precision={0}
            min={0}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
