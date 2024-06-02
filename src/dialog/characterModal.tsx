'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import { Form, Modal, Input, Select } from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import { Upload } from '@/components/upload/Upload'

interface modalProps {
  type: 'create' | 'edit'
  show?: boolean
  data: Record<string, any>
  onConfirm?: () => void
  onCancel?: () => void
}

interface Query {
  id?: number
  cover?: string
  name?: string
  originalName?: string
  description?: string
  staffId?: number[]
  movieId?: number
}

export function CharacterModal(props: modalProps) {
  const [staff, setStaffData] = useState([])
  const { t } = useTranslation(navigator.language as languageType, 'character')
  const [form] = Form.useForm()
  const [query, setQuery] = useState<Query>({
    staffId: []
  })

  const getStaffData = (name = '', id = []) => {
    http({
      url: 'staff/list',
      method: 'post',
      data: {
        page: 1,
        pageSize: 10,
        name,
        id
      }
    }).then((res) => {
      setStaffData(res.data.list)
    })
  }

  useEffect(() => {
    if (props.show) {
      form.resetFields()
      getStaffData()
    }

    if (props.data.id) {
      const staffId = props.data?.staff?.map((item: any) => item.id)
      form.setFieldsValue({
        ...props.data,
        staffId
      })
      setQuery({
        ...props.data,
        staffId
      })
      getStaffData('', staffId)
    } else {
      setQuery({
        ...props.data,
        staffId: []
      })
      form.setFieldsValue({
        ...props.data,
        staffId: []
      })
      // getStaffData()
    }
    console.log(props.data, query)

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
            url: 'admin/character/save',
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
        <Form.Item
          label={t('modal.form.cover.label')}
          rules={[{ required: false, message: t('modal.form.cover.required') }]}
          name="cover"
        >
          <Upload
            value={query.cover || ''}
            crop={true}
            options={{
              aspectRatio: 160 / 190
            }}
            onChange={(val) => {
              setQuery({
                ...query,
                cover: val
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
          label={t('modal.form.originalName.label')}
          rules={[
            { required: true, message: t('modal.form.originalName.required') }
          ]}
          name="originalName"
        >
          <Input
            value={query.originalName}
            onChange={(e) => {
              setQuery({
                ...query,
                originalName: e.currentTarget.value
              })
            }}
          />
        </Form.Item>
        <Form.Item
          label={t('modal.form.description.label')}
          rules={[
            { required: true, message: t('modal.form.description.required') }
          ]}
          name="description"
        >
          <Input.TextArea
            value={query.description}
            onChange={(e) => {
              setQuery({
                ...query,
                description: e.currentTarget.value
              })
            }}
          />
        </Form.Item>
        <Form.Item
          label={t('modal.form.staffId.label')}
          rules={[
            { required: true, message: t('modal.form.staffId.required') }
          ]}
          name="staffId"
        >
          <Select
            mode="multiple"
            allowClear
            showSearch
            style={{ width: '100%' }}
            placeholder={t('modal.form.staffId.required')}
            defaultValue={query.staffId}
            onChange={(val) => {
              setQuery({
                ...query,
                staffId: val
              })
            }}
            onSearch={getStaffData}
          >
            {staff.map((item: any) => {
              return (
                <Select.Option value={item.id} key={item.id}>
                  {item.name}
                </Select.Option>
              )
            })}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  )
}
