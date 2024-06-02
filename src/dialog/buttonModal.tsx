'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import { Form, Modal, Input, Select } from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import { usePermissionStore } from '@/store/usePermissionStore'

interface modalProps {
  type: 'create' | 'edit'
  show?: boolean
  data: Record<string, any>
  onConfirm?: () => void
  onCancel?: () => void
}

interface Query {
  menuId?: number
  id?: number
  i18nKey?: string
  name?: string
  code?: string
  apiId?: number
}

export function ButtonModal(props: modalProps) {
  const { t } = useTranslation(navigator.language as languageType, 'button')
  const [form] = Form.useForm()
  const [query, setQuery] = useState<Query>({})
  const [apiData, setApiData] = useState([])
  const data = usePermissionStore((state) => state.menu)
  const getMenu = usePermissionStore((state) => state.getMenu)

  const getApi = () => {
    http({
      url: 'admin/permission/api/list',
      method: 'post',
      data: {
        pageSize: 100
      }
    }).then((res) => {
      setApiData(res.data.list)
    })
  }

  const getData = () => {
    getMenu(true)
    getApi()
  }
  useEffect(() => {
    if (props.show) {
      form.resetFields()
      getData()
    }
    form.setFieldsValue(props.data)
    setQuery(props.data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.show, props.data])

  return (
    <Modal
      title={
        props.type === 'edit' ? t('modal.title.edit') : t('modal.title.create')
      }
      open={props.show}
      maskClosable={false}
      onOk={() => {
        form.validateFields().then(() => {
          http({
            url: 'admin/permission/button/save',
            method: 'post',
            data: {
              ...query
            }
          }).then(() => {
            props?.onConfirm?.()
          })
        })
      }}
      onCancel={props?.onCancel}
    >
      <Form
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        form={form}
      >
        <Form.Item label={t('modal.form.menuId.label')} name="menuId">
          <Select
            value={query.menuId}
            onChange={(val) => {
              setQuery({
                ...query,
                menuId: val
              })
            }}
          >
            {data.map((item: any) => {
              return (
                <Select.Option value={item.id} key={item.id}>
                  {item.name}
                </Select.Option>
              )
            })}
          </Select>
        </Form.Item>
        <Form.Item label={t('modal.form.apiId.label')} name="apiId">
          <Select
            value={query.apiId}
            onChange={(val) => {
              setQuery({
                ...query,
                apiId: val
              })
            }}
          >
            {apiData.map((item: any) => {
              return (
                <Select.Option value={item.id} key={item.id}>
                  {item.name}
                </Select.Option>
              )
            })}
          </Select>
        </Form.Item>
        <Form.Item
          label={t('modal.form.i18nKey.label')}
          rules={[
            { required: true, message: t('modal.form.i18nKey.required') }
          ]}
          name="i18nKey"
        >
          <Input
            value={query.i18nKey}
            onChange={(e) => {
              setQuery({
                ...query,
                i18nKey: e.currentTarget.value
              })
            }}
          />
        </Form.Item>
        <Form.Item
          label={t('modal.form.name.label')}
          rules={[{ required: true, message: t('modal.form.name.required') }]}
          name="name"
        >
          <Input
            value={query.name}
            onChange={(e) => {
              setQuery({
                ...query,
                name: e.currentTarget.value
              })
            }}
          />
        </Form.Item>
        <Form.Item
          label={t('modal.form.code.label')}
          rules={[{ required: true, message: t('modal.form.code.required') }]}
          name="code"
        >
          <Input
            value={query.code}
            onChange={(e) => {
              setQuery({
                ...query,
                code: e.currentTarget.value
              })
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
