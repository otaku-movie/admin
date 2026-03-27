'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from '@/app/i18n/client'
import { languageType, notFoundImage } from '@/config'
import http from '@/api'
import { Modal, Table, type TableColumnsType, Tag, Space, Typography } from 'antd'
import { CustomAntImage } from '@/components/CustomAntImage'

type ReReleasePlan = {
  id: number
  movieId: number
  startDate?: string
  endDate?: string
  status?: number
  versionInfo?: string
  displayNameOverride?: string
  posterOverride?: string
  timeOverride?: number
}

type MovieInfo = {
  id: number
  name?: string
  cover?: string
  levelName?: string
  time?: number
}

interface Props {
  show?: boolean
  movieId?: number
  movieName?: string
  zIndex?: number
  onConfirm?: (plan: ReReleasePlan) => void
  onCancel?: () => void
}

export function ReReleaseByMovieModal(props: Props) {
  const { t } = useTranslation(navigator.language as languageType, 'movie')
  const { t: common } = useTranslation(navigator.language as languageType, 'common')
  const [data, setData] = useState<ReReleasePlan[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedPlan, setSelectedPlan] = useState<ReReleasePlan | undefined>(undefined)
  const [movieInfo, setMovieInfo] = useState<MovieInfo | undefined>(undefined)

  const title = useMemo(() => {
    const name = props.movieName ? ` - ${props.movieName}` : ''
    return `${t('reReleaseByMovieModal.title')}${name}`
  }, [props.movieName, t])

  useEffect(() => {
    if (!props.show) return
    if (!props.movieId) {
      setData([])
      setSelectedRowKeys([])
      setSelectedPlan(undefined)
      setMovieInfo(undefined)
      return
    }

    http({ url: 'movie/detail', method: 'get', params: { id: props.movieId } })
      .then((res: any) => {
        // movie/detail 在不同调用点返回结构不完全一致：可能是对象，也可能是数组
        const raw = res?.data
        const m =
          Array.isArray(raw) ? (raw.length > 0 ? raw[0] : undefined) : raw
        if (!m) {
          setMovieInfo({ id: props.movieId as number, name: props.movieName })
          return
        }
        setMovieInfo({
          id: Number(m.id),
          name: m.name,
          cover: m.cover,
          levelName: m.levelName,
          time: m.time != null ? Number(m.time) : undefined
        })
      })
      .catch(() => setMovieInfo({ id: props.movieId as number, name: props.movieName }))

    http({
      url: 'movie/reRelease/list',
      method: 'post',
      data: { movieId: props.movieId, page: 1, pageSize: 200 }
    })
      .then((res) => {
        setData(res?.data?.list || [])
        setSelectedRowKeys([])
        setSelectedPlan(undefined)
      })
      .catch(() => {
        setData([])
        setSelectedRowKeys([])
        setSelectedPlan(undefined)
      })
  }, [props.show, props.movieId])

  const columns: TableColumnsType<ReReleasePlan> = useMemo(
    () => [
      { title: t('table.startDate'), dataIndex: 'startDate', width: 160 },
      { title: t('table.endDate'), dataIndex: 'endDate', width: 160 },
      {
        title: t('table.reReleaseEnabled'),
        dataIndex: 'status',
        width: 140,
        render: (v) => (Number(v) === 1 ? <Tag color="green">ON</Tag> : <Tag color="default">OFF</Tag>)
      },
      {
        title: t('table.time'),
        dataIndex: 'timeOverride',
        width: 120,
        render: (v) => {
          const minutes = v != null && Number(v) > 0 ? Number(v) : movieInfo?.time
          return minutes != null ? <span>{minutes}</span> : '-'
        }
      },
      { title: t('table.reReleaseVersionInfo'), dataIndex: 'versionInfo', width: 240 },
      { title: t('table.reReleaseDisplayNameOverride'), dataIndex: 'displayNameOverride', width: 220 }
    ],
    [t, movieInfo?.time]
  )

  return (
    <Modal
      title={title}
      open={props.show}
      maskClosable={false}
      width={'80%'}
      style={{ top: 40 }}
      zIndex={props.zIndex ?? 1200}
      okText={common('button.ok')}
      cancelText={common('button.cancel')}
      onOk={() => {
        if (selectedPlan) props.onConfirm?.(selectedPlan)
      }}
      onCancel={props.onCancel}
      okButtonProps={{ disabled: !selectedPlan }}
    >
      {movieInfo ? (
        <div style={{ marginBottom: 16 }}>
          <Space align="start" size={12}>
            <CustomAntImage
              width={72}
              height={96}
              src={movieInfo.cover}
              alt="poster"
              fallback={notFoundImage}
              placeholder={true}
              style={{ borderRadius: 6, objectFit: 'cover' }}
            />
            <div>
              <Space wrap>
                <Typography.Text strong>{movieInfo.name ?? props.movieName ?? ''}</Typography.Text>
                {movieInfo.levelName ? <Tag color="green">{movieInfo.levelName}</Tag> : null}
                <Tag color="blue">{t('movieModal.reReleaseTag')}</Tag>
              </Space>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 6 }}>
                {t('reReleaseByMovieModal.title')}
              </Typography.Paragraph>
            </div>
          </Space>
        </div>
      ) : null}
      <Table
        columns={columns}
        dataSource={data}
        bordered={true}
        rowKey={'id'}
        sticky={{ offsetHeader: -20 }}
        scroll={{
          x: columns.reduce((total, current) => total + (current.width as number), 0),
          y: 'calc(100vh - 450px)'
        }}
        rowSelection={{
          type: 'radio',
          selectedRowKeys,
          onChange(selectedKeys, selectedRows) {
            setSelectedRowKeys(selectedKeys)
            setSelectedPlan(selectedRows?.[0])
          }
        }}
        pagination={false}
      />
    </Modal>
  )
}

