'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import {
  Switch,
  Modal,
  Checkbox,
  Table,
  type TableColumnsType,
  message
} from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import { buttonItem } from '@/type/api'
import {
  listToTree,
  callTree,
  flattern,
  setCheckedStatus
} from '@/utils'

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
      const recursion = (menu: any[]): number[] => {
        const hasEvery = (arr: permission[]): boolean => {
          return arr.every((item) => {
            return Array.isArray(item.children)
              ? hasEvery(item.children)
              : item.checked
          })
        }
        const hasIndeterminate = (arr: permission[]): boolean => {
          return arr.some((item) => {
            return Array.isArray(item.children)
              ? hasEvery(item.children)
              : item.checked
          })
        }

        return menu.reduce(
          (
            total: number[],
            current: permission & { indeterminate: boolean }
          ) => {
            if (Array.isArray(current.children)) {
              const every = hasEvery(current.children)
              const indeterminate = hasIndeterminate(current.children)

              if (every) {
                current.checked = true
                return total.concat(current.id)
              }
              current.indeterminate = indeterminate

              return total.concat(recursion(current.children))
            } else {
              if (current.checked) {
                return total.concat(current.id)
              }
            }
            return total
          },
          []
        )
      }
      const tree = listToTree(res.data)
      const selected = recursion(tree as any)
      setMenuListId(selected)
      callTree(tree as any, (item: any) => {
        item.button = item.button.filter((item: any) => item.id !== null)
        item.selected = item.button.reduce((total: number[], current: any) => {
          if (current.checked) {
            return total.concat(current.id as never)
          }
          return total
        }, [] as number[])
      })

      setData(tree as any)
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
      title: t('table.show'),
      dataIndex: '',
      render(_, row) {
        return <Switch value={row.show} disabled />
      }
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
    callTree(data, (item: any) => {
      const buttonId = item.button.map((item: any) => item.id)

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
        const menuId: number[] = []

        callTree(data, (item: any) => {
          buttonId.push(...item.selected)
        })

        // 设置目前已选中的节点
        const map = new Map(menuListId.map((item) => [item, item]))
        callTree(data, (item: any) => {
          if (map.get(item.id)) {
            item.checked = true
          }
        })
        // 更新选中节点
        const flatternTree = flattern(data)

        setCheckedStatus(data, menuListId)
        callTree(flatternTree, (item: any) => {
          if (item.checked || item?.indeterminate) {
            if (!menuId.includes(item.id)) {
              menuId.push(item.id)
            }
          }
        })

        http({
          url: 'permission/role/config',
          method: 'post',
          data: {
            roleId: props.data.id,
            menuId,
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
