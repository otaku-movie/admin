'use client'
import React, { useState, useEffect } from 'react'
import { Modal, Input, Button, Space, Table, Tag, TableColumnsType } from 'antd'
import { useTranslation } from '@/app/i18n/client'
import { languageType, notFoundImage } from '@/config'
import { useCommonStore } from '@/store/useCommonStore'
import { staff } from '@/type/api'
import { CustomAntImage } from '@/components/CustomAntImage'

interface ModalProps {
  show?: boolean
  selectedStaff?: staff[]
  onConfirm?: (result: staff[]) => void
  onCancel?: () => void
}

export function SelectActorModal(props: Readonly<ModalProps>) {
  const { t } = useTranslation(
    navigator.language as languageType,
    'movieDetail'
  )
  const store = useCommonStore()

  const [searchName, setSearchName] = useState('')
  const [selectedStaff, setSelectedStaff] = useState<staff[]>([])

  const columns: TableColumnsType<staff> = [
    {
      title: t('staff.table.cover'),
      dataIndex: 'cover',
      width: 80,
      render(cover) {
        return (
          <CustomAntImage
            width={50}
            src={cover}
            fallback={notFoundImage}
            placeholder={true}
            style={{ borderRadius: '4px' }}
          />
        )
      }
    },
    {
      title: t('staff.table.name'),
      dataIndex: 'name',
      render: (name: string, record) => {
        const isSelected = selectedStaff.some((s) => s.id === record.id)
        return (
          <Space>
            <span>{name}</span>
            {isSelected && (
              <Tag color="green">{t('character.modal.form.alreadyAdded')}</Tag>
            )}
          </Space>
        )
      }
    }
  ]

  const handleSearch = () => {
    store.getStaffList({ name: searchName })
  }

  useEffect(() => {
    if (props.show) {
      setSelectedStaff(props.selectedStaff || [])
      setSearchName('')
      store.getStaffList({ name: '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.show])

  const handleConfirm = () => {
    props.onConfirm?.(selectedStaff)
  }

  return (
    <Modal
      title={t('character.modal.selectStaff.title')}
      open={props.show}
      maskClosable={false}
      width={700}
      onOk={handleConfirm}
      onCancel={props?.onCancel}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        <Space>
          <Input
            placeholder={t('staff.modal.form.searchPlaceholder')}
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
          />
          <Button type="primary" onClick={handleSearch}>
            {t('staff.modal.button.search')}
          </Button>
        </Space>
        <Table
          columns={columns}
          dataSource={store.staffList}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 5 }}
          scroll={{ y: 300 }}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedStaff.map((s) => s.id),
            onChange: (_, selectedRows) => {
              setSelectedStaff(selectedRows)
            }
          }}
          onRow={(record) => {
            const isSelected = selectedStaff.some((s) => s.id === record.id)
            return {
              onClick: () => {
                // 点击行切换选中状态
                if (isSelected) {
                  setSelectedStaff((prev) =>
                    prev.filter((s) => s.id !== record.id)
                  )
                } else {
                  setSelectedStaff((prev) => [...prev, record])
                }
              },
              style: {
                cursor: 'pointer',
                backgroundColor: isSelected ? '#f6ffed' : undefined
              }
            }
          }}
        />
      </Space>
    </Modal>
  )
}

