'use client'
import React, { useState, useEffect } from 'react'
import { Modal, Input, Button, Space, Table, TableColumnsType, Tag } from 'antd'
import { useTranslation } from '@/app/i18n/client'
import { languageType, notFoundImage } from '@/config'
import { CharacterModal } from './characterModal'
import { useCommonStore } from '@/store/useCommonStore'
import { character } from '@/type/api'
import { CustomAntImage } from '@/components/CustomAntImage'

interface ModalProps {
  show?: boolean
  selectedIds?: number[]
  onConfirm?: (result: character) => void
  onCancel?: () => void
}

export function SelectCharacterModal(props: Readonly<ModalProps>) {
  const { t } = useTranslation(
    navigator.language as languageType,
    'movieDetail'
  )
  const store = useCommonStore()
  const [characterModal, setCharacterModal] = useState({
    type: 'create',
    show: false,
    data: {}
  })

  const [searchName, setSearchName] = useState('')
  const [selectedCharacter, setSelectedCharacter] = useState<character | null>(
    null
  )

  const columns: TableColumnsType<character> = [
    {
      title: t('character.table.cover'),
      dataIndex: 'cover',
      width: 100,
      render(cover) {
        return (
          <CustomAntImage
            width={60}
            src={cover}
            fallback={notFoundImage}
            placeholder={true}
            style={{
              borderRadius: '4px'
            }}
          />
        )
      }
    },
    {
      title: t('character.table.name'),
      dataIndex: 'name',
      render: (name: string, record) => {
        const isExisting = props.selectedIds?.includes(record.id)
        return (
          <Space>
            <span>{name}</span>
            {isExisting && (
              <Tag color="green">{t('character.modal.form.alreadyAdded')}</Tag>
            )}
          </Space>
        )
      }
    }
  ]

  const handleSearch = () => {
    store.getCharacterList({
      name: searchName
    })
  }

  useEffect(() => {
    if (props.show) {
      setSelectedCharacter(null)
      setSearchName('')
    }

    store.getCharacterList({
      name: ''
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.show])

  return (
    <Modal
      title={t('character.select')}
      open={props.show}
      maskClosable={false}
      width={600}
      onOk={() => {
        if (!selectedCharacter) {
          return
        }
        props.onConfirm?.(selectedCharacter)
      }}
      onCancel={props?.onCancel}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Space>
            <Input
              placeholder={t('character.modal.form.searchPlaceholder')}
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 250 }}
            />
            <Button type="primary" onClick={handleSearch}>
              {t('character.modal.button.search')}
            </Button>
          </Space>
          <Button
            onClick={() => {
              setCharacterModal({
                ...characterModal,
                show: true
              })
            }}
          >
            {t('character.modal.button.addCharacter')}
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={store.characterList}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 5 }}
          scroll={{ y: 300 }}
          rowSelection={{
            type: 'radio',
            selectedRowKeys: selectedCharacter ? [selectedCharacter.id] : [],
            onChange: (_, selectedRows) => {
              if (selectedRows.length > 0) {
                setSelectedCharacter(selectedRows[0])
              }
            }
          }}
          onRow={(record) => {
            const isExisting = props.selectedIds?.includes(record.id)
            return {
              onClick: () => {
                setSelectedCharacter(record)
              },
              style: {
                cursor: 'pointer',
                backgroundColor: isExisting ? '#f6ffed' : undefined
              }
            }
          }}
        />
      </Space>
      <CharacterModal
        type={characterModal.type as 'create' | 'edit'}
        show={characterModal.show}
        data={characterModal.data}
        onCancel={() => {
          setCharacterModal({
            ...characterModal,
            show: false
          })
        }}
        onConfirm={() => {
          setCharacterModal({
            ...characterModal,
            show: false
          })
          store.getCharacterList({
            name: searchName
          })
        }}
      ></CharacterModal>
    </Modal>
  )
}
