'use client'
import React, { useState, useEffect } from 'react'
import {
  Modal,
  Input,
  Button,
  Space,
  Table,
  TableColumnsType,
  message
} from 'antd'
import { useTranslation } from '@/app/i18n/client'
import { languageType, notFoundImage } from '@/config'
import { StaffModal } from './staffModal'
import { useCommonStore } from '@/store/useCommonStore'
import { staff } from '@/type/api'
import { CustomAntImage } from '@/components/CustomAntImage'

interface ModalProps {
  show?: boolean
  // 已选择的工作人员ID列表（用于过滤）
  selectedIds?: number[]
  onConfirm?: (selectedStaff: staff[]) => void
  onCancel?: () => void
}

export function SelectStaffModal(props: Readonly<ModalProps>) {
  const { t } = useTranslation(
    navigator.language as languageType,
    'movieDetail'
  )
  const store = useCommonStore()
  const [staffModal, setStaffModal] = useState({
    type: 'create',
    show: false,
    data: {}
  })

  const [staffSearchName, setStaffSearchName] = useState('')
  // 已选择的工作人员（多选）
  const [selectedStaffList, setSelectedStaffList] = useState<staff[]>([])

  // 工作人员表格列
  const staffColumns: TableColumnsType<staff> = [
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
      dataIndex: 'name'
    }
  ]

  const handleStaffSearch = () => {
    store.getStaffList({ name: staffSearchName })
  }

  useEffect(() => {
    if (props.show) {
      setSelectedStaffList([])
      setStaffSearchName('')
      store.getStaffList({ name: '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.show])

  const handleConfirm = () => {
    if (selectedStaffList.length === 0) {
      message.warning(t('staff.modal.form.staff.required'))
      return
    }
    props.onConfirm?.(selectedStaffList)
  }

  // 过滤掉已选择的工作人员
  const filteredStaffList = store.staffList.filter(
    (s) => !props.selectedIds?.includes(s.id)
  )

  return (
    <Modal
      title={t('staff.select')}
      open={props.show}
      maskClosable={false}
      width={600}
      onOk={handleConfirm}
      onCancel={props?.onCancel}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        {/* 搜索和添加工作人员 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Space>
            <Input
              placeholder={t('staff.modal.form.searchPlaceholder')}
              value={staffSearchName}
              onChange={(e) => setStaffSearchName(e.target.value)}
              onPressEnter={handleStaffSearch}
              style={{ width: 200 }}
            />
            <Button type="primary" onClick={handleStaffSearch}>
              {t('staff.modal.button.search')}
            </Button>
          </Space>
          <Button
            onClick={() => {
              setStaffModal({ ...staffModal, show: true })
            }}
          >
            {t('staff.modal.button.addStaff')}
          </Button>
        </div>

        {/* 工作人员列表 */}
        <Table
          columns={staffColumns}
          dataSource={filteredStaffList}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 8 }}
          scroll={{ y: 400 }}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedStaffList.map((s) => s.id),
            onChange: (_, selectedRows) => {
              setSelectedStaffList(selectedRows)
            }
          }}
        />

        {selectedStaffList.length > 0 && (
          <div style={{ color: '#1677ff' }}>
            {t('staff.modal.form.selected')}: {selectedStaffList.length}
          </div>
        )}
      </Space>

      <StaffModal
        type={staffModal.type as 'create' | 'edit'}
        show={staffModal.show}
        data={staffModal.data}
        onCancel={() => {
          setStaffModal({ ...staffModal, show: false })
        }}
        onConfirm={() => {
          setStaffModal({ ...staffModal, show: false })
          store.getStaffList({ name: staffSearchName })
        }}
      />
    </Modal>
  )
}
