'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import { Form, Modal, Checkbox } from 'antd'
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
  roleId?: number[]
}

export function ConfigUserRoleModal(props: ModalProps) {
  const { t } = useTranslation(navigator.language as languageType, 'user')
  const [form] = Form.useForm()
  const [query, setQuery] = useState<Query>({})
  const [roleList, setRoleList] = useState<role[]>([])

  const getData = (page = 1) => {
    http({
      url: 'admin/permission/role/list',
      method: 'post',
      data: {
        page,
        pageSize: 10,
        ...query
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
      form.setFieldsValue(props.data)
      setQuery(props.data)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.show, props.data])

  

  return (
    <Modal
      title={t('button.configRole')}
      open={props.show}
      maskClosable={false}
      onOk={() => {
        form.validateFields().then(() => {
          http({
            url: 'admin/user/configRole',
            method: 'post',
            data: {
              ...query
            }
          }).then(() => {
            if (query.id === getUserInfo().id) {
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
              type: 'array',
              message: t('modal.form.role.required')
            }
          ]}
        >
          <Checkbox.Group
            options={roleList.map(item => {
              return {
                label: item.name,
                value: item.id
              }
            })}
            value={query.roleId}
            onChange={(val) => {
              setQuery({
                ...query,
                roleId: val
              })
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
