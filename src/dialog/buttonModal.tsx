'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import { Form, Modal, Input, TreeSelect } from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import { usePermissionStore } from '@/store/usePermissionStore'
import { callTree } from '@/utils'

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
  apiCode?: string
}

export function ButtonModal(props: modalProps) {
  const { t } = useTranslation(navigator.language as languageType, 'button')
  const { t: common } = useTranslation(
    navigator.language as languageType,
    'common'
  )
  const [form] = Form.useForm()
  const [query, setQuery] = useState<Query>({})
  // const [apiData, setApiData] = useState([])
  const data = usePermissionStore((state) => state.menu)
  const getMenu = usePermissionStore((state) => state.getMenu)

  // const getApi = () => {
  //   http({
  //     url: 'admin/permission/api/list',
  //     method: 'post',
  //     data: {
  //       pageSize: 100
  //     }
  //   }).then((res) => {
  //     setApiData(res.data.list)
  //   })
  // }

  const getData = () => {
    getMenu()
    // getApi()
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
          <TreeSelect
            showSearch
            allowClear
            treeDefaultExpandAll
            treeData={callTree(data, (item) => {
              item.name = common(item.i18nKey)
            })}
            fieldNames={{
              label: 'name',
              value: 'id'
            }}
            value={query.menuId as number}
            onChange={(val) => {
              console.log(val)
              setQuery({
                ...query,
                menuId: val
              })
            }}
          ></TreeSelect>
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
          label={t('modal.form.apiCode.label')}
          rules={[
            { required: true, message: t('modal.form.apiCode.required') }
          ]}
          name="apiCode"
        >
          <Input
            value={query.apiCode}
            onChange={(e) => {
              setQuery({
                ...query,
                apiCode: e.currentTarget.value
              })
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
