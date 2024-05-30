'use client'
import React, { useState, useEffect } from 'react'
import { Form, Modal, Select, Button, Space } from 'antd'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'
import { PositionModal } from './positionModal'
import { StaffModal } from './staffModal'
import { useCommonStore } from '@/store/useCommonStore'
import { staff } from '@/type/api'

export interface movieStaff {
  id: number
  name: string
  staff: staff[]
}

interface Query {
  positionId?: number
  staffId?: number[]
}

interface modalProps {
  show?: boolean
  data: Query
  onConfirm?: (result: movieStaff) => void
  onCancel?: () => void
}

export function SelectStaffModal(props: modalProps) {
  const { t } = useTranslation(
    navigator.language as languageType,
    'movieDetail'
  )
  const store = useCommonStore()
  const [positionModal, setPositionModal] = useState({
    type: 'create',
    show: false,
    data: {}
  })
  const [staffModal, setStaffModal] = useState({
    type: 'create',
    show: false,
    data: {}
  })

  const [form] = Form.useForm()
  const [query, setQuery] = useState<Query>({
    staffId: []
  })

  useEffect(() => {
    if (props.show) {
      form.resetFields()
      setQuery(props.data)
    }

    if (props.data?.positionId) {
      setQuery(props.data)

      store.getPositionList({
        name: '',
        id: props.data.positionId
      })
      store.getStaffList({
        name: '',
        id: props.data.staffId
      })
    } else {
      store.getStaffList({
        name: ''
      })
      store.getPositionList({
        name: ''
      })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.show, props.data])

  return (
    <Modal
      title={t('staff.select')}
      open={props.show}
      maskClosable={false}
      onOk={() => {
        form.setFieldsValue(query)
        form.validateFields().then(() => {
          store
            .getStaffList({
              id: query.staffId
            })
            .then((data) => {
              const find = store.positionList.find(
                (item) => item.id === query.positionId
              )

              props.onConfirm?.({
                id: find!.id,
                name: find!.name,
                staff: data
              })
            })
        })
      }}
      onCancel={props?.onCancel}
    >
      <Form
        name="basic"
        labelCol={{ span: 4 }}
        style={{ maxWidth: 600 }}
        form={form}
      >
        <Form.Item
          label={t('staff.modal.form.position.label')}
          rules={[
            { required: true, message: t('staff.modal.form.position.required') }
          ]}
          name="positionId"
        >
          <Space
            style={{
              display: 'flex'
              // width: '100vw'
            }}
          >
            <Select
              showSearch
              allowClear
              value={query.positionId}
              style={{
                width: '250px'
              }}
              onClear={store.getPositionList}
              onChange={(val) => {
                setQuery({
                  ...query,
                  positionId: val
                })
              }}
              onSearch={(val) => {
                store.getPositionList({
                  name: val
                })
              }}
            >
              {store.positionList.map((item: any) => {
                return (
                  <Select.Option value={item.id} key={item.id}>
                    {item.name}
                  </Select.Option>
                )
              })}
            </Select>
            <Button
              type="primary"
              onClick={() => {
                setPositionModal({
                  ...positionModal,
                  show: true
                })
              }}
            >
              {t('staff.modal.button.addPosition')}
            </Button>
          </Space>
        </Form.Item>
        <Form.Item
          label={t('staff.modal.form.staff.label')}
          rules={[
            { required: true, message: t('staff.modal.form.staff.required') }
          ]}
          name="staffId"
        >
          <Space
            style={{
              display: 'flex'
            }}
          >
            <Select
              showSearch
              mode="multiple"
              maxTagCount="responsive"
              style={{
                width: '250px'
              }}
              value={query.staffId}
              allowClear
              onClear={store.getStaffList}
              onChange={(val) => {
                setQuery({
                  ...query,
                  staffId: val
                })
              }}
              onSearch={(val) => {
                store.getStaffList({
                  name: val
                })
              }}
            >
              {store.staffList.map((item: any) => {
                return (
                  <Select.Option value={item.id} key={item.id}>
                    {item.name}
                  </Select.Option>
                )
              })}
            </Select>
            <Button
              type="primary"
              onClick={() => {
                setStaffModal({
                  ...positionModal,
                  show: true
                })
              }}
            >
              {t('staff.modal.button.addStaff')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
      <PositionModal
        type={positionModal.type as 'create' | 'edit'}
        show={positionModal.show}
        data={positionModal.data}
        onCancel={() => {
          setPositionModal({
            ...positionModal,
            show: false
          })
        }}
        onConfirm={() => {
          setPositionModal({
            ...positionModal,
            show: false
          })
          store.getPositionList()
        }}
      ></PositionModal>
      <StaffModal
        type={staffModal.type as 'create' | 'edit'}
        show={staffModal.show}
        data={staffModal.data}
        onCancel={() => {
          setStaffModal({
            ...staffModal,
            show: false
          })
        }}
        onConfirm={() => {
          setStaffModal({
            ...staffModal,
            show: false
          })
          store.getStaffList()
        }}
      ></StaffModal>
    </Modal>
  )
}
