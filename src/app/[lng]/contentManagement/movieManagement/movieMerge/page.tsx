'use client'
import React, { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Empty,
  Flex,
  Input,
  Modal,
  Pagination,
  Radio,
  Space,
  Table,
  Tabs,
  Tag,
  message
} from 'antd'
import type { TableColumnsType } from 'antd'

import { useRouter } from '@bprogress/next/app'

import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../../layout'
import { CheckPermission } from '@/components/checkPermission'
import { processPath } from '@/config/router'
import { showTotal } from '@/utils/pagination'
import {
  getMovieDuplicates,
  getMoviePendingMatches,
  mergeMovies,
  resolveMoviePendingMatch,
  searchMoviesForMerge
} from '@/api/request/movie'
import { MovieDuplicateGroup, MovieDuplicateItem, MoviePendingMatch } from '@/type/api'

interface MergePanelProps {
  lng: string
  items: MovieDuplicateItem[]
  defaultSurvivorId?: number
  pendingId?: number
  onMerged: () => void
}

/**
 * 一组候选行的「选存活行 + 勾合并行 + 改名 + 合并」面板。
 * 自动模式（每个候选组）和手动模式（搜索结果）共用。
 */
function MergePanel ({ lng, items, defaultSurvivorId, pendingId, onMerged }: Readonly<MergePanelProps>) {
  const { t } = useTranslation(lng, 'movieMerge')
  const router = useRouter()

  const initialSurvivor = defaultSurvivorId ?? items[0]?.id
  const [survivorId, setSurvivorId] = useState<number | undefined>(initialSurvivor)
  const [loserIds, setLoserIds] = useState<number[]>(
    items.filter((it) => it.id !== initialSurvivor).map((it) => it.id)
  )
  const [newName, setNewName] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const chooseSurvivor = (id: number) => {
    setSurvivorId(id)
    setLoserIds((prev) => prev.filter((x) => x !== id))
  }

  const columns: TableColumnsType<MovieDuplicateItem> = [
    {
      title: t('column.survivor'),
      width: 70,
      align: 'center',
      render: (_, row) => (
        <Radio
          checked={survivorId === row.id}
          onChange={() => chooseSurvivor(row.id)}
        />
      )
    },
    {
      title: t('column.id'),
      dataIndex: 'id',
      width: 80
    },
    {
      title: t('column.name'),
      dataIndex: 'name',
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          <span>{row.name}</span>
          <Space size={4} wrap>
            {row.deleted === 1 ? (
              <Tag color="red">{t('status.deleted')}</Tag>
            ) : (
              <Tag color="green">{t('status.active')}</Tag>
            )}
            {row.tmdbId ? <Tag color="blue">tmdb:{row.tmdbId}</Tag> : null}
          </Space>
        </Space>
      )
    },
    {
      title: t('column.movieKey'),
      dataIndex: 'movieKey',
      width: 200,
      render: (v: string) => v || '--'
    },
    {
      title: t('column.showCount'),
      dataIndex: 'showCount',
      width: 90,
      align: 'right'
    },
    {
      title: t('column.releaseDate'),
      dataIndex: 'releaseDate',
      width: 120,
      render: (v: string) => v || '--'
    },
    {
      title: t('column.referenceSummary'),
      dataIndex: 'referenceSummary',
      width: 300,
      render: (v: string) => v || '--'
    }
  ]

  const openDetail = () => {
    // 只对比「勾选的合并行 + 保留行」；按列表顺序排列。
    // 未勾选任何合并行时，回退为整组对比，避免只剩单列无法比较。
    const picked = new Set<number>(loserIds)
    if (survivorId != null) picked.add(survivorId)
    const ids = picked.size >= 2
      ? items.filter((it) => picked.has(it.id)).map((it) => it.id)
      : items.map((it) => it.id)
    router.push(processPath('movieMergeDetail', {
      ids: ids.join(','),
      ...(survivorId ? { survivorId } : {}),
      ...(pendingId ? { pendingId } : {})
    }))
  }

  const doMerge = () => {
    if (!survivorId) {
      message.warning(t('message.needSurvivor'))
      return
    }
    if (loserIds.length === 0) {
      message.warning(t('message.needLoser'))
      return
    }
    Modal.confirm({
      title: t('confirm.title'),
      content: t('confirm.content', { count: loserIds.length }),
      onOk () {
        setSubmitting(true)
        const payload = {
          survivorId,
          loserIds,
          newName: newName.trim() || undefined
        }
        const request = pendingId
          ? resolveMoviePendingMatch({
            pendingId,
            action: 'merge',
            ...payload
          })
          : mergeMovies(payload)
        return request
          .then(() => {
            message.success(t('message.success'))
            onMerged()
          })
          .finally(() => setSubmitting(false))
      }
    })
  }

  return (
    <Flex vertical gap={12}>
      <Table<MovieDuplicateItem>
        rowKey="id"
        size="small"
        bordered
        pagination={false}
        dataSource={items}
        columns={columns}
        rowSelection={{
          selectedRowKeys: loserIds,
          onChange: (keys) => setLoserIds(keys as number[]),
          getCheckboxProps: (row) => ({ disabled: row.id === survivorId }),
          columnTitle: t('column.merge'),
          columnWidth: 70
        }}
      />
      <Flex gap={12} align="center" wrap>
        <Input
          style={{ maxWidth: 360 }}
          allowClear
          placeholder={t('newNamePlaceholder')}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button onClick={openDetail}>{t('detail.compareEntry')}</Button>
        <CheckPermission code="movie.merge">
          <Button type="primary" loading={submitting} onClick={doMerge}>
            {t('mergeButton')}
          </Button>
        </CheckPermission>
        <span style={{ color: '#999' }}>
          {t('survivorHint', { id: survivorId ?? '-', count: loserIds.length })}
        </span>
      </Flex>
    </Flex>
  )
}

function AutoTab ({ lng }: Readonly<{ lng: string }>) {
  const { t } = useTranslation(lng, 'movieMerge')
  const [groups, setGroups] = useState<MovieDuplicateGroup[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const load = (p = page) => {
    setLoading(true)
    getMovieDuplicates({ page: p, pageSize: 10 })
      .then((res) => {
        setGroups(res.data.list)
        setTotal(res.data.total)
        setPage(p)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(1)
  }, [])

  if (!loading && groups.length === 0) {
    return <Empty description={t('empty')} />
  }

  return (
    <Flex vertical gap={20}>
      {groups.map((group, idx) => (
        <Card
          key={`${group.reason}-${group.groupValue}-${idx}`}
          size="small"
          title={
            <Space>
              <Tag color={group.reason === 'same_tmdb' ? 'geekblue' : 'gold'}>
                {t(`reason.${group.reason}`)}
              </Tag>
              <span style={{ color: '#999', fontWeight: 'normal' }}>
                {group.groupValue}
              </span>
            </Space>
          }
        >
          <MergePanel
            lng={lng}
            items={group.items}
            defaultSurvivorId={group.recommendedSurvivorId}
            onMerged={() => load(page)}
          />
        </Card>
      ))}
      <Flex justify="center">
        <Pagination
          current={page}
          total={total}
          pageSize={10}
          showSizeChanger={false}
          showTotal={showTotal}
          onChange={(p) => load(p)}
        />
      </Flex>
    </Flex>
  )
}

const SEARCH_HISTORY_KEY = 'movieMerge.searchHistory'
const SEARCH_HISTORY_MAX = 12

function ManualTab ({ lng }: Readonly<{ lng: string }>) {
  const { t } = useTranslation(lng, 'movieMerge')
  const [keyword, setKeyword] = useState('')
  const [items, setItems] = useState<MovieDuplicateItem[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEARCH_HISTORY_KEY)
      if (raw) setHistory(JSON.parse(raw))
    } catch {
      // ignore broken storage
    }
  }, [])

  const persistHistory = (next: string[]) => {
    setHistory(next)
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next))
    } catch {
      // ignore quota / privacy mode errors
    }
  }

  const pushHistory = (kw: string) => {
    const next = [kw, ...history.filter((h) => h !== kw)].slice(0, SEARCH_HISTORY_MAX)
    persistHistory(next)
  }

  const clearHistory = () => persistHistory([])

  const removeHistory = (kw: string) => persistHistory(history.filter((h) => h !== kw))

  const runSearch = (raw: string) => {
    const kw = raw.trim()
    if (!kw) {
      message.warning(t('search.empty'))
      return
    }
    setLoading(true)
    searchMoviesForMerge({ keyword: kw })
      .then((res) => {
        setItems(res.data)
        setSearched(true)
        pushHistory(kw)
      })
      .finally(() => setLoading(false))
  }

  const search = () => runSearch(keyword)

  const useHistory = (kw: string) => {
    setKeyword(kw)
    runSearch(kw)
  }

  return (
    <Flex vertical gap={16}>
      <Flex gap={12}>
        <Input
          style={{ maxWidth: 420 }}
          allowClear
          placeholder={t('search.placeholder')}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={search}
        />
        <Button type="primary" loading={loading} onClick={search}>
          {t('search.button')}
        </Button>
      </Flex>
      {history.length > 0 ? (
        <Flex gap={8} align="center" wrap>
          <span style={{ color: '#999' }}>{t('search.history')}：</span>
          {history.map((h) => (
            <Tag
              key={h}
              closable
              style={{ cursor: 'pointer', marginInlineEnd: 0 }}
              onClick={() => useHistory(h)}
              onClose={(e) => {
                e.preventDefault()
                e.stopPropagation()
                removeHistory(h)
              }}
            >
              {h}
            </Tag>
          ))}
          <Button type="link" size="small" onClick={clearHistory}>
            {t('search.clearHistory')}
          </Button>
        </Flex>
      ) : null}
      {searched && items.length === 0 ? (
        <Empty description={t('search.noResult')} />
      ) : null}
      {items.length > 0 ? (
        <Card size="small" title={t('manualHint')}>
          <MergePanel
            lng={lng}
            items={items}
            onMerged={() => {
              setItems([])
              setSearched(false)
              setKeyword('')
            }}
          />
        </Card>
      ) : null}
    </Flex>
  )
}

function PendingTab ({ lng }: Readonly<{ lng: string }>) {
  const { t } = useTranslation(lng, 'movieMerge')
  const [matches, setMatches] = useState<MoviePendingMatch[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const load = (p = page) => {
    setLoading(true)
    getMoviePendingMatches({ page: p, pageSize: 10 })
      .then((res) => {
        setMatches(res.data.list)
        setTotal(res.data.total)
        setPage(p)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(1)
  }, [])

  const ignore = (pendingId: number) => {
    Modal.confirm({
      title: t('pending.ignoreTitle'),
      content: t('pending.ignoreContent'),
      onOk () {
        return resolveMoviePendingMatch({ pendingId, action: 'ignore' }).then(() => {
          message.success(t('pending.ignoreSuccess'))
          load(page)
        })
      }
    })
  }

  if (!loading && matches.length === 0) {
    return <Empty description={t('pending.empty')} />
  }

  return (
    <Flex vertical gap={20}>
      {matches.map((match) => (
        <Card
          key={match.id}
          size="small"
          title={
            <Space wrap>
              <Tag color="purple">{t('pending.title')}</Tag>
              <Tag color="blue">{Math.round(Number(match.confidence) * 100)}%</Tag>
              <span style={{ color: '#999', fontWeight: 'normal' }}>
                {match.matchReason}
              </span>
            </Space>
          }
          extra={
            <CheckPermission code="movie.merge">
              <Button danger onClick={() => ignore(match.id)}>
                {t('pending.ignore')}
              </Button>
            </CheckPermission>
          }
        >
          <MergePanel
            lng={lng}
            items={match.items}
            defaultSurvivorId={match.recommendedSurvivorId}
            pendingId={match.id}
            onMerged={() => load(page)}
          />
        </Card>
      ))}
      <Flex justify="center">
        <Pagination
          current={page}
          total={total}
          pageSize={10}
          showSizeChanger={false}
          showTotal={showTotal}
          onChange={(p) => load(p)}
        />
      </Flex>
    </Flex>
  )
}

export default function Page ({ params: { lng } }: Readonly<PageProps>) {
  const { t } = useTranslation(lng, 'movieMerge')

  return (
    <section>
      <Tabs
        defaultActiveKey="auto"
        items={[
          { key: 'auto', label: t('tab.auto'), children: <AutoTab lng={lng} /> },
          { key: 'manual', label: t('tab.manual'), children: <ManualTab lng={lng} /> },
          { key: 'pending', label: t('tab.pending'), children: <PendingTab lng={lng} /> }
        ]}
      />
    </section>
  )
}
