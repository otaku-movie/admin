'use client'
import React, { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Empty,
  Flex,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message
} from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import { useRouter } from '@bprogress/next/app'
import { useSearchParams } from 'next/navigation'

import http from '@/api'
import { useTranslation } from '@/app/i18n/client'
import { CheckPermission } from '@/components/checkPermission'
import { CustomAntImage } from '@/components/CustomAntImage'
import { notFoundImage } from '@/config/index'
import {
  getMovieMergeDetail,
  mergeMovies,
  resolveMoviePendingMatch
} from '@/api/request/movie'
import {
  MovieMergeDetail,
  MovieMergeDetailCounts,
  MovieMergeFieldOverrides,
  MovieMergeVersionBrief
} from '@/type/api'

interface PageProps {
  params: { lng: string }
}

// 特典 / 预售 / 重映按外键自动合并，不在此展示；保留场次与内容质量相关计数。
const COUNT_KEYS: (keyof MovieMergeDetailCounts)[] = [
  'show',
  'comment',
  'rate',
  'version',
  'staff',
  'character',
  'spec',
  'tag'
]

type OverrideKey = keyof MovieMergeFieldOverrides
type FieldValue = string | number | undefined
type EditorType = 'text' | 'textarea' | 'number' | 'date' | 'level' | 'cover'

interface LevelOption {
  id: number
  name: string
}

/** 标量字段定义：value 用于「应用 / 比较」，display 用于渲染，editor 决定结果列编辑控件。 */
interface FieldDef {
  key: string
  labelKey: string
  overrideKey: OverrideKey
  editor: EditorType
  value: (m: MovieMergeDetail) => FieldValue
  display: (m: MovieMergeDetail) => React.ReactNode
}

interface FieldRow {
  key: string
  def: FieldDef
}

const HL_DIFF = '#fffbe6'
const HL_APPLIED = '#f6ffed'

const norm = (v: FieldValue): string =>
  v === undefined || v === null || v === '' ? '' : String(v)
const valEq = (a: FieldValue, b: FieldValue) => norm(a) === norm(b)

export default function Page ({ params: { lng } }: Readonly<PageProps>) {
  const { t } = useTranslation(lng, 'movieMerge')
  const router = useRouter()
  const searchParams = useSearchParams()

  const ids = useMemo<number[]>(() => {
    const raw = searchParams.get('ids') ?? ''
    return raw
      .split(',')
      .map((x) => Number(x.trim()))
      .filter((x) => Number.isFinite(x) && x > 0)
  }, [searchParams])
  const pendingId = searchParams.get('pendingId')
    ? Number(searchParams.get('pendingId'))
    : undefined
  const querySurvivorId = searchParams.get('survivorId')
    ? Number(searchParams.get('survivorId'))
    : undefined

  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState<MovieMergeDetail[]>([])
  const [survivorId, setSurvivorId] = useState<number | undefined>(querySurvivorId)
  const [loserIds, setLoserIds] = useState<number[]>([])
  const [overrides, setOverrides] = useState<MovieMergeFieldOverrides>({})
  const [appliedFrom, setAppliedFrom] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [levels, setLevels] = useState<LevelOption[]>([])

  useEffect(() => {
    http({
      url: 'movie/level/list',
      method: 'post',
      data: { page: 1, pageSize: 200 }
    })
      .then((res) => {
        const list = (res.data?.list ?? []) as LevelOption[]
        setLevels(list)
      })
      .catch(() => {
        /* 分级下拉拉取失败不阻塞主流程 */
      })
  }, [])

  useEffect(() => {
    if (ids.length === 0) return
    setLoading(true)
    getMovieMergeDetail({ ids })
      .then((res) => {
        const list = res.data ?? []
        setDetails(list)
        const initSurvivor = querySurvivorId ?? list[0]?.id
        setSurvivorId(initSurvivor)
        setLoserIds(list.filter((it) => it.id !== initSurvivor).map((it) => it.id))
        setOverrides({})
        setAppliedFrom({})
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const survivorMovie = useMemo(
    () => details.find((d) => d.id === survivorId),
    [details, survivorId]
  )

  const versionLabel = (v: MovieMergeVersionBrief) => {
    const base =
      v.versionCode === 2
        ? t('detail.dubbed')
        : v.versionCode === 1
          ? t('detail.original')
          : t('detail.versionOther')
    return v.language ? `${base} · ${v.language}` : base
  }

  const fieldDefs: FieldDef[] = useMemo(
    () => [
      {
        key: 'cover',
        labelKey: 'fields.cover',
        overrideKey: 'cover',
        editor: 'cover',
        value: (m) => m.cover,
        display: (m) =>
          m.cover ? (
            <CustomAntImage
              src={m.cover}
              fallback={notFoundImage}
              width={56}
              height={80}
              style={{ objectFit: 'cover', borderRadius: 4 }}
            />
          ) : (
            <span style={{ color: '#bbb' }}>--</span>
          )
      },
      {
        key: 'name',
        labelKey: 'fields.name',
        overrideKey: 'name',
        editor: 'text',
        value: (m) => m.name,
        display: (m) => m.name || '--'
      },
      {
        key: 'originalName',
        labelKey: 'fields.originalName',
        overrideKey: 'originalName',
        editor: 'text',
        value: (m) => m.originalName,
        display: (m) => m.originalName || '--'
      },
      {
        key: 'tmdbId',
        labelKey: 'fields.tmdbId',
        overrideKey: 'tmdbId',
        editor: 'number',
        value: (m) => m.tmdbId,
        display: (m) => (m.tmdbId ? String(m.tmdbId) : '--')
      },
      {
        key: 'releaseDate',
        labelKey: 'fields.releaseDate',
        overrideKey: 'releaseDate',
        editor: 'date',
        value: (m) => m.releaseDate,
        display: (m) => m.releaseDate || '--'
      },
      {
        key: 'runtime',
        labelKey: 'fields.runtime',
        overrideKey: 'runtime',
        editor: 'number',
        value: (m) => m.runtime,
        display: (m) => (m.runtime ? `${m.runtime} min` : '--')
      },
      {
        key: 'level',
        labelKey: 'fields.level',
        overrideKey: 'levelId',
        editor: 'level',
        value: (m) => m.levelId,
        display: (m) => m.levelName || '--'
      },
      {
        key: 'description',
        labelKey: 'fields.description',
        overrideKey: 'description',
        editor: 'textarea',
        value: (m) => m.description,
        display: (m) =>
          m.description ? (
            <Typography.Paragraph
              style={{ fontSize: 12, marginBottom: 0, whiteSpace: 'pre-wrap' }}
              ellipsis={{ rows: 4, expandable: true, symbol: t('detail.more') }}
            >
              {m.description}
            </Typography.Paragraph>
          ) : (
            '--'
          )
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t]
  )

  const chooseSurvivor = (id: number) => {
    setSurvivorId(id)
    // 切换保留行后，其余候选行默认全部勾选为待合并行。
    setLoserIds(details.filter((it) => it.id !== id).map((it) => it.id))
    // 保留行变了，之前相对旧保留行的「应用」结果失效，重置。
    setOverrides({})
    setAppliedFrom({})
  }

  const toggleLoser = (id: number, checked: boolean) => {
    setLoserIds((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)
    )
  }

  const effectiveValue = (def: FieldDef): FieldValue => {
    const ov = overrides[def.overrideKey]
    if (ov !== undefined) return ov as FieldValue
    return survivorMovie ? def.value(survivorMovie) : undefined
  }

  const applyField = (def: FieldDef, from: MovieMergeDetail) => {
    const isSurvivorValue = survivorMovie && valEq(def.value(from), def.value(survivorMovie))
    if (isSurvivorValue) {
      // 采用的就是保留行原值：无需覆盖，回到默认即可。
      revertField(def)
      return
    }
    setOverrides((prev) => ({ ...prev, [def.overrideKey]: def.value(from) }))
    setAppliedFrom((prev) => ({ ...prev, [def.key]: from.id }))
  }

  const revertField = (def: FieldDef) => {
    setOverrides((prev) => {
      const next = { ...prev }
      delete next[def.overrideKey]
      return next
    })
    setAppliedFrom((prev) => {
      const next = { ...prev }
      delete next[def.key]
      return next
    })
  }

  /** 候选列单元格：与「合并后结果」一致＝绿色当前值；不同＝黄色 + 可应用。 */
  const renderFieldCell = (def: FieldDef, movie: MovieMergeDetail) => {
    const eff = effectiveValue(def)
    const mine = def.value(movie)
    const isCurrent = valEq(mine, eff)
    return (
      <div style={{ background: isCurrent ? HL_APPLIED : HL_DIFF, padding: 6, borderRadius: 4 }}>
        {def.display(movie)}
        <div style={{ marginTop: 4 }}>
          {isCurrent ? (
            <Tag color="green" style={{ marginInlineEnd: 0 }}>
              {t('detail.current')}
            </Tag>
          ) : (
            <Button
              size="small"
              type="link"
              style={{ padding: 0, height: 'auto' }}
              onClick={() => applyField(def, movie)}
            >
              {t('detail.apply')}
            </Button>
          )}
        </div>
      </div>
    )
  }

  /** 手动编辑结果值：空值＝回退到保留行原值（不下发空覆盖）。 */
  const editResult = (def: FieldDef, raw: FieldValue) => {
    const value = raw === '' || raw === null || raw === undefined ? undefined : raw
    if (value === undefined) {
      revertField(def)
      return
    }
    setOverrides((prev) => ({ ...prev, [def.overrideKey]: value }))
    // 手动编辑后清除「来自某行」来源标记。
    setAppliedFrom((prev) => {
      const next = { ...prev }
      delete next[def.key]
      return next
    })
  }

  const renderResultEditor = (def: FieldDef) => {
    const eff = effectiveValue(def)
    switch (def.editor) {
      case 'textarea':
        return (
          <Input.TextArea
            size="small"
            autoSize={{ minRows: 2, maxRows: 6 }}
            value={(eff as string) ?? ''}
            onChange={(e) => editResult(def, e.target.value)}
          />
        )
      case 'number':
        return (
          <InputNumber
            size="small"
            style={{ width: '100%' }}
            value={(eff as number) ?? null}
            onChange={(v) => editResult(def, v ?? undefined)}
          />
        )
      case 'date':
        return (
          <DatePicker
            size="small"
            style={{ width: '100%' }}
            value={eff ? dayjs(eff as string) : null}
            onChange={(d) => editResult(def, d ? d.format('YYYY-MM-DD') : undefined)}
          />
        )
      case 'level':
        return (
          <Select
            size="small"
            allowClear
            style={{ width: '100%' }}
            value={(eff as number) ?? undefined}
            options={levels.map((l) => ({ label: l.name, value: l.id }))}
            onChange={(v) => editResult(def, v ?? undefined)}
          />
        )
      case 'cover':
        return (
          <Flex vertical gap={6}>
            {eff ? (
              <CustomAntImage
                src={eff as string}
                fallback={notFoundImage}
                width={56}
                height={80}
                style={{ objectFit: 'cover', borderRadius: 4 }}
              />
            ) : null}
            <Input
              size="small"
              allowClear
              placeholder={t('detail.coverUrlPlaceholder')}
              value={(eff as string) ?? ''}
              onChange={(e) => editResult(def, e.target.value)}
            />
          </Flex>
        )
      default:
        return (
          <Input
            size="small"
            allowClear
            value={(eff as string) ?? ''}
            onChange={(e) => editResult(def, e.target.value)}
          />
        )
    }
  }

  /** 「合并后结果」列：可编辑控件 + 来源标记。 */
  const renderResultCell = (def: FieldDef) => {
    const applied = overrides[def.overrideKey] !== undefined
    return (
      <div style={{ background: '#e6f4ff', padding: 6, borderRadius: 4 }}>
        {renderResultEditor(def)}
        {applied ? (
          <div style={{ marginTop: 4 }}>
            <Space size={6}>
              <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                {appliedFrom[def.key] != null
                  ? t('detail.appliedFrom', { id: appliedFrom[def.key] })
                  : t('detail.edited')}
              </Tag>
              <a onClick={() => revertField(def)}>{t('detail.revert')}</a>
            </Space>
          </div>
        ) : null}
      </div>
    )
  }

  const columnHeader = (movie: MovieMergeDetail) => {
    const isSurvivor = movie.id === survivorId
    return (
      <Space direction="vertical" size={2} style={{ width: '100%' }}>
        <Space size={6} wrap>
          <Radio checked={isSurvivor} onChange={() => chooseSurvivor(movie.id)}>
            {t('detail.keepThis')}
          </Radio>
          {isSurvivor ? (
            <Tag color="blue">{t('detail.survivorTag')}</Tag>
          ) : (
            <Checkbox
              checked={loserIds.includes(movie.id)}
              onChange={(e) => toggleLoser(movie.id, e.target.checked)}
            >
              {t('detail.mergeThis')}
            </Checkbox>
          )}
        </Space>
        <Space size={4} wrap style={{ fontWeight: 'normal' }}>
          <span style={{ color: '#999', fontSize: 12 }}>ID: {movie.id}</span>
          {movie.deleted === 1 ? (
            <Tag color="red">{t('status.deleted')}</Tag>
          ) : (
            <Tag color="green">{t('status.active')}</Tag>
          )}
          {movie.movieKey ? (
            <Typography.Text type="secondary" style={{ fontSize: 11 }} copyable={{ text: movie.movieKey }}>
              {movie.movieKey.length > 18 ? `${movie.movieKey.slice(0, 18)}…` : movie.movieKey}
            </Typography.Text>
          ) : null}
        </Space>
      </Space>
    )
  }

  const compareColumns: TableColumnsType<FieldRow> = [
    {
      title: t('detail.field'),
      key: 'field',
      width: 110,
      fixed: 'left',
      render: (_, row) => (
        <Typography.Text strong style={{ fontSize: 13 }}>
          {t(`detail.${row.def.labelKey}`)}
        </Typography.Text>
      )
    },
    {
      title: (
        <Space direction="vertical" size={2}>
          <Tag color="blue">{t('detail.resultColumn')}</Tag>
          <span style={{ color: '#999', fontSize: 12, fontWeight: 'normal' }}>
            {t('detail.resultHint', { id: survivorId ?? '-' })}
          </span>
        </Space>
      ),
      key: 'result',
      width: 240,
      fixed: 'left',
      render: (_: unknown, row: FieldRow) => renderResultCell(row.def)
    },
    ...details.map((movie) => ({
      title: columnHeader(movie),
      key: String(movie.id),
      width: 240,
      render: (_: unknown, row: FieldRow) => renderFieldCell(row.def, movie)
    }))
  ]

  const compareRows: FieldRow[] = fieldDefs.map((def) => ({ key: def.key, def }))

  // 关联计数每指标的最大值（高亮数据更全的一列）。
  const maxByKey = useMemo(() => {
    const acc = {} as Record<keyof MovieMergeDetailCounts, number>
    COUNT_KEYS.forEach((k) => {
      acc[k] = Math.max(0, ...details.map((d) => d.counts?.[k] ?? 0))
    })
    return acc
  }, [details])

  // 保留行的关系型集合，用于「将并入」高亮。
  const survivorSets = useMemo(() => {
    const versions = new Set(
      (survivorMovie?.versions ?? []).map((v) => `${v.versionCode ?? ''}|${v.language ?? ''}`)
    )
    const staff = new Set(
      (survivorMovie?.staff ?? []).map((s) => `${s.name ?? ''}|${s.position ?? ''}`)
    )
    const characters = new Set(survivorMovie?.characters ?? [])
    const tags = new Set(survivorMovie?.tags ?? [])
    const specs = new Set(survivorMovie?.specs ?? [])
    return { versions, staff, characters, tags, specs }
  }, [survivorMovie])

  const doMerge = () => {
    if (!survivorId) {
      message.warning(t('message.needSurvivor'))
      return
    }
    const losers = loserIds.filter((id) => id !== survivorId)
    if (losers.length === 0) {
      message.warning(t('message.needLoser'))
      return
    }
    const fieldOverrides: MovieMergeFieldOverrides = { ...overrides }
    const hasOverrides = Object.keys(fieldOverrides).length > 0
    Modal.confirm({
      title: t('confirm.title'),
      content: t('confirm.content', { count: losers.length }),
      onOk () {
        setSubmitting(true)
        const payload = {
          survivorId,
          loserIds: losers,
          ...(hasOverrides ? { fieldOverrides } : {})
        }
        const request = pendingId
          ? resolveMoviePendingMatch({ pendingId, action: 'merge' as const, ...payload })
          : mergeMovies(payload)
        return request
          .then(() => {
            message.success(t('message.success'))
            router.back()
          })
          .finally(() => setSubmitting(false))
      }
    })
  }

  interface RelationItem {
    key: string
    label: string
  }
  interface RelationRow {
    key: string
    label: string
    kind: 'count' | 'list'
    countKey?: keyof MovieMergeDetailCounts
    membership?: Set<string>
    tagColor?: string
    getItems?: (m: MovieMergeDetail) => RelationItem[]
  }

  const relationRows: RelationRow[] = [
    { key: 'show', label: t('counts.show'), kind: 'count', countKey: 'show' },
    { key: 'comment', label: t('counts.comment'), kind: 'count', countKey: 'comment' },
    { key: 'rate', label: t('counts.rate'), kind: 'count', countKey: 'rate' },
    {
      key: 'specs',
      label: t('counts.spec'),
      kind: 'list',
      tagColor: 'geekblue',
      membership: survivorSets.specs,
      getItems: (m) => (m.specs ?? []).map((s) => ({ key: s, label: s }))
    },
    {
      key: 'versions',
      label: t('detail.versions'),
      kind: 'list',
      membership: survivorSets.versions,
      getItems: (m) =>
        (m.versions ?? []).map((v) => ({
          key: `${v.versionCode ?? ''}|${v.language ?? ''}`,
          label: versionLabel(v)
        }))
    },
    {
      key: 'staff',
      label: t('detail.staff'),
      kind: 'list',
      membership: survivorSets.staff,
      getItems: (m) =>
        (m.staff ?? []).map((s) => ({
          key: `${s.name ?? ''}|${s.position ?? ''}`,
          label: s.position ? `${s.name ?? '--'} · ${s.position}` : s.name ?? '--'
        }))
    },
    {
      key: 'characters',
      label: t('detail.characters'),
      kind: 'list',
      tagColor: 'purple',
      membership: survivorSets.characters,
      getItems: (m) => (m.characters ?? []).map((c) => ({ key: c, label: c }))
    },
    {
      key: 'tags',
      label: t('detail.tags'),
      kind: 'list',
      tagColor: 'cyan',
      membership: survivorSets.tags,
      getItems: (m) => (m.tags ?? []).map((tg) => ({ key: tg, label: tg }))
    }
  ]

  const renderRelationCell = (row: RelationRow, movie: MovieMergeDetail) => {
    const isSurvivor = movie.id === survivorId
    if (row.kind === 'count') {
      const val = movie.counts?.[row.countKey as keyof MovieMergeDetailCounts] ?? 0
      const isMax = val > 0 && val === maxByKey[row.countKey as keyof MovieMergeDetailCounts]
      return (
        <span style={{ color: isMax ? '#1677ff' : undefined, fontWeight: isMax ? 600 : 400 }}>
          {val}
        </span>
      )
    }
    const items = row.getItems?.(movie) ?? []
    if (!items.length) {
      return <span style={{ color: '#bbb' }}>--</span>
    }
    return (
      <Space size={[4, 4]} wrap>
        {items.map((it, i) => {
          const willMerge = !isSurvivor && row.membership ? !row.membership.has(it.key) : false
          return (
            <Tag
              key={`${it.key}-${i}`}
              color={willMerge ? 'green' : row.tagColor}
              title={willMerge ? t('detail.willMergeIn') : undefined}
            >
              {it.label}
            </Tag>
          )
        })}
      </Space>
    )
  }

  // 关联数据的「合并后结果」：计数求和、列表并集去重（场次等按外键自动汇总到保留行）。
  const renderRelationMerged = (row: RelationRow) => {
    if (row.kind === 'count') {
      const total = details.reduce(
        (sum, d) => sum + (d.counts?.[row.countKey as keyof MovieMergeDetailCounts] ?? 0),
        0
      )
      return <span style={{ color: '#1677ff', fontWeight: 600 }}>{total}</span>
    }
    const merged = new Map<string, string>()
    details.forEach((d) =>
      (row.getItems?.(d) ?? []).forEach((it) => {
        if (!merged.has(it.key)) merged.set(it.key, it.label)
      })
    )
    const items = [...merged.entries()]
    if (!items.length) {
      return <span style={{ color: '#bbb' }}>--</span>
    }
    return (
      <Space size={[4, 4]} wrap>
        {items.map(([key, label], i) => (
          <Tag key={`${key}-${i}`} color={row.tagColor}>
            {label}
          </Tag>
        ))}
      </Space>
    )
  }

  const relationHeader = (movie: MovieMergeDetail) => {
    const isSurvivor = movie.id === survivorId
    return (
      <Space size={6} wrap>
        <span style={{ color: '#666' }}>ID: {movie.id}</span>
        {isSurvivor ? <Tag color="blue">{t('detail.survivorTag')}</Tag> : null}
      </Space>
    )
  }

  const relationColumns: TableColumnsType<RelationRow> = [
    {
      title: t('detail.category'),
      key: 'category',
      width: 90,
      fixed: 'left',
      render: (_, row) => (
        <Typography.Text strong style={{ fontSize: 13 }}>
          {row.label}
        </Typography.Text>
      )
    },
    {
      title: <Tag color="blue">{t('detail.mergedColumn')}</Tag>,
      key: 'merged',
      width: 260,
      fixed: 'left',
      onCell: () => ({ style: { background: '#f0f7ff' } }),
      render: (_: unknown, row: RelationRow) => renderRelationMerged(row)
    },
    ...details.map((movie) => ({
      title: relationHeader(movie),
      key: String(movie.id),
      width: 300,
      render: (_: unknown, row: RelationRow) => renderRelationCell(row, movie)
    }))
  ]

  const appliedCount = Object.keys(overrides).length

  return (
    <section>
      <Flex vertical gap={16}>
        <Flex justify="space-between" align="center" wrap gap={12}>
          <Space>
            <Button onClick={() => router.back()}>{t('detail.back')}</Button>
            <Typography.Title level={5} style={{ margin: 0 }}>
              {t('detail.title')}
            </Typography.Title>
          </Space>
          <Space wrap>
            <span style={{ color: '#999' }}>
              {t('survivorHint', {
                id: survivorId ?? '-',
                count: loserIds.filter((id) => id !== survivorId).length
              })}
            </span>
            {appliedCount > 0 ? (
              <Tag color="green">{t('detail.appliedCount', { count: appliedCount })}</Tag>
            ) : null}
            <CheckPermission code="movie.merge">
              <Button type="primary" loading={submitting} onClick={doMerge}>
                {t('mergeButton')}
              </Button>
            </CheckPermission>
          </Space>
        </Flex>

        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {t('detail.legend')}
        </Typography.Text>

        <Spin spinning={loading}>
          {!loading && details.length === 0 ? (
            <Empty description={t('detail.empty')} />
          ) : (
            <Flex vertical gap={20}>
              <Card size="small" title={t('detail.basicCompare')} styles={{ body: { padding: 0 } }}>
                <Table<FieldRow>
                  rowKey="key"
                  size="small"
                  bordered
                  pagination={false}
                  columns={compareColumns}
                  dataSource={compareRows}
                  scroll={{ x: 'max-content' }}
                />
              </Card>

              <Card size="small" title={t('detail.relationCompare')} styles={{ body: { padding: 0 } }}>
                <Table<RelationRow>
                  rowKey="key"
                  size="small"
                  bordered
                  pagination={false}
                  columns={relationColumns}
                  dataSource={relationRows}
                  scroll={{ x: 'max-content' }}
                />
              </Card>
            </Flex>
          )}
        </Spin>
      </Flex>
    </section>
  )
}
