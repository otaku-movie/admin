'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import { Form, Modal, Input, Select, Switch, TreeSelect } from 'antd'
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
  parentId?: number
  id?: number
  i18nKey?: string
  name?: string
  path?: string
  pathName?: string
  show?: boolean
}

export function MenuModal(props: modalProps) {
  const { t } = useTranslation(navigator.language as languageType, 'menu')
  const { t: common } = useTranslation(navigator.language as languageType, 'common')
  const [form] = Form.useForm()
  const [query, setQuery] = useState<Query>({})
  const data = usePermissionStore((state) => state.menu)
  const getMenu = usePermissionStore((state) => state.getMenu)

  const getData = () => {
    getMenu()
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
            url: 'admin/permission/menu/save',
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
        <Form.Item label={t('modal.form.parentId.label')} name="parentId">
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
            value={query.parentId as number}
            onChange={(val) => {
              console.log(val)
              setQuery({
                ...query,
                parentId: val
              })
            }}
          ></TreeSelect>
        </Form.Item>
        {/* <Form.Item
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
        </Form.Item> */}
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
          label={t('modal.form.path.label')}
          rules={[{ required: true, message: t('modal.form.path.required') }]}
          name="path"
        >
          <Input
            value={query.path}
            onChange={(e) => {
              setQuery({
                ...query,
                path: e.currentTarget.value
              })
            }}
          />
        </Form.Item>
        <Form.Item
          label={t('modal.form.pathName.label')}
          rules={[
            { required: true, message: t('modal.form.pathName.required') }
          ]}
          name="pathName"
        >
          <Input
            value={query.pathName}
            onChange={(e) => {
              setQuery({
                ...query,
                pathName: e.currentTarget.value
              })
            }}
          />
        </Form.Item>
        <Form.Item label={t('modal.form.show.label')} name="show">
          <Switch
            value={query.show}
            onChange={(val) => {
              setQuery({
                ...query,
                show: val
              })
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
