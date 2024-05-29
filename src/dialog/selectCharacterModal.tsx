'use client'
import React, { useState, useEffect } from 'react'
import { Form, Modal, Select, Button, Space } from 'antd'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'
import { CharacterModal } from './characterModal'
import { commonStore } from '@/store/commonStore'
import { character } from '@/type/api'

// export interface movieCharacter {
//   id: number
//   name: string
//   character: character
// }

interface Query {
  characterId?: number
}

interface modalProps {
  show?: boolean
  data: Query
  onConfirm?: (result: character) => void
  onCancel?: () => void
}

export function SelectCharacterModal(props: modalProps) {
  const { t } = useTranslation(
    navigator.language as languageType,
    'movieDetail'
  )
  const store = commonStore()
  const [characterModal, setCharacterModal] = useState({
    type: 'create',
    show: false,
    data: {}
  })

  const [form] = Form.useForm()
  const [query, setQuery] = useState<Query>({})

  useEffect(() => {
    if (props.show) {
      form.resetFields()
      setQuery(props.data)
    }

    if (props.data?.characterId) {
      setQuery(props.data)

      store.getCharacterList({
        name: '',
        id: [props.data.characterId]
      })
    } else {
      store.getCharacterList({
        name: ''
      })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.show, props.data])


  return (
    <Modal
      title={t('character.select')}
      open={props.show}
      maskClosable={false}
      onOk={() => {
        console.log(query)
        form.setFieldsValue(query)
        form.validateFields().then(() => {
          store
            .getCharacterList({
              id: [query.characterId as number]
            })
            .then((data) => {

              props.onConfirm?.(data[0])
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
          label={t('character.modal.form.character.label')}
          rules={[
            { required: true, message: t('character.modal.form.character.required') }
          ]}
          name="characterId"
        >
          <Space
            style={{
              display: 'flex'
            }}
          >
            <Select
              showSearch
              maxTagCount="responsive"
              style={{
                width: '250px'
              }}
              value={query.characterId}
              allowClear
              onClear={store.getCharacterList}
              onChange={(val) => {
                setQuery({
                  ...query,
                  characterId: val
                })
              }}
              onSearch={(val) => {
                store.getCharacterList({
                  name: val
                })
              }}
            >
              {store.characterList.map((item: any) => {
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
                setCharacterModal({
                  ...characterModal,
                  show: true
                })
              }}
            >
              {t('character.modal.button.addCharacter')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
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
          store.getPositionList()
        }}
      ></CharacterModal>
    </Modal>
  )
}
