'use client'
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useTranslation } from '@/app/i18n/client'
import {
  Form,
  Modal,
  Input,
  Select,
  Transfer,
  message,
  Steps,
  Button,
  Space,
  Cascader,
  Descriptions,
  Avatar,
  Typography
} from 'antd'
import type { TransferItem } from 'antd/es/transfer'
import http from '@/api'
import { languageType } from '@/config'
import { user } from '@/type/api'
import {
  emailRegExp,
  passwordRegExp,
  usernameRegExp,
  getUserInfo,
  getURL
} from '@/utils'
import { Upload } from '@/components/upload/Upload'
import { md5 } from 'js-md5'
import { VerifyCode } from '@/components/verifyCode'
import {
  getAddressTreeList,
  type AddressTreeListResponse
} from '@/api/request/cinema'

/** 地区级联仅展示 2 级（如：大区 → 都道府县），去掉第 3 级 */
function trimAddressTreeToTwoLevels(
  nodes: AddressTreeListResponse[]
): AddressTreeListResponse[] {
  return (nodes || []).map((node) => ({
    ...node,
    children:
      node.children?.map((child) => ({
        ...child,
        children: undefined
      })) ?? undefined
  }))
}

/** 当前登录管理员是否为「平台」数据范围（仅客户端会话） */
function isLoggedInPlatformScope(): boolean {
  if (typeof window === 'undefined') return false
  const u = getUserInfo() as { dataScope?: string }
  return u?.dataScope === 'platform'
}

function scopeFieldsChanged(
  baseline: { dataScope?: string; brandId?: number | null; cinemaIds?: number[] } | null,
  scope: string,
  q: { brandId?: number | null; cinemaIds?: number[] }
): boolean {
  if (!baseline) {
    return false
  }
  const baseScope = baseline.dataScope || 'platform'
  if (baseScope !== scope) {
    return true
  }
  if (scope === 'chain' && baseline.brandId !== q.brandId) {
    return true
  }
  if (scope === 'cinema') {
    const a = [...(baseline.cinemaIds || [])].sort((x, y) => x - y).join(',')
    const b = [...(q.cinemaIds || [])].sort((x, y) => x - y).join(',')
    return a !== b
  }
  return false
}

interface UserModalProps {
  type: 'create' | 'edit'
  show?: boolean
  data: Partial<user>
  onConfirm?: () => void
  onCancel?: () => void
}

interface Query {
  id?: number
  cover?: string
  name?: string
  password?: string
  password2?: string
  email?: string
  code?: string
  dataScope?: string
  brandId?: number | null
  cinemaIds?: number[]
}

const STEP_DATA = 0
const STEP_ACCOUNT = 1
const STEP_PREVIEW = 2
const STEP_SECURITY = 3

const DEFAULT_AVATAR_PLACEHOLDER =
  'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg'

export default function UserModal(props: UserModalProps) {
  const { t } = useTranslation(navigator.language as languageType, 'user')
  const { t: common } = useTranslation(
    navigator.language as languageType,
    'common'
  )
  const [form] = Form.useForm()
  const [step, setStep] = useState(0)
  /** 编辑模式下：仅当用户改过「新密码」时才校验重复密码 */
  const [passwordDirty, setPasswordDirty] = useState(false)
  const [query, setQuery] = useState<Query>({ dataScope: 'platform', cinemaIds: [] })
  const scopeBaselineRef = useRef<{
    dataScope?: string
    brandId?: number | null
    cinemaIds?: number[]
  } | null>(null)
  /** 避免地区树异步就绪后对同一编辑会话重复请求 cinema/detail */
  const cinemaRegionHydratedForRef = useRef('')
  const [token, setToken] = useState('')
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([])
  const [cinemas, setCinemas] = useState<{ id: number; name: string }[]>([])
  const [addressTreeList, setAddressTreeList] = useState<
    AddressTreeListResponse[]
  >([])
  /** 影院级：地区级联 [regionId, prefectureId?]，仅 2 级，与 cinema/list 筛选一致 */
  const [cinemaAreaIds, setCinemaAreaIds] = useState<number[]>([])
  /** 影院级：列表按品牌进一步筛选（可选） */
  const [cinemaBrandFilter, setCinemaBrandFilter] = useState<number | undefined>(
    undefined
  )
  /** 非平台管理员不展示「数据权限」步骤及预览中的数据范围信息 */
  const [hideDataPermissionStep, setHideDataPermissionStep] = useState(false)
  /**
   * 穿梭框勾选态（antd 5：合并左右已选 key）。右侧「可管影院」默认应全选，便于再点移回左侧。
   */
  const [cinemaTransferSelectedKeys, setCinemaTransferSelectedKeys] = useState<
    string[]
  >([])

  const loadBrands = useCallback(() => {
    http({
      url: 'brand/list',
      method: 'post',
      data: { page: 1, pageSize: 200 }
    }).then((res) => {
      setBrands(res.data?.list || [])
    })
  }, [])

  const loadAddressTree = useCallback(() => {
    getAddressTreeList().then((res) => {
      const raw = res.data as unknown
      setAddressTreeList(Array.isArray(raw) ? (raw as AddressTreeListResponse[]) : [])
    })
  }, [])

  const loadCinemas = useCallback(
    (
      areaPath: number[],
      brandFilter?: number,
      /** 已绑定影院等：合并进列表，避免穿梭框右侧有 key 但左侧数据源缺失 */
      augment?: { id: number; name: string }[]
    ) => {
      const path = areaPath.slice(0, 2)
      const payload: Record<string, unknown> = { page: 1, pageSize: 500 }
      if (path[0] != null) {
        payload.regionId = path[0]
      }
      if (path[1] != null) {
        payload.prefectureId = path[1]
      }
      if (typeof brandFilter === 'number') {
        payload.brandId = brandFilter
      }
      return http({
        url: 'cinema/list',
        method: 'post',
        data: payload
      }).then((res) => {
        const list = (res.data?.list || []) as { id: number; name: string }[]
        const byId = new Map(list.map((c) => [c.id, c]))
        if (augment?.length) {
          for (const row of augment) {
            if (!byId.has(row.id)) {
              byId.set(row.id, {
                id: row.id,
                name: row.name?.trim() ? row.name : `#${row.id}`
              })
            }
          }
        }
        const merged = Array.from(byId.values())
        setCinemas(merged)
        setQuery((q) => {
          if (!q.cinemaIds?.length) {
            return q
          }
          const valid = new Set(merged.map((c) => c.id))
          const next = q.cinemaIds.filter((id) => valid.has(id))
          if (next.length === q.cinemaIds.length) {
            return q
          }
          return { ...q, cinemaIds: next }
        })
      })
    },
    []
  )

  const loadMeta = useCallback(() => {
    loadBrands()
    loadAddressTree()
    // 影院级影院列表在选定地区后再拉取，此处不预加载全量
  }, [loadBrands, loadAddressTree])

  const addressTreeTwoLevels = useMemo(
    () => trimAddressTreeToTwoLevels(addressTreeList),
    [addressTreeList]
  )

  const managedCinemaIdsKey = useMemo(
    () =>
      props.data?.cinemaIds == null || props.data.cinemaIds.length === 0
        ? ''
        : [...props.data.cinemaIds].sort((a, b) => a - b).join(','),
    [props.data?.cinemaIds]
  )

  /** 平台编辑「影院级」用户且已有可管影院时，用于回填地区 + 穿梭框 */
  const editCinemaHydrateSig = useMemo(() => {
    if (!props.show || props.type !== 'edit' || props.data?.id == null) {
      return ''
    }
    if ((props.data.dataScope || 'platform') !== 'cinema' || !managedCinemaIdsKey) {
      return ''
    }
    return `${props.data.id}:${managedCinemaIdsKey}`
  }, [
    props.show,
    props.type,
    props.data?.id,
    props.data?.dataScope,
    managedCinemaIdsKey
  ])

  useEffect(() => {
    if (!props.show) {
      setStep(0)
      setPasswordDirty(false)
      setCinemaAreaIds([])
      setCinemaBrandFilter(undefined)
      setHideDataPermissionStep(false)
      cinemaRegionHydratedForRef.current = ''
      setCinemaTransferSelectedKeys([])
      return
    }
    const hideDp = !isLoggedInPlatformScope()
    setHideDataPermissionStep(hideDp)
    setStep(hideDp ? STEP_ACCOUNT : STEP_DATA)
    setPasswordDirty(false)
    setCinemaAreaIds([])
    setCinemaBrandFilter(undefined)
    setCinemas([])
    if (!hideDp) {
      loadMeta()
    }
    form.resetFields()
    setToken('')
    if (props.type === 'edit' && props.data?.id != null) {
      const scopeInit = props.data.dataScope || 'platform'
      if (
        !isLoggedInPlatformScope() &&
        scopeInit === 'cinema' &&
        (props.data.cinemaIds?.length ?? 0) > 0
      ) {
        const ids = props.data.cinemaIds as number[]
        const names = props.data.cinemaNames ?? []
        setCinemas(
          ids.map((id, i) => ({
            id,
            name: (names[i] && String(names[i]).trim()) || `#${id}`
          }))
        )
      }
      const d: Query = {
        id: props.data.id,
        cover: props.data.cover,
        name: props.data.name,
        email: props.data.email,
        dataScope: scopeInit,
        brandId: props.data.brandId ?? null,
        cinemaIds:
          scopeInit === 'cinema'
            ? [...(props.data.cinemaIds ?? [])]
            : props.data.cinemaIds?.length
              ? [...props.data.cinemaIds]
              : []
      }
      form.setFieldsValue(d)
      setQuery(d)
      scopeBaselineRef.current = {
        dataScope: scopeInit,
        brandId: props.data.brandId ?? null,
        cinemaIds:
          scopeInit === 'cinema' ? [...(props.data.cinemaIds ?? [])] : []
      }
    } else {
      const init: Query = { dataScope: 'platform', cinemaIds: [] }
      form.setFieldsValue(init)
      setQuery(init)
      scopeBaselineRef.current = null
    }
  }, [props.show, props.type, props.data?.id, loadMeta, form])

  /** 当 targetKeys 对应的项已在 dataSource 中时，默认勾选右侧全部（及左侧用户点选） */
  useEffect(() => {
    const tk = (query.cinemaIds ?? []).map(String)
    if (tk.length === 0) {
      setCinemaTransferSelectedKeys([])
      return
    }
    const inDataSource = new Set(cinemas.map((c) => String(c.id)))
    if (!tk.every((k) => inDataSource.has(k))) {
      return
    }
    setCinemaTransferSelectedKeys((prev) => {
      const leftOnly = new Set(
        cinemas.map((c) => String(c.id)).filter((id) => !tk.includes(id))
      )
      const keepLeft = prev.filter((k) => leftOnly.has(String(k)))
      return Array.from(new Set([...keepLeft, ...tk]))
    })
  }, [cinemas, query.cinemaIds])

  /** 编辑影院级用户：根据已绑定影院拉取地区并加载穿梭框数据源 */
  useEffect(() => {
    if (!props.show) {
      cinemaRegionHydratedForRef.current = ''
      return
    }
    if (hideDataPermissionStep) {
      return
    }
    if (!editCinemaHydrateSig) {
      return
    }
    if (addressTreeList.length === 0) {
      return
    }
    if (cinemaRegionHydratedForRef.current === editCinemaHydrateSig) {
      return
    }

    const ids = props.data?.cinemaIds as number[] | undefined
    if (!ids?.length) {
      return
    }
    const names = (props.data?.cinemaNames as string[] | undefined) ?? []
    const augment = ids.map((id, i) => ({
      id,
      name: (names[i] && String(names[i]).trim()) || `#${id}`
    }))

    let cancelled = false
    ;(async () => {
      try {
        const res = await http({
          url: 'cinema/detail',
          method: 'get',
          params: { id: ids[0] }
        })
        if (cancelled) {
          return
        }
        const row = res.data as {
          regionId?: number
          prefectureId?: number
        }
        const areaPath = [row?.regionId, row?.prefectureId].filter(
          (x): x is number => x != null && Number.isFinite(Number(x))
        ) as number[]
        setCinemaAreaIds(areaPath)
        if (areaPath.length === 0) {
          message.warning(t('modal.form.cinemaRegion.hydrateFallback'))
          setCinemas(augment)
          if (!cancelled) {
            cinemaRegionHydratedForRef.current = editCinemaHydrateSig
          }
          return
        }
        await loadCinemas(areaPath, undefined, augment)
        if (!cancelled) {
          cinemaRegionHydratedForRef.current = editCinemaHydrateSig
        }
      } catch {
        if (!cancelled) {
          message.warning(t('modal.form.cinemaRegion.hydrateFallback'))
          setCinemas(augment)
          cinemaRegionHydratedForRef.current = editCinemaHydrateSig
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    props.show,
    hideDataPermissionStep,
    editCinemaHydrateSig,
    addressTreeList.length,
    loadCinemas,
    props.data?.cinemaIds,
    props.data?.cinemaNames
  ])

  const validateDataStep = (): boolean => {
    if (hideDataPermissionStep) {
      return true
    }
    const scope = query.dataScope || 'platform'
    if (scope === 'chain' && (query.brandId == null || query.brandId === undefined)) {
      message.error(t('modal.form.brand.required'))
      return false
    }
    if (scope === 'cinema') {
      if (cinemaAreaIds.length === 0) {
        message.error(t('modal.form.cinemaRegion.requiredFirst'))
        return false
      }
      if (!query.cinemaIds || query.cinemaIds.length === 0) {
        message.error(t('modal.form.cinemas.required'))
        return false
      }
    }
    return true
  }

  const firstStep = hideDataPermissionStep ? STEP_ACCOUNT : STEP_DATA

  /** 点击步骤条或「上/下一步」：后退任意跳；前进时按序校验（含预览步） */
  const goToStep = async (target: number) => {
    const tIdx = Math.max(firstStep, Math.min(STEP_SECURITY, target))
    if (tIdx === step) {
      return
    }
    if (tIdx < step) {
      setStep(tIdx)
      return
    }
    let s = step
    while (s < tIdx) {
      if (s === STEP_DATA) {
        if (!validateDataStep()) {
          return
        }
        s = STEP_ACCOUNT
        setStep(s)
        continue
      }
      if (s === STEP_ACCOUNT) {
        try {
          await form.validateFields(['name', 'email', 'password', 'password2'])
        } catch {
          return
        }
        s = STEP_PREVIEW
        setStep(s)
        continue
      }
      if (s === STEP_PREVIEW) {
        s = STEP_SECURITY
        setStep(s)
        continue
      }
      break
    }
  }

  const handleNext = () => {
    goToStep(step + 1).catch(() => {})
  }

  const handleSubmit = async () => {
    try {
      await form.validateFields(['code'])
    } catch {
      return
    }
    if (!validateDataStep()) {
      setStep(firstStep)
      return
    }
    const scope = query.dataScope || 'platform'
    const data: Record<string, unknown> = {
      ...query,
      token,
      dataScope: scope,
      brandId: scope === 'chain' ? query.brandId : null,
      cinemaIds: scope === 'cinema' ? query.cinemaIds : []
    }
    if (data.password) {
      data.password = md5(query.password as string)
    }
    delete data.password2
    http({
      url: 'admin/user/save',
      method: 'post',
      data
    }).then(() => {
      try {
        const me = getUserInfo() as { id?: number }
        if (query.id != null && me.id === query.id) {
          if (scopeFieldsChanged(scopeBaselineRef.current, scope, query)) {
            location.reload()
            return
          }
          const raw = localStorage.getItem('userInfo')
          if (raw) {
            const u = JSON.parse(raw) as Record<string, unknown>
            u.dataScope = scope
            u.brandId = scope === 'chain' ? query.brandId : null
            u.cinemaIds = scope === 'cinema' ? (query.cinemaIds ?? []) : []
            u.name = query.name
            u.cover = query.cover
            u.email = query.email
            localStorage.setItem('userInfo', JSON.stringify(u))
          }
        }
      } catch {
        /* noop */
      }
      props?.onConfirm?.()
    })
  }

  const cinemaTransferData: TransferItem[] = cinemas.map((c) => ({
    key: String(c.id),
    title: c.name || `#${c.id}`
  }))

  const previewCinemaLabel = useMemo(() => {
    const ids = query.cinemaIds || []
    if (ids.length === 0) {
      return '—'
    }
    const idSet = new Set(ids)
    const names = cinemas.filter((c) => idSet.has(c.id)).map((c) => c.name || `#${c.id}`)
    if (names.length) {
      return names.join('、')
    }
    return ids.map((id) => `#${id}`).join('、')
  }, [query.cinemaIds, cinemas])

  const previewBrandLabel = useMemo(() => {
    if ((query.dataScope || 'platform') !== 'chain' || query.brandId == null) {
      return '—'
    }
    return brands.find((b) => b.id === query.brandId)?.name ?? `ID ${query.brandId}`
  }, [query.dataScope, query.brandId, brands])

  return (
    <Modal
      title={
        props.type === 'edit' ? t('modal.title.edit') : t('modal.title.create')
      }
      open={props.show}
      maskClosable={false}
      width={960}
      styles={{
        body: {
          height: 'min(680px, calc(100vh - 320px))',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }
      }}
      onCancel={props?.onCancel}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Space>
            <Button onClick={() => props.onCancel?.()}>
              {common('button.cancel')}
            </Button>
            {step > firstStep ? (
              <Button
                onClick={() => {
                  goToStep(step - 1).catch(() => {})
                }}
              >
                {common('button.prev')}
              </Button>
            ) : null}
            {step < STEP_SECURITY ? (
              <Button type="primary" onClick={handleNext}>
                {common('button.next')}
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={() => {
                  handleSubmit().catch(() => {})
                }}
              >
                {common('button.ok')}
              </Button>
            )}
          </Space>
        </div>
      }
    >
      <Steps
        size="small"
        current={hideDataPermissionStep ? step - STEP_ACCOUNT : step}
        style={{ marginBottom: 16, flexShrink: 0 }}
        onChange={(index) => {
          goToStep(
            hideDataPermissionStep ? index + STEP_ACCOUNT : index
          ).catch(() => {})
        }}
        items={
          hideDataPermissionStep
            ? [
                { title: t('modal.steps.account') },
                { title: t('modal.steps.preview') },
                { title: t('modal.steps.security') }
              ]
            : [
                { title: t('modal.steps.dataPermission') },
                { title: t('modal.steps.account') },
                { title: t('modal.steps.preview') },
                { title: t('modal.steps.security') }
              ]
        }
      />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        <Form
          name="basic"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 900 }}
          form={form}
          preserve
        >
        {step === STEP_DATA && !hideDataPermissionStep ? (
          <>
            <Form.Item
              label={t('modal.form.dataScope.label')}
              name="dataScope"
              rules={[
                { required: true, message: t('modal.form.dataScope.required') }
              ]}
            >
              <Select
                value={query.dataScope || 'platform'}
                options={[
                  { value: 'platform', label: t('dataScope.platform') },
                  { value: 'chain', label: t('dataScope.chain') },
                  { value: 'cinema', label: t('dataScope.cinema') }
                ]}
                onChange={(v: string) => {
                  setQuery((q) => ({
                    ...q,
                    dataScope: v,
                    brandId: v === 'chain' ? q.brandId : null,
                    cinemaIds: v === 'cinema' ? [] : []
                  }))
                  form.setFieldValue('dataScope', v)
                  if (v !== 'chain') {
                    form.setFieldValue('brandId', null)
                  }
                  setCinemaAreaIds([])
                  setCinemaBrandFilter(undefined)
                  setCinemas([])
                }}
              />
            </Form.Item>
            {(query.dataScope || 'platform') === 'chain' ? (
              <Form.Item
                label={t('modal.form.brand.label')}
                name="brandId"
                rules={[
                  { required: true, message: t('modal.form.brand.required') }
                ]}
              >
                <Select
                  value={query.brandId ?? undefined}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder={t('modal.form.brand.placeholder')}
                  options={brands.map((b) => ({
                    value: b.id,
                    label: b.name
                  }))}
                  onChange={(v) => {
                    setQuery((q) => ({ ...q, brandId: v }))
                    form.setFieldValue('brandId', v)
                  }}
                />
              </Form.Item>
            ) : null}
            {(query.dataScope || 'platform') === 'cinema' ? (
              <>
                <Form.Item label={t('modal.form.cinemaRegion.label')} required>
                  <Cascader
                    allowClear
                    changeOnSelect
                    fieldNames={{ label: 'name', value: 'id' }}
                    options={addressTreeTwoLevels}
                    placeholder={t('modal.form.cinemaRegion.placeholder')}
                    value={
                      cinemaAreaIds.length ? cinemaAreaIds.slice(0, 2) : undefined
                    }
                    onChange={(value) => {
                      const ids = ((value as number[]) || []).slice(0, 2)
                      setCinemaAreaIds(ids)
                      if (!ids.length) {
                        setCinemas([])
                        setQuery((q) => ({ ...q, cinemaIds: [] }))
                        return
                      }
                      loadCinemas(ids, cinemaBrandFilter).catch(() => {})
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label={t('modal.form.cinemaBrand.label')}>
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    placeholder={t('modal.form.cinemaBrand.placeholder')}
                    value={cinemaBrandFilter}
                    disabled={cinemaAreaIds.length === 0}
                    options={brands.map((b) => ({
                      value: b.id,
                      label: b.name
                    }))}
                    onChange={(v) => {
                      const bid =
                        v === undefined || v === null ? undefined : Number(v)
                      setCinemaBrandFilter(bid)
                      if (cinemaAreaIds.length) {
                        loadCinemas(cinemaAreaIds, bid).catch(() => {})
                      }
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item
                  label={t('modal.form.cinemas.label')}
                  required
                  extra={
                    cinemaAreaIds.length === 0
                      ? t('modal.form.cinemas.pickRegionHint')
                      : undefined
                  }
                >
                  <Transfer
                    disabled={cinemaAreaIds.length === 0}
                    dataSource={cinemaTransferData}
                    titles={[t('table.cinemas'), t('modal.form.cinemas.label')]}
                    targetKeys={(query.cinemaIds || []).map(String)}
                    selectedKeys={cinemaTransferSelectedKeys}
                    onSelectChange={(sourceKeys, targetKeys) => {
                      setCinemaTransferSelectedKeys([
                        ...sourceKeys.map(String),
                        ...targetKeys.map(String)
                      ])
                    }}
                    onChange={(keys) => {
                      const nums = keys.map((k) => Number(k))
                      setQuery((q) => ({ ...q, cinemaIds: nums }))
                      setCinemaTransferSelectedKeys(keys.map(String))
                    }}
                    render={(item) => item.title || ''}
                    listStyle={{ width: 340, height: 300 }}
                    showSearch
                    filterOption={(input, item) =>
                      String(item.title || '')
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </>
            ) : null}
          </>
        ) : null}

        {step === STEP_ACCOUNT ? (
          <>
            <Form.Item
              label={t('modal.form.cover.label')}
              rules={[
                { required: false, message: t('modal.form.cover.required') }
              ]}
              name="cover"
            >
              <Upload
                value={query.cover || ''}
                crop={true}
                cropperOptions={{
                  aspectRatio: 1,
                  cropBoxResizable: false,
                  minCropBoxWidth: 100,
                  minCropBoxHeight: 100
                }}
                onChange={(val) => {
                  setQuery((q) => ({ ...q, cover: val }))
                  form.setFieldValue('cover', val)
                }}
              />
            </Form.Item>
            <Form.Item
              label={t('modal.form.username.label')}
              name="name"
              rules={[
                { required: true, message: t('modal.form.username.required') },
                {
                  pattern: usernameRegExp,
                  validateTrigger: ['onChange', 'onBlur'],
                  message: t('modal.form.username.error')
                }
              ]}
            >
              <Input
                value={query.name}
                onChange={(e) => {
                  const v = e.currentTarget.value
                  setQuery((q) => ({ ...q, name: v }))
                  form.setFieldValue('name', v)
                }}
              />
            </Form.Item>
            <Form.Item
              label={t('modal.form.email.label')}
              name="email"
              rules={[
                {
                  required: true,
                  message: t('modal.form.email.required')
                },
                {
                  pattern: emailRegExp,
                  validateTrigger: ['onChange', 'onBlur'],
                  message: t('modal.form.email.error')
                }
              ]}
            >
              <Input
                value={query.email}
                onChange={(e) => {
                  const v = e.currentTarget.value
                  setQuery((q) => ({ ...q, email: v }))
                  form.setFieldValue('email', v)
                }}
              />
            </Form.Item>
            <Form.Item
              label={t('modal.form.password.label')}
              name="password"
              rules={[
                {
                  validator: async (_: unknown, value: string | undefined) => {
                    const v = value ?? ''
                    if (!v.length) {
                      return props.type === 'create'
                        ? Promise.reject(
                            new Error(t('modal.form.password.required'))
                          )
                        : Promise.resolve()
                    }
                    if (!passwordRegExp.test(v)) {
                      return Promise.reject(
                        new Error(t('modal.form.password.error'))
                      )
                    }
                    return Promise.resolve()
                  }
                }
              ]}
            >
              <Input.Password
                autoComplete="new-password"
                value={query.password}
                onChange={(e) => {
                  const v = e.currentTarget.value
                  if (props.type === 'edit') {
                    const dirty = v.length > 0
                    setPasswordDirty(dirty)
                    if (!dirty) {
                      setQuery((q) => ({
                        ...q,
                        password: '',
                        password2: ''
                      }))
                      form.setFieldsValue({ password: '', password2: '' })
                      Promise.resolve()
                        .then(() => form.validateFields(['password2']))
                        .catch(() => null)
                      return
                    }
                  }
                  setQuery((q) => ({ ...q, password: v }))
                  form.setFieldValue('password', v)
                }}
              />
            </Form.Item>
            <Form.Item
              label={t('modal.form.password2.label')}
              name="password2"
              dependencies={['password']}
              rules={[
                {
                  validator: async (_: unknown, value: string | undefined) => {
                    if (props.type === 'create') {
                      if (!value?.length) {
                        return Promise.reject(
                          new Error(t('modal.form.password2.required'))
                        )
                      }
                      const pwd = (form.getFieldValue('password') as
                        | string
                        | undefined) ?? ''
                      if (pwd !== value) {
                        return Promise.reject(
                          new Error(t('modal.form.password2.repeat'))
                        )
                      }
                      if (!passwordRegExp.test(value)) {
                        return Promise.reject(
                          new Error(t('modal.form.password.error'))
                        )
                      }
                      return Promise.resolve()
                    }
                    if (!passwordDirty) {
                      return Promise.resolve()
                    }
                    const pwd =
                      (form.getFieldValue('password') as string | undefined) ??
                      ''
                    if (!pwd.trim()) {
                      return Promise.resolve()
                    }
                    if (!value?.length) {
                      return Promise.reject(
                        new Error(t('modal.form.password2.required'))
                      )
                    }
                    if (pwd !== value) {
                      return Promise.reject(
                        new Error(t('modal.form.password2.repeat'))
                      )
                    }
                    if (!passwordRegExp.test(value)) {
                      return Promise.reject(
                        new Error(t('modal.form.password.error'))
                      )
                    }
                    return Promise.resolve()
                  }
                }
              ]}
            >
              <Input.Password
                autoComplete="new-password"
                value={query.password2}
                onChange={(e) => {
                  const v = e.currentTarget.value
                  setQuery((q) => ({ ...q, password2: v }))
                  form.setFieldValue('password2', v)
                }}
              />
            </Form.Item>
          </>
        ) : null}

        {step === STEP_PREVIEW ? (
          <div style={{ paddingRight: 8 }}>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              {t('modal.preview.title')}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
              {t('modal.preview.hint')}
            </Typography.Paragraph>
            <Space align="start" size={16} style={{ marginBottom: 20 }}>
              <Avatar size={72} src={getURL(query.cover || DEFAULT_AVATAR_PLACEHOLDER)} />
            </Space>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label={t('modal.form.username.label')}>
                {query.name || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('modal.form.email.label')}>
                {query.email || '—'}
              </Descriptions.Item>
              {!hideDataPermissionStep ? (
                <>
                  <Descriptions.Item label={t('modal.form.dataScope.label')}>
                    {t(
                      `dataScope.${
                        query.dataScope === 'chain' || query.dataScope === 'cinema'
                          ? query.dataScope
                          : 'platform'
                      }`
                    )}
                  </Descriptions.Item>
                  {(query.dataScope || 'platform') === 'chain' ? (
                    <Descriptions.Item label={t('modal.form.brand.label')}>
                      {previewBrandLabel}
                    </Descriptions.Item>
                  ) : null}
                  {(query.dataScope || 'platform') === 'cinema' ? (
                    <Descriptions.Item label={t('modal.form.cinemas.label')}>
                      {previewCinemaLabel}
                    </Descriptions.Item>
                  ) : null}
                </>
              ) : null}
              <Descriptions.Item label={t('modal.form.password.label')}>
                {(query.password ?? '').length > 0
                  ? t('modal.preview.passwordChange')
                  : t('modal.preview.passwordKeep')}
              </Descriptions.Item>
            </Descriptions>
          </div>
        ) : null}

        {step === STEP_SECURITY ? (
          <Form.Item
            label={t('modal.form.verifyCode.label')}
            rules={[
              {
                required: true,
                message: t('modal.form.verifyCode.required')
              },
              {
                pattern: /^\d{6}$/,
                validateTrigger: ['onChange', 'onBlur'],
                message: t('modal.form.verifyCode.length')
              }
            ]}
            name="code"
          >
            <VerifyCode
              value={query.code ?? ''}
              query={{
                email: query.email
              }}
              onChange={(val) => {
                setQuery((q) => ({ ...q, code: val }))
                form.setFieldValue('code', val)
              }}
              onSuccess={(res) => {
                setToken(res.data.token)
              }}
            />
          </Form.Item>
        ) : null}
        </Form>
      </div>
    </Modal>
  )
}
