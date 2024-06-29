'use client'
import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Row, Modal, message } from 'antd'
import type { TableColumnsType } from 'antd'
import { Query } from '@/components/query'
import http from '@/api/index'
import { buttonItem } from '@/type/api'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../../layout'
import { ButtonModal } from '@/dialog/buttonModal'
// import { usePermissionStore } from '@/store/usePermissionStore'
import { listToTree } from '@/utils'
import { CheckPermission } from '@/components/checkPermission'
import './style.scss'

interface Query {
  name: string
}

export default function Page({ params: { lng } }: PageProps) {
  const [data, setData] = useState([])
  const [query, setQuery] = useState<Partial<Query>>({})
  const { t } = useTranslation(lng, 'button')
  const { t: common } = useTranslation(lng, 'common')
  const [modal, setModal] = useState({
    type: 'create',
    show: false,
    data: {}
  })

  const getData = () => {
    http({
      url: 'admin/permission/button/list',
      method: 'post',
      data: {
        ...query
      }
    }).then((res) => {
      setData(listToTree(res.data))
    })
  }

  useEffect(() => {
    getData()
  }, [])

  useEffect(() => {}, [query, setQuery])

  const columns: TableColumnsType<buttonItem> = [
    {
      title: t('table.name'),
      // width: 200,
      dataIndex: 'i18nKey',
      render(key) {
        return common(key)
      }
    },
    {
      title: t('table.button'),
      className: 'button-cell',
      render(value, item) {
        return (
          <ul
            style={{
              padding: '0',
              margin: '0'
            }}
          >
            {item.button.length ? (
              <li className="button-table">
                <div className="button-table-cell">{t('table.buttonName')}</div>
                <div className="button-table-cell">{t('table.i18nKey')}</div>
                <div className="button-table-cell">{t('table.apiCode')}</div>
                <div className="button-table-cell">{t('table.action')}</div>
              </li>
            ) : null}
            {item.button.map((button, index) => {
              return (
                <li className="button-table" key={index}>
                  <div className="button-table-cell">
                    <Button type="text">{common(button.i18nKey)}</Button>
                  </div>
                  <div className="button-table-cell">
                    <Button type="text">{button.i18nKey}</Button>
                  </div>
                  <div className="button-table-cell">
                    <Button type="text">{button.apiCode}</Button>
                  </div>
                  <div className="button-table-cell">
                    <Space>
                      <CheckPermission code="button.save">
                        <Button
                          type="primary"
                          onClick={() => {
                            http({
                              url: 'admin/permission/button/detail',
                              method: 'get',
                              params: {
                                id: button.id
                              }
                            }).then((res) => {
                              setModal({
                                ...modal,
                                data: res.data,
                                type: 'edit',
                                show: true
                              })
                            })
                          }}
                        >
                          {common('button.edit')}
                        </Button>
                      </CheckPermission>
                      <CheckPermission code="button.remove">
                        <Button
                          type="primary"
                          danger
                          onClick={() => {
                            Modal.confirm({
                              title: common('button.remove'),
                              content: t('message.remove.content'),
                              onCancel() {
                                console.log('Cancel')
                              },
                              onOk() {
                                return new Promise((resolve, reject) => {
                                  http({
                                    url: 'admin/permission/button/remove',
                                    method: 'delete',
                                    params: {
                                      id: button.id
                                    }
                                  })
                                    .then(() => {
                                      message.success(
                                        t('message.remove.success')
                                      )
                                      getData()
                                      resolve(true)
                                    })
                                    .catch(reject)
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
                </li>
              )
            })}
          </ul>
        )
      }
    }
  ]

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '30px'
      }}
    >
      <Row justify="end">
        <CheckPermission code="button.save">
          <Button
            onClick={() => {
              setModal({
                ...modal,
                data: {},
                type: 'create',
                show: true
              })
            }}
          >
            {common('button.add')}
          </Button>
        </CheckPermission>
      </Row>
      <Table
        columns={columns}
        dataSource={data}
        bordered={true}
        rowKey={'id'}
      />
      <ButtonModal
        type={modal.type as 'create' | 'edit'}
        show={modal.show}
        data={modal.data}
        onCancel={() => {
          setModal({
            ...modal,
            show: false
          })
        }}
        onConfirm={() => {
          getData()
          setModal({
            ...modal,
            show: false
          })
        }}
      ></ButtonModal>
    </section>
  )
}
