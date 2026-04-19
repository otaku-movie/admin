'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import { Form, Modal, Radio } from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import { role, user } from '@/type/api'
import { getUserInfo } from '@/utils'

interface ModalProps {
  type: 'create' | 'edit'
  show?: boolean
  data: Partial<user>
  onConfirm?: () => void
  onCancel?: () => void
}

interface Query {
  id?: number
  /** 单选角色 ID；提交时转为数组传给接口 */
  roleId?: number
}

export function ConfigUserRoleModal(props: ModalProps) {
  const { t } = useTranslation(navigator.language as languageType, 'user')
  const { t: common } = useTranslation(
    navigator.language as languageType,
    'common'
  )
  const [form] = Form.useForm()
  const [query, setQuery] = useState<Query>({})
  const [roleList, setRoleList] = useState<role[]>([])

  const getData = (page = 1) => {
    http({
      url: 'admin/permission/role/list',
      method: 'post',
      data: {
        page,
        pageSize: 200
      }
    }).then((res) => {
      setRoleList(res.data.list)
    })
  }

  useEffect(() => {
    if (props.show) {
      form.resetFields()
      getData()
    }
    if (props.data?.id) {
      const raw = props.data.roleId as number | number[] | undefined
      const single = Array.isArray(raw) ? raw[0] : raw
      const next: Query = { id: props.data.id, roleId: single }
      form.setFieldsValue({ roleId: single })
      setQuery(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.show, props.data])

  

  return (
    <Modal
      title={common('button.configRole')}
      open={props.show}
      maskClosable={false}
      onOk={() => {
        form.validateFields().then(() => {
          http({
            url: 'admin/user/configRole',
            method: 'post',
            data: {
              id: query.id,
              roleId:
                query.roleId != null && query.roleId !== undefined
                  ? [query.roleId]
                  : []
            }
          }).then(() => {
            const me = getUserInfo() as { id?: number }
            if (query.id != null && me.id === query.id) {
              location.reload()
            }
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
        <Form.Item
          label={t('modal.form.role.label')}
          name="roleId"
          rules={[
            {
              required: true,
              message: t('modal.form.role.required')
            }
          ]}
        >
          <Radio.Group
            options={roleList.map((item) => ({
              label: item.name,
              value: item.id
            }))}
            value={query.roleId}
            onChange={(e) => {
              const v = e.target.value as number
              setQuery((q) => ({
                ...q,
                roleId: v
              }))
              form.setFieldValue('roleId', v)
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
