'use client'
import React, { useState, useEffect } from 'react'
import { PageProps } from '@/app/[lng]/layout'
import { useTranslation } from '@/app/i18n/client'
import {
  Form,
  Modal,
  Checkbox,
  Table,
  type TableColumnsType,
  message
} from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import { buttonItem } from '@/type/api'
import { listToTree, callTree } from '@/utils'

interface modalProps {
  show?: boolean
  data: Record<string, any>
  onConfirm?: () => void
  onCancel?: () => void
}

export type permission = buttonItem & {
  selected: number[]
}

export function RolePermission(props: modalProps) {
  const [data, setData] = useState<permission[]>([])
  const { t } = useTranslation(navigator.language as languageType, 'role')
  const [menuListId, setMenuListId] = useState<number[]>([])

  const getData = () => {
    http({
      url: 'permission/role/permissionList',
      method: 'get',
      params: {
        id: props.data.id
      }
    }).then((res: any) => {
      const selected = res.data.reduce((total: number[], current: permission) => {
        if (current.checked) {
          return total.concat(current.id)
        }
        return total
      }, [])

      setMenuListId(selected)
      // debugger
      const map = res.data.map((item: buttonItem) => {
        return {
          ...item,
          button: item.button.filter((item) => item.id !== null),
          selected: item.button.reduce((total, current) => {
            if (current.checked) {
              return total.concat(current.id as never)
            }
            return total
          }, [])
        }
      })
        
      setData(listToTree(map))
      console.log(data)
    })
  }

  useEffect(() => {
    if (props.show) {
      getData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.show])

  const columns: TableColumnsType<permission> = [
    {
      title: t('rolePermissionModal.table.name'),
      // width: 200,
      dataIndex: 'name'
    },
    {
      title: t('rolePermissionModal.table.button'),
      className: 'button-cell',
      render(value, item) {
        const options = item.button.map((item) => {
          return {
            label: item.name,
            value: item.id
          }
        })
        // debugger
        return (
          <Checkbox.Group
            options={options}
            value={item.selected}
            onChange={(val) => {
              // debugger
              const some = menuListId.some((current) => current === item.id)

              if (some) {
                item.selected = val
                setData([...data])
              } else {
                message.warning(t('message.noSelectMenu'))
              }
            }}
          />
        )
      }
    }
  ]

  const select = (data: permission[], selected: boolean) => {
    callTree<permission>(data, (item) => {
      const buttonId = item.button.map((item) => item.id)

      item.selected = selected ? buttonId : []
    })
  }

  return (
    <Modal
      title={t('rolePermissionModal.title')}
      open={props.show}
      maskClosable={false}
      width={800}
      onOk={() => {
        const buttonId: number[] = []

        callTree<permission>(data, (item) => {
          buttonId.push(...item.selected)
        })
        http({
          url: 'permission/role/config',
          method: 'post',
          data: {
            roleId: props.data.id,
            menuId: menuListId,
            buttonId
          }
        }).then(() => {
          props?.onConfirm?.()
        })

      }}
      onCancel={props?.onCancel}
    >
      <Table
        columns={columns}
        dataSource={data}
        bordered={true}
        rowKey={'id'}
        pagination={false}
        rowSelection={{
          type: 'checkbox',
          checkStrictly: false,
          selectedRowKeys: menuListId,
          onChange(keys) {
            setMenuListId(keys as number[])
          },
          onSelect(row, selected) {
            const buttonId = row.button.map((item) => item.id)

            row.selected = selected ? buttonId : []

            select(row.children, selected)
            setData([...data])
          },
          onSelectAll(selected) {
            select(data, selected)
            setData([...data])
          }
        }}
      />
    </Modal>
  )
}
