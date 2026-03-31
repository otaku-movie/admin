'use client'
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState
} from 'react'
import { CloseOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Space,
  Row,
  Col,
  Input,
  Switch,
  Modal,
  message,
  Table,
  Tree,
  Tag,
  theme,
  Segmented,
  Descriptions,
  Spin,
  Empty,
  Divider
} from 'antd'
import type { TableColumnsType } from 'antd'
import http from '@/api/index'
import { menuItem } from '@/type/api'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../../../layout'
import { MenuModal } from '@/dialog/menuModal'
import { usePermissionStore } from '@/store/usePermissionStore'
import { CheckPermission } from '@/components/checkPermission'
import './style.scss'

interface Query {
  name: string
}

/** 从路由 path 拆出用于表格展示的层级段（去掉 `_group` 等占位段） */
function pathSegmentsForDisplay (path?: string | null): string[] {
  if (!path) return []
  return path
    .split('/')
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => s !== '_group')
}

function flattenMenuTree (nodes: menuItem[] | null | undefined): menuItem[] {
  const out: menuItem[] = []
  const dfs = (arr: menuItem[] | null | undefined) => {
    if (!Array.isArray(arr)) return
    for (const n of arr) {
      out.push(n)
      if (Array.isArray(n.children) && n.children.length) dfs(n.children)
    }
  }
  dfs(nodes)
  return out
}

export default function MoviePage ({ params: { lng } }: PageProps) {
  const data = usePermissionStore(state => state.menu)
  const getMenu = usePermissionStore(state => state.getMenu)
  const [query, setQuery] = useState<Partial<Query>>({})
  const [searchName, setSearchName] = useState('')
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree')
  const { t } = useTranslation(lng, 'menu')
  const { t: common } = useTranslation(lng, 'common')
  const { t: tComponents } = useTranslation(lng, 'components')
  const { token } = theme.useToken()

  const [modal, setModal] = useState({
    type: 'create',
    show: false,
    data: {}
  })

  const getData = () => {
    getMenu()
  }

  useEffect(() => {
    getData()
  }, [])

  useEffect(() => {}, [data])

  useEffect(() => {}, [query, setQuery])

  const [treeDataState, setTreeDataState] = useState<menuItem[]>([])
  const [reordering, setReordering] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [sortTreeState, setSortTreeState] = useState<menuItem[]>([])
  const [sortDirty, setSortDirty] = useState(false)
  const [buttonMap, setButtonMap] = useState<
    Record<number, { id: number; i18nKey: string; apiCode: string }[]>
  >({})

  /** 树形 + 右侧详情：当前选中的菜单 id 与接口详情 */
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null)
  const [detailPane, setDetailPane] = useState<Record<string, any> | null>(
    null
  )
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    setTreeDataState(data)
    // 当后端菜单刷新时，关闭排序弹窗并清空本地排序草稿
    setSortDirty(false)
    setReordering(false)
  }, [data])

  const filteredTreeData = useMemo(() => {
    const kw = (searchName ?? '').trim().toLowerCase()
    if (!kw) return treeDataState

    const matchNode = (n: menuItem) => {
      const label = (common(n.i18nKey) ?? '').toString().toLowerCase()
      return label.includes(kw)
    }

    const dfs = (nodes: menuItem[]): menuItem[] => {
      if (!Array.isArray(nodes) || nodes.length === 0) return []
      const out: menuItem[] = []
      for (const n of nodes) {
        const children = Array.isArray((n as any).children)
          ? (n as any).children
          : []
        const keptChildren = dfs(children)
        if (matchNode(n) || keptChildren.length) {
          out.push({
            ...(n as any),
            ...(keptChildren.length
              ? { children: keptChildren }
              : { children: (n as any).children })
          })
        }
      }
      return out
    }

    return dfs(treeDataState)
  }, [treeDataState, searchName, common])

  /** 受控展开：根节点 key 列表（数据异步到达后写入，避免 defaultExpandedKeys 首屏无子树不展开） */
  const menuTreeRootKeys = useMemo(
    () => filteredTreeData.map(n => String(n.id)),
    [filteredTreeData]
  )
  const menuTreeRootKeysSig = menuTreeRootKeys.join('\u0001')

  const [menuTreeExpandedKeys, setMenuTreeExpandedKeys] = useState<string[]>([])

  useLayoutEffect(() => {
    if (menuTreeRootKeys.length === 0) {
      setMenuTreeExpandedKeys([])
      return
    }
    setMenuTreeExpandedKeys(menuTreeRootKeys)
  }, [menuTreeRootKeysSig])

  const getButtons = () => {
    http({
      url: 'admin/permission/button/list',
      method: 'post',
      data: {}
    }).then((res: any) => {
      const map: Record<
        number,
        { id: number; i18nKey: string; apiCode: string }[]
      > = {}
      const dfs = (nodes: any[]) => {
        if (!Array.isArray(nodes)) return
        for (const n of nodes) {
          const mid = Number(n?.id)
          if (mid && Array.isArray(n.button)) {
            map[mid] = n.button
              .filter((b: any) => b && b.id != null)
              .map((b: any) => ({
                id: b.id,
                i18nKey: b.i18nKey,
                apiCode: b.apiCode
              }))
          }
          if (Array.isArray(n.children) && n.children.length) dfs(n.children)
        }
      }
      dfs(res.data)
      setButtonMap(map)
    })
  }

  useEffect(() => {
    getButtons()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** 树节点名称点击：选中并加载右侧详情（不直接弹编辑窗） */
  const loadMenuDetailPane = useCallback((node: menuItem) => {
    setSelectedMenuId(node.id)
    setDetailLoading(true)
    setDetailPane(null)
    http({
      url: 'admin/permission/menu/detail',
      method: 'get',
      params: { id: node.id }
    })
      .then((res: any) => {
        setDetailPane(res.data ?? null)
      })
      .catch(() => {
        setDetailPane(null)
      })
      .finally(() => {
        setDetailLoading(false)
      })
  }, [])

  /** 列表「编辑」：拉详情并打开编辑弹窗 */
  const fetchDetailAndOpenEditModal = useCallback((node: menuItem) => {
    http({
      url: 'admin/permission/menu/detail',
      method: 'get',
      params: { id: node.id }
    }).then((res: any) => {
      setModal(prev => ({
        ...prev,
        data: res.data,
        type: 'edit',
        show: true
      }))
    })
  }, [])

  const openMenuEditModalFromDetail = useCallback(() => {
    if (!detailPane?.id) return
    setModal(prev => ({
      ...prev,
      type: 'edit',
      show: true,
      data: { ...detailPane }
    }))
  }, [detailPane])

  const confirmRemoveMenu = useCallback(
    (node: menuItem) => {
      Modal.confirm({
        title: common('button.remove'),
        content: t('message.remove.content'),
        onOk () {
          return http({
            url: 'admin/permission/menu/remove',
            method: 'delete',
            params: { id: node.id }
          }).then(() => {
            message.success(t('message.remove.success'))
            getData()
            setSelectedMenuId(prev => (prev === node.id ? null : prev))
            setDetailPane(prev =>
              prev?.id === node.id ? null : prev
            )
          })
        }
      })
    },
    [common, t]
  )

  const openAddSubMenuModal = useCallback(
    (node: menuItem & { children?: menuItem[] | null }) => {
      const parentI18nKey = node.i18nKey ?? ''
      const parentPath = node.path ?? ''
      const i18nKeyPrefix = parentI18nKey
        ? `${parentI18nKey}${parentI18nKey.endsWith('.') ? '' : '.'}children.`
        : ''
      const pathPrefix = parentPath ? `${parentPath}/` : ''
      setModal(prev => ({
        ...prev,
        type: 'create',
        show: true,
        data: {
          parentId: node.id ?? null,
          i18nKey: i18nKeyPrefix,
          path: pathPrefix,
          pathName: '',
          show: node.show ?? true
        }
      }))
    },
    []
  )

  const renderButtonSettings = (node: menuItem) => {
    const buttons = buttonMap[node.id] ?? []
    return (
      <Space size={6} wrap>
        {buttons.length ? (
          buttons.slice(0, 4).map(b => (
            <Tag key={b.id} style={{ marginInlineEnd: 0 }}>
              {common(b.i18nKey)}
            </Tag>
          ))
        ) : (
          <span style={{ color: '#999' }}>-</span>
        )}
        {buttons.length > 4 ? (
          <span style={{ color: '#999' }}>+{buttons.length - 4}</span>
        ) : null}
      </Space>
    )
  }

  const renderRowActions = (
    node: menuItem & { children?: menuItem[] | null },
    variant: 'table' | 'tree' = 'table'
  ) => {
    if (variant === 'tree') {
      return (
        <CheckPermission code='menu.save'>
          <Button
            type='text'
            size='small'
            icon={<PlusOutlined />}
            title={common('button.addSubMenu')}
            aria-label={common('button.addSubMenu')}
            className='menuTreeNodeAddBtn'
            onClick={e => {
              e.stopPropagation()
              openAddSubMenuModal(node)
            }}
            onMouseDown={e => e.stopPropagation()}
          />
        </CheckPermission>
      )
    }

    return (
      <Space
        size={8}
        wrap
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
      >
        <CheckPermission code='menu.save'>
          <Button size='small' onClick={() => openAddSubMenuModal(node)}>
            {common('button.addSubMenu')}
          </Button>
        </CheckPermission>
            <CheckPermission code='menu.save'>
              <Button
                size='small'
                type='primary'
                onClick={() => fetchDetailAndOpenEditModal(node)}
              >
                {common('button.edit')}
              </Button>
            </CheckPermission>
        <CheckPermission code='menu.remove'>
          <Button
            size='small'
            type='primary'
            danger
            onClick={() => confirmRemoveMenu(node)}
          >
            {common('button.remove')}
          </Button>
        </CheckPermission>
      </Space>
    )
  }

  const buildSortTreeNodes = useMemo(() => {
    const toNodes = (
      nodes: (menuItem & { children?: menuItem[] | null })[] | undefined | null
    ): any[] => {
      if (!nodes) return []
      return nodes.map(n => {
        const children = n.children ? toNodes(n.children as any) : undefined
        return {
          key: String(n.id),
          title: common(n.i18nKey),
          children
        }
      })
    }
    return toNodes(sortTreeState as any)
  }, [sortTreeState, common])

  // 排序弹窗：默认只展开第一层（根节点），避免默认全展开过长
  const sortDefaultExpandedKeys = useMemo(() => {
    if (!Array.isArray(sortTreeState)) return []
    return sortTreeState.map((n: any) => String(n.id))
  }, [sortTreeState])

  const handleDrop: (info: any) => void = info => {
    if (reordering) return
    const dragKey = Number(info.dragNode?.key)
    const dropKey = Number(info.node?.key)
    if (!dragKey || !dropKey || dragKey === dropKey) return

    // treeDataState 里的节点可能带有 `parent` 指针，形成循环引用；
    // JSON.parse(JSON.stringify(...)) 无法序列化循环结构，所以改为“递归克隆且移除 parent 字段”
    const cloneTreeWithoutParent = (nodes: any[]): any[] => {
      return nodes.map(n => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { parent, ...rest } = n
        const children = Array.isArray(n.children)
          ? cloneTreeWithoutParent(n.children)
          : n.children
        return { ...rest, ...(children !== undefined ? { children } : {}) }
      })
    }

    const nextTree = cloneTreeWithoutParent(sortTreeState as any)

    const findNode = (
      nodes: any[],
      id: number,
      parent: any[] | null,
      parentNode: any | null
    ): {
      node: any
      parentArray: any[]
      parentNode: any | null
      index: number
    } | null => {
      for (let i = 0; i < nodes.length; i++) {
        const cur = nodes[i]
        if (cur.id === id)
          return {
            node: cur,
            parentArray: parent ?? nodes,
            parentNode,
            index: i
          }
        const children = Array.isArray(cur.children) ? cur.children : null
        if (children && children.length) {
          const res: {
            node: any
            parentArray: any[]
            parentNode: any | null
            index: number
          } | null = findNode(children, id, children, cur)
          if (res) return res
        }
      }
      return null
    }

    const dragFound = findNode(nextTree, dragKey, nextTree, null)
    const dropFound = findNode(nextTree, dropKey, nextTree, null)
    if (!dragFound || !dropFound) return

    // 1) 移除拖拽节点
    dragFound.parentArray.splice(dragFound.index, 1)
    const moved = dragFound.node

    // 移除后目标节点的 index 可能会变化（尤其是同级拖拽时），因此重新定位一次
    const dropFoundAfter = findNode(nextTree, dropKey, nextTree, null)
    if (!dropFoundAfter) return

    // 2) 插入到新位置
    const dropPosition =
      typeof info.dropPosition === 'number' ? (info.dropPosition as number) : 1

    // antd 的 dropToGap 在某些“叶子节点同级拖拽”场景下可能为 false，
    // 这会导致把节点当成子级插入，用户会感觉“顺序没变”。
    // 修正：如果 drag/drop 都是叶子且属于同一个 parent，则强制按同级 gap 插入。
    const dragIsLeaf =
      !Array.isArray(dragFound.node.children) ||
      dragFound.node.children.length === 0
    const dropIsLeaf =
      !Array.isArray(dropFoundAfter.node.children) ||
      dropFoundAfter.node.children.length === 0
    const sameParent =
      (dragFound.parentNode ? dragFound.parentNode.id : null) ===
      (dropFoundAfter.parentNode ? dropFoundAfter.parentNode.id : null)

    const dropToGap =
      info.dropToGap === true || (dragIsLeaf && dropIsLeaf && sameParent)

    if (dropToGap) {
      // 同级：插在目标节点的前后
      const targetParentArray = dropFoundAfter.parentArray
      const targetIndex = dropFoundAfter.index
      const insertIndex = dropPosition === -1 ? targetIndex : targetIndex + 1
      moved.parentId = dropFoundAfter.parentNode
        ? dropFoundAfter.parentNode.id
        : null
      targetParentArray.splice(insertIndex, 0, moved)
    } else {
      // 子级：插到目标节点 children 里（追加）
      moved.parentId = dropKey
      if (!Array.isArray(dropFoundAfter.node.children))
        dropFoundAfter.node.children = []
      dropFoundAfter.node.children.push(moved)
    }

    // 3) 根据新树形结构计算 order_num，并提交后端持久化
    setSortTreeState(nextTree)
    setSortDirty(true)
  }

  const openSortModal = () => {
    setSortTreeState(treeDataState)
    setSortDirty(false)
    setSortOpen(true)
  }

  const handleCancelReorder = () => {
    if (reordering) return
    setSortOpen(false)
    setSortDirty(false)
    setSortTreeState([])
  }

  const handleSaveReorder = () => {
    if (!sortDirty || reordering) return

    const updates: { id: number; parentId: number | null; orderNum: number }[] =
      []
    const traverse = (nodes: any[], parentId: number | null) => {
      nodes.forEach((n: any, idx: number) => {
        updates.push({ id: n.id, parentId, orderNum: idx })
        if (Array.isArray(n.children) && n.children.length) {
          traverse(n.children, n.id)
        }
      })
    }

    traverse(sortTreeState as any, null)

    setReordering(true)
    http({
      url: 'admin/permission/menu/reorder',
      method: 'post',
      data: { items: updates }
    })
      .then(res => {
        message.success(res.message)
        setSortDirty(false)
        setSortOpen(false)
        getData()
      })
      .catch(() => {
        message.error(t('sortModal.saveFailed'))
        getData()
      })
      .finally(() => {
        setReordering(false)
      })
  }

  const columns: TableColumnsType<menuItem> = [
    {
      title: t('table.name'),
      dataIndex: 'i18nKey',
      render: (key: string) => common(key)
    },
    {
      title: t('modal.form.path.label'),
      dataIndex: 'path',
      render: (_: string, row) => {
        const segments = pathSegmentsForDisplay(row.path)
        if (segments.length > 1) {
          return (
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
                    fontSize: 14
                  }}
                >
                  ›
                </span>
              }
            >
              {segments.map((seg, idx) => (
                <Tag
                  key={`${row.id}-p-${idx}-${seg}`}
                  style={{ marginInlineEnd: 0 }}
                >
                  {seg}
                </Tag>
              ))}
            </Space>
          )
        }
        return <span style={{ color: '#666' }}>{row.path?.trim() || '-'}</span>
      }
    },
    {
      title: t('modal.form.pathName.label'),
      dataIndex: 'pathName',
      render: (v: string) => <span style={{ color: '#666' }}>{v || '-'}</span>
    },
    {
      title: t('table.show'),
      dataIndex: 'show',
      width: 90,
      render: (_: any, row) => (
        <Switch
          size='small'
          checked={row.show}
          onChange={val => {
            http({
              url: 'admin/permission/menu/save',
              method: 'post',
              data: {
                id: row.id,
                i18nKey: row.i18nKey,
                path: row.path,
                pathName: row.pathName,
                show: val,
                parentId: row.parentId
              }
            }).then(res => {
              message.success(res.message)
              getData()
            })
          }}
        />
      )
    },
    {
      title: common('button.pageButtons'),
      dataIndex: 'buttons',
      width: 150,
      render: (_: any, row) => renderButtonSettings(row as any)
    },
    {
      title: common('table.action'),
      dataIndex: 'action',
      render: (_: any, row) => renderRowActions(row as any)
    }
  ]

  const detailPaneButtonColumns: TableColumnsType<{
    id: number
    i18nKey: string
    apiCode: string
  }> = useMemo(
    () => [
      {
        title: t('buttonPanel.columnName'),
        dataIndex: 'i18nKey',
        render: (_: unknown, r) => common(r.i18nKey)
      },
      {
        title: t('buttonPanel.columnI18nKey'),
        dataIndex: 'i18nKey',
        render: (v: string) => (
          <span
            style={{
              color: '#666',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: 13,
              wordBreak: 'break-all'
            }}
          >
            {v || '-'}
          </span>
        )
      },
      {
        title: t('buttonPanel.columnApiCode'),
        dataIndex: 'apiCode',
        render: (v: string) => (
          <span style={{ color: '#666' }}>{v?.trim() || '-'}</span>
        )
      }
    ],
    [t, common]
  )

  const treeNodeTitle = (node: menuItem) => {
    const rowSelected = selectedMenuId === node.id
    return (
      <div
        className={
          rowSelected
            ? 'menuTreeNodeRow menuTreeNodeRow--selected'
            : 'menuTreeNodeRow'
        }
      >
        <div className='menuTreeNodeMain'>
          <div className='menuTreeNodeLeft'>
          <span
            className='menuTreeNodeSwitchWrap'
            role='presentation'
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
          >
            <Switch
              size='small'
              checked={node.show}
              onChange={val => {
                http({
                  url: 'admin/permission/menu/save',
                  method: 'post',
                  data: {
                    id: node.id,
                    i18nKey: node.i18nKey,
                    path: node.path,
                    pathName: node.pathName,
                    show: val,
                    parentId: node.parentId
                  }
                }).then(res => {
                  message.success(res.message)
                  getData()
                  setDetailPane((prev: any) =>
                    prev?.id === node.id ? { ...prev, show: val } : prev
                  )
                })
              }}
            />
          </span>
          <span
            className='menuTreeNodeLabel'
            role='button'
            tabIndex={0}
            style={{
              cursor: 'pointer',
              color: token.colorPrimary
            }}
            onClick={e => {
              e.stopPropagation()
              loadMenuDetailPane(node)
            }}
            onMouseDown={e => e.stopPropagation()}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                loadMenuDetailPane(node)
              }
            }}
          >
            {common(node.i18nKey)}
          </span>
        </div>
          <div className='menuTreeNodeOps'>
          {renderRowActions(node, 'tree')}
          <CheckPermission code='menu.save'>
            <span
              role='button'
              tabIndex={0}
              title={common('button.edit')}
              aria-label={common('button.edit')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                color: token.colorPrimary,
                cursor: 'pointer',
                fontSize: 12,
                lineHeight: 1,
                padding: '0 2px'
              }}
              onClick={e => {
                e.stopPropagation()
                fetchDetailAndOpenEditModal(node)
              }}
              onMouseDown={e => e.stopPropagation()}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  fetchDetailAndOpenEditModal(node)
                }
              }}
            >
              <EditOutlined />
            </span>
          </CheckPermission>
          <CheckPermission code='menu.remove'>
            <span
              role='button'
              tabIndex={0}
              title={common('button.remove')}
              aria-label={common('button.remove')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                color: '#ff4d4f',
                cursor: 'pointer',
                fontSize: 12,
                lineHeight: 1,
                padding: '0 2px'
              }}
              onClick={e => {
                e.stopPropagation()
                confirmRemoveMenu(node)
              }}
              onMouseDown={e => e.stopPropagation()}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  confirmRemoveMenu(node)
                }
              }}
            >
              <CloseOutlined />
            </span>
          </CheckPermission>
        </div>
        </div>
      </div>
    )
  }

  const buildTreeViewNodes = useMemo(() => {
    const toNodes = (nodes: menuItem[] | null | undefined): any[] => {
      if (!Array.isArray(nodes) || nodes.length === 0) return []
      return nodes.map(n => ({
        key: String(n.id),
        title: treeNodeTitle(n),
        children: toNodes(n.children ?? null)
      }))
    }
    return toNodes(filteredTreeData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filteredTreeData,
    common,
    searchName,
    token.colorPrimary,
    loadMenuDetailPane,
    confirmRemoveMenu,
    fetchDetailAndOpenEditModal,
    openAddSubMenuModal,
    selectedMenuId
  ])

  const flatListData = useMemo(() => {
    return flattenMenuTree(filteredTreeData)
  }, [filteredTreeData])

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '30px'
      }}
    >
      <Space style={{ justifyContent: 'space-between' }}>
        <Segmented
          value={viewMode}
          onChange={v => setViewMode(v as any)}
          options={[
            { label: t('viewMode.tree'), value: 'tree' },
            { label: t('viewMode.list'), value: 'list' }
          ]}
        />
        <Space>
          <CheckPermission code='menu.save'>
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
          <CheckPermission code='menu.save'>
            <Button onClick={openSortModal} ghost type='primary'>
              {common('button.sort')}
            </Button>
          </CheckPermission>
        </Space>
      </Space>

      {/* 不用 Form/Query：避免 Form.Item + 克隆子结点导致中文输入法组字被打断 */}
      <section
        style={{
          background: token.colorFillAlter,
          borderRadius: token.borderRadiusLG,
          padding: 24,
          marginBottom: 16
        }}
      >
        <Row gutter={16} align='middle' wrap>
          <Col flex='none'>
            <Space align='center' wrap>
              <span style={{ whiteSpace: 'nowrap' }}>{t('table.name')}:</span>
              <Input
                allowClear
                style={{ width: 260 }}
                value={query.name}
                onChange={e => {
                  const v = e.target.value
                  setQuery(prev => ({ ...prev, name: v }))
                  if (v === '') setSearchName('')
                }}
              />
            </Space>
          </Col>
          <Col flex='auto' style={{ textAlign: 'right' }}>
            <Button
              type='primary'
              onClick={() => setSearchName((query?.name ?? '').toString())}
            >
              {tComponents('query.search')}
            </Button>
          </Col>
        </Row>
      </section>

      {viewMode === 'tree' ? (
        <Row gutter={[16, 16]} wrap style={{ alignItems: 'stretch' }}>
          <Col
            xs={24}
            lg={10}
            xl={9}
            style={{ minWidth: 0, maxHeight: '70vh', overflow: 'auto' }}
          >
            <Tree
              key={searchName || '__all__'}
              rootClassName='menuListTree'
              showLine
              blockNode
              expandedKeys={menuTreeExpandedKeys}
              onExpand={keys => setMenuTreeExpandedKeys(keys as string[])}
              treeData={buildTreeViewNodes}
            />
          </Col>
          <Col xs={24} lg={14} xl={15} flex='1' style={{ minWidth: 0 }}>
            <div
              style={{
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadiusLG,
                background: token.colorBgContainer,
                padding: 20,
                minHeight: 360,
                maxHeight: '70vh',
                overflow: 'auto'
              }}
            >
              <Row gutter={[8, 8]} align='middle' wrap style={{ marginBottom: 16 }}>
                <Col flex='auto' style={{ minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: token.colorPrimary
                    }}
                  >
                    {t('detailPanel.title')}
                  </span>
                </Col>
                {detailPane?.id ? (
                  <Col flex='none' style={{ marginLeft: 'auto' }}>
                    <Space size='small' wrap>
                      <CheckPermission code='menu.save'>
                        <Button
                          size='small'
                          icon={<PlusOutlined />}
                          onClick={() =>
                            openAddSubMenuModal(detailPane as menuItem)
                          }
                        >
                          {common('button.addSubMenu')}
                        </Button>
                      </CheckPermission>
                      <CheckPermission code='menu.remove'>
                        <Button
                          size='small'
                          danger
                          icon={<CloseOutlined />}
                          onClick={() =>
                            confirmRemoveMenu(detailPane as menuItem)
                          }
                        >
                          {common('button.remove')}
                        </Button>
                      </CheckPermission>
                      <CheckPermission code='menu.save'>
                        <Button
                          type='primary'
                          size='small'
                          onClick={openMenuEditModalFromDetail}
                        >
                          {common('button.edit')}
                        </Button>
                      </CheckPermission>
                    </Space>
                  </Col>
                ) : null}
              </Row>
              <Spin spinning={detailLoading}>
                {!detailPane?.id && !detailLoading ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t('detailPanel.placeholder')}
                  />
                ) : detailPane?.id ? (
                  <>
                    <Descriptions
                      column={1}
                      size='small'
                      bordered
                      labelStyle={{ width: 140 }}
                    >
                      <Descriptions.Item label={t('table.name')}>
                        {common(detailPane.i18nKey)}
                      </Descriptions.Item>
                      <Descriptions.Item
                        label={t('modal.form.i18nKey.label')}
                        contentStyle={{
                          fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          fontSize: 13,
                          wordBreak: 'break-all'
                        }}
                      >
                        {detailPane.i18nKey || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('modal.form.path.label')}>
                        {detailPane.path?.trim() || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('modal.form.pathName.label')}>
                        {detailPane.pathName || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('table.show')}>
                        <Switch
                          size='small'
                          checked={!!detailPane.show}
                          onChange={val => {
                            http({
                              url: 'admin/permission/menu/save',
                              method: 'post',
                              data: {
                                id: detailPane.id,
                                i18nKey: detailPane.i18nKey,
                                path: detailPane.path,
                                pathName: detailPane.pathName,
                                show: val,
                                parentId: detailPane.parentId
                              }
                            }).then(res => {
                              message.success(res.message)
                              getData()
                              setDetailPane((prev: any) =>
                                prev ? { ...prev, show: val } : prev
                              )
                            })
                          }}
                        />
                      </Descriptions.Item>
                    </Descriptions>
                    <Divider orientation='left' style={{ marginTop: 20 }}>
                      {common('button.pageButtons')}
                    </Divider>
                    {(buttonMap[detailPane.id] ?? []).length === 0 ? (
                      <div style={{ color: token.colorTextSecondary }}>
                        {t('buttonPanel.empty')}
                      </div>
                    ) : (
                      <Table
                        size='small'
                        bordered
                        pagination={false}
                        rowKey='id'
                        columns={detailPaneButtonColumns}
                        dataSource={buttonMap[detailPane.id] ?? []}
                      />
                    )}
                  </>
                ) : null}
              </Spin>
            </div>
          </Col>
        </Row>
      ) : (
        <Table
          columns={columns}
          dataSource={flatListData as any}
          bordered
          pagination={false}
          rowKey='id'
        />
      )}

      <Modal
        title={common('button.sort')}
        open={sortOpen}
        width={720}
        maskClosable={false}
        onCancel={handleCancelReorder}
        footer={
          <Space>
            <Button onClick={handleCancelReorder} disabled={reordering}>
              {common('button.cancel')}
            </Button>
            <Button
              type='primary'
              loading={reordering}
              onClick={handleSaveReorder}
              disabled={!sortDirty}
            >
              {common('button.save')}
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 12, color: '#666' }}>
          {t('sortModal.hint')}
        </div>
        <Tree
          showLine
          blockNode
          draggable
          treeData={buildSortTreeNodes}
          onDrop={handleDrop as any}
          defaultExpandedKeys={sortDefaultExpandedKeys}
        />
      </Modal>

      <MenuModal
        lng={lng}
        type={modal.type as 'create' | 'edit'}
        show={modal.show}
        data={modal.data}
        onCancel={() => {
          setModal({
            ...modal,
            show: false
          })
          getButtons()
        }}
        onConfirm={() => {
          getData()
          getButtons()
          setModal({
            ...modal,
            show: false
          })
          const sid = selectedMenuId
          if (sid != null) {
            http({
              url: 'admin/permission/menu/detail',
              method: 'get',
              params: { id: sid }
            }).then((res: any) => {
              setDetailPane(res.data ?? null)
            })
          }
        }}
      ></MenuModal>
    </section>
  )
}
