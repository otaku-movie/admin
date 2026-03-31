'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '@/app/i18n/client'
import {
  Form,
  Modal,
  Input,
  Switch,
  TreeSelect,
  Space,
  Tag,
  Divider,
  Button,
  Row,
  message
} from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import { usePermissionStore } from '@/store/usePermissionStore'
import { callTree } from '@/utils'
import { CheckPermission } from '@/components/checkPermission'
import { ButtonModal } from '@/dialog/buttonModal'

type PageButtonRow = { id: number; i18nKey: string; apiCode: string }

interface modalProps {
  type: 'create' | 'edit'
  show?: boolean
  data: Record<string, any>
  lng: languageType
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

function extractButtonsForMenu (
  nodes: any[] | null | undefined,
  menuId: number
): PageButtonRow[] {
  if (!Array.isArray(nodes)) return []
  for (const n of nodes) {
    const mid = Number(n?.id)
    if (mid === menuId) {
      if (!Array.isArray(n.button)) return []
      return n.button
        .filter((b: any) => b && b.id != null)
        .map((b: any) => ({
          id: b.id,
          i18nKey: b.i18nKey,
          apiCode: b.apiCode
        }))
    }
    const nested = extractButtonsForMenu(n.children, menuId)
    if (nested.length) return nested
  }
  return []
}

export function MenuModal (props: modalProps) {
  const { lng } = props
  const { t } = useTranslation(lng, 'menu')
  const { t: common } = useTranslation(lng, 'common')
  const [form] = Form.useForm()
  const [query, setQuery] = useState<Query>({})
  const data = usePermissionStore(state => state.menu)
  const getMenu = usePermissionStore(state => state.getMenu)

  const [menuButtons, setMenuButtons] = useState<PageButtonRow[]>([])
  const [buttonModal, setButtonModal] = useState<{
    open: boolean
    type: 'create' | 'edit'
    data: Record<string, any>
  }>({ open: false, type: 'create', data: {} })

  const loadMenuButtons = useCallback((menuId: number) => {
    if (!menuId) {
      setMenuButtons([])
      return
    }
    http({
      url: 'admin/permission/button/list',
      method: 'post',
      data: {}
    }).then((res: any) => {
      setMenuButtons(extractButtonsForMenu(res.data, menuId))
    })
  }, [])

  const currentMenuName =
    (query.i18nKey ? common(query.i18nKey) : '') ||
    (typeof query.name === 'string' ? query.name : '') ||
    ''

  /** 层级预览：去掉结构占位段，用 › 表示层级（不影响实际保存的 key） */
  const i18nKeyPathForDisplay = (query.i18nKey ?? '')
    .split('.')
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => s !== 'children' && s !== 'name')

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

  const editMenuId = Number(query.id)

  useEffect(() => {
    if (!props.show || props.type !== 'edit' || !editMenuId) {
      setMenuButtons([])
      setButtonModal({ open: false, type: 'create', data: {} })
      return
    }
    loadMenuButtons(editMenuId)
  }, [props.show, props.type, editMenuId, loadMenuButtons])

  const showButtonSection = props.type === 'edit' && editMenuId > 0

  return (
    <Modal
      title={
        props.type === 'edit' ? t('modal.title.edit') : t('modal.title.create')
      }
      open={props.show}
      maskClosable={false}
      width='80%'
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
        name='basic'
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        form={form}
      >
        <Form.Item label={t('modal.currentMenuName')}>
          <Input value={currentMenuName} disabled />
        </Form.Item>
        <Form.Item label={t('modal.form.parentId.label')} name='parentId'>
          <TreeSelect
            showSearch
            allowClear
            treeDefaultExpandAll
            treeData={callTree(data, item => {
              const label = common(item.i18nKey)
              item.name = label
              ;(item as any).searchText = `${label ?? ''} ${
                item.i18nKey ?? ''
              } ${item.pathName ?? ''} ${item.path ?? ''}`
            })}
            treeNodeFilterProp='searchText'
            fieldNames={{
              label: 'name',
              value: 'id'
            }}
            value={query.parentId as number}
            onChange={val => {
              setQuery({
                ...query,
                parentId: val
              })
            }}
          ></TreeSelect>
        </Form.Item>
        <Form.Item
          label={t('modal.form.i18nKey.label')}
          rules={[
            { required: true, message: t('modal.form.i18nKey.required') }
          ]}
          name='i18nKey'
        >
          <Input.TextArea
            value={query.i18nKey}
            autoSize={{ minRows: 2, maxRows: 8 }}
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: 13,
              lineHeight: 1.5,
              wordBreak: 'break-all'
            }}
            onChange={e => {
              const next = e.target.value
                .replace(/\r\n/g, '\n')
                .replace(/\n/g, '')
              form.setFieldValue('i18nKey', next)
              setQuery({
                ...query,
                i18nKey: next
              })
            }}
          />
        </Form.Item>
        {i18nKeyPathForDisplay.length > 1 ? (
          <Form.Item
            wrapperCol={{ offset: 8, span: 16 }}
            style={{ marginTop: -8, marginBottom: 8 }}
          >
            <Space
              wrap
              align='center'
              size={4}
              split={
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    alignSelf: 'center',
                    color: 'rgba(0, 0, 0, 0.35)',
                    userSelect: 'none',
                    lineHeight: 1,
                    fontSize: 24
                  }}
                >
                  ›
                </span>
              }
            >
              {i18nKeyPathForDisplay.map((seg, idx) => (
                <Tag key={`${idx}-${seg}`} style={{ marginInlineEnd: 0 }}>
                  {seg}
                </Tag>
              ))}
            </Space>
          </Form.Item>
        ) : null}
        <Form.Item
          label={t('modal.form.path.label')}
          rules={[{ required: true, message: t('modal.form.path.required') }]}
          name='path'
        >
          <Input
            value={query.path}
            onChange={e => {
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
          name='pathName'
        >
          <Input
            value={query.pathName}
            onChange={e => {
              setQuery({
                ...query,
                pathName: e.currentTarget.value
              })
            }}
          />
        </Form.Item>
        <Form.Item label={t('modal.form.show.label')} name='show'>
          <Switch
            value={query.show}
            onChange={val => {
              setQuery({
                ...query,
                show: val
              })
            }}
          />
        </Form.Item>
      </Form>

      {showButtonSection ? (
        <>
          <Divider orientation='left'>{common('button.pageButtons')}</Divider>
          <Row justify='end' style={{ marginBottom: 12 }}>
            <CheckPermission code='button.save'>
              <Button
                type='primary'
                onClick={() => {
                  setButtonModal({
                    open: true,
                    type: 'create',
                    data: {
                      menuId: editMenuId,
                      i18nKey: 'button.',
                      apiCode: ''
                    }
                  })
                }}
              >
                {common('button.add')}
              </Button>
            </CheckPermission>
          </Row>
          <div
            style={{
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              overflow: 'hidden'
            }}
          >
            {menuButtons.length ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.2fr 1.2fr 160px',
                  gap: 8,
                  padding: '10px 12px',
                  background: '#fafafa',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                <div style={{ fontWeight: 600 }}>{t('buttonPanel.columnName')}</div>
                <div style={{ fontWeight: 600 }}>
                  {t('buttonPanel.columnI18nKey')}
                </div>
                <div style={{ fontWeight: 600 }}>
                  {t('buttonPanel.columnApiCode')}
                </div>
                <div style={{ fontWeight: 600 }}>
                  {t('buttonPanel.columnAction')}
                </div>
              </div>
            ) : (
              <div style={{ color: '#888', padding: '12px' }}>
                {t('buttonPanel.empty')}
              </div>
            )}

            {menuButtons.map(b => (
              <div
                key={b.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.2fr 1.2fr 160px',
                  gap: 8,
                  padding: '10px 12px',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                <div>{common(b.i18nKey)}</div>
                <div style={{ color: '#666' }}>{b.i18nKey}</div>
                <div style={{ color: '#666' }}>{b.apiCode}</div>
                <div>
                  <Space>
                    <CheckPermission code='button.save'>
                      <Button
                        size='small'
                        type='primary'
                        onClick={() => {
                          http({
                            url: 'admin/permission/button/detail',
                            method: 'get',
                            params: { id: b.id }
                          }).then((res: any) => {
                            setButtonModal({
                              open: true,
                              type: 'edit',
                              data: res.data
                            })
                          })
                        }}
                      >
                        {common('button.edit')}
                      </Button>
                    </CheckPermission>
                    <CheckPermission code='button.remove'>
                      <Button
                        size='small'
                        danger
                        type='primary'
                        onClick={() => {
                          Modal.confirm({
                            title: common('button.remove'),
                            content: t('message.buttonRemove.content'),
                            onOk () {
                              return http({
                                url: 'admin/permission/button/remove',
                                method: 'delete',
                                params: { id: b.id }
                              }).then(() => {
                                message.success(t('message.remove.success'))
                                loadMenuButtons(editMenuId)
                              })
                            }
                          })
                        }}
                      >
                        {common('button.remove')}
                      </Button>
                    </CheckPermission>
                  </Space>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <ButtonModal
        type={buttonModal.type}
        show={buttonModal.open}
        data={buttonModal.data}
        onCancel={() => setButtonModal(v => ({ ...v, open: false }))}
        onConfirm={() => {
          setButtonModal(v => ({ ...v, open: false }))
          if (editMenuId) loadMenuButtons(editMenuId)
        }}
      />
    </Modal>
  )
}
