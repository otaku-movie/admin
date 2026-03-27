'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import {
  Switch,
  Modal,
  Checkbox,
  Table,
  type TableColumnsType,
  message,
  DatePicker,
  Space,
  Form,
  Button,
  Input,
  Radio
} from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import { buttonItem } from '@/type/api'
import dayjs from 'dayjs'
import { MovieModal } from './movieModal'
import { Upload as ImageUpload } from '@/components/upload/Upload'

interface modalProps {
  type: string
  show?: boolean
  data: Record<string, any>
  onConfirm?: () => void
  onCancel?: () => void
}

export type permission = buttonItem & {
  selected: number[]
}

interface Query {
  id?: number
  movieId?: number
  startDate?: dayjs.Dayjs
  endDate?: dayjs.Dayjs
  status?: number
  versionInfo?: string
  displayNameOverride?: string
  posterOverride?: string
  timeOverride?: number
}

export function ReReleaseModal(props: modalProps) {
  const [data, setData] = useState<permission[]>([])
  const { t } = useTranslation(navigator.language as languageType, 'reRelease')
  const { t: common } = useTranslation(
    navigator.language as languageType,
    'common'
  )
  const [form] = Form.useForm()
  const [query, setQuery] = useState<Query>({
    startDate: undefined,
    endDate: undefined,
    status: 1
  })
  const [modal, setModal] = useState({
    show: false,
    data: {}
  })
  const [selectedMovie, setSelectedMovie] = useState<any>({})

  const getData = () => {}

  useEffect(() => {
    if (props.show) {
      getData()
      const d = props.data || {}
      const next: Query = {
        id: d.id,
        movieId: d.movieId ?? d.movie_id,
        startDate: d.startDate ? dayjs(d.startDate) : undefined,
        endDate: d.endDate ? dayjs(d.endDate) : undefined,
        status: d.status != null ? Number(d.status) : 1,
        versionInfo: d.versionInfo ?? d.version_info,
        displayNameOverride: d.displayNameOverride ?? d.display_name_override,
        posterOverride: d.posterOverride ?? d.poster_override,
        timeOverride: d.timeOverride ?? d.time_override
      }
      setQuery(next)
      if (next.movieId && (d.name || selectedMovie?.name == null)) {
        setSelectedMovie({ name: d.name })
      }
      form.setFieldsValue({
        movieId: next.movieId,
        startDate: next.startDate,
        endDate: next.endDate,
        status: next.status,
        versionInfo: next.versionInfo,
        displayNameOverride: next.displayNameOverride,
        posterOverride: next.posterOverride,
        timeOverride: next.timeOverride
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.show])

  const columns: TableColumnsType<permission> = [
    {
      title: t('rolePermissionModal.table.name'),
      render(key) {
        return common(key)
      },
      dataIndex: 'i18nKey'
    }
  ]

  return (
    <>
      <Modal
        title={
          props.type === 'edit'
            ? t('modal.title.edit')
            : t('modal.title.create')
        }
        width={700}
        open={props.show}
        maskClosable={false}
        onOk={() => {
          console.log(query)
          form.validateFields().then(() => {
            http({
              url: 'admin/movie/reRelease/save',
              method: 'post',
              data: {
                ...query,
                startDate: query.startDate?.format('YYYY-MM-DD'),
                endDate: query.endDate?.format('YYYY-MM-DD')
              }
            }).then(() => {
              message.success(common('message.save'))
              props.onConfirm?.()
            })
          })
        }}
        onCancel={props?.onCancel}
      >
        <Form
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
          initialValues={{ remember: true }}
          autoComplete="off"
          form={form}
        >
          <Form.Item
            label={t('modal.form.movie.label')}
            rules={[
              { required: true, message: t('modal.form.movie.required') }
            ]}
            name="movieId"
          >
            {query.movieId ? (
              <span>{selectedMovie.name}</span>
            ) : (
              <Button
                onClick={() => {
                  setModal({
                    show: true,
                    data: {}
                  })
                }}
              >
                {common('button.add')}
              </Button>
            )}
          </Form.Item>
          <Form.Item label={t('modal.form.status.label')} name="status">
            <Radio.Group
              value={query.status}
              onChange={(e) => setQuery({ ...query, status: Number(e.target.value) })}
            >
              <Radio value={1}>{t('modal.form.status.enabled')}</Radio>
              <Radio value={0}>{t('modal.form.status.disabled')}</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label={t('modal.form.showTime.label')}
            required={true}
            rules={[
              {
                required: true,
                validator() {
                  if (!query.startDate) {
                    return Promise.reject(t('modal.form.showTime.required'))
                  } else {
                    return Promise.resolve()
                  }
                },
                message: t('modal.form.showTime.required')
              },
              {
                validator() {
                  if (query.startDate && query.endDate) {
                    if (!query.startDate?.isBefore(query.endDate)) {
                      return Promise.reject(
                        t('modal.form.showTime.startAfterEnd')
                      )
                    } else {
                      return Promise.resolve()
                    }
                  } else {
                    return Promise.resolve()
                  }
                }
              }
            ]}
            name={['startDate', 'endDate']}
          >
            <Space>
              <DatePicker
                value={query.startDate}
                format="YYYY-MM-DD"
                onChange={(val) => {
                  setQuery({
                    ...query,
                    startDate: val
                  })
                }}
              />
              <DatePicker
                value={query.endDate}
                format="YYYY-MM-DD"
                onChange={(val) => {
                  setQuery({
                    ...query,
                    endDate: val
                  })
                }}
              />
            </Space>
          </Form.Item>

          <Form.Item label={t('modal.form.versionInfo.label')} name="versionInfo">
            <Input.TextArea
              value={query.versionInfo}
              onChange={(e) => setQuery({ ...query, versionInfo: e.target.value })}
              placeholder={t('modal.form.versionInfo.placeholder')}
              rows={3}
              showCount
              maxLength={200}
            />
          </Form.Item>

          <Form.Item label={t('modal.form.displayNameOverride.label')} name="displayNameOverride">
            <Input
              value={query.displayNameOverride}
              onChange={(e) => setQuery({ ...query, displayNameOverride: e.target.value })}
              placeholder={t('modal.form.displayNameOverride.placeholder')}
              allowClear
            />
          </Form.Item>

          <Form.Item label={t('modal.form.posterOverride.label')} name="posterOverride">
            <ImageUpload
              value={query.posterOverride ?? ''}
              onChange={(val) => setQuery({ ...query, posterOverride: val })}
            />
          </Form.Item>

          <Form.Item label={t('modal.form.timeOverride.label')} name="timeOverride">
            <Input
              value={query.timeOverride as any}
              onChange={(e) => {
                const v = e.target.value
                const next =
                  v == null || String(v).trim() === '' ? undefined : Number(String(v).replace(/[^\d]/g, ''))
                setQuery({ ...query, timeOverride: Number.isFinite(next as any) ? (next as number) : undefined })
              }}
              placeholder={t('modal.form.timeOverride.placeholder')}
              allowClear
            />
          </Form.Item>
        </Form>
      </Modal>
      <MovieModal
        show={modal.show}
        data={modal.data}
        onCancel={() => {
          setModal({
            ...modal,
            show: false
          })
        }}
        onConfirm={(movie) => {
          setSelectedMovie({ ...movie })
          setQuery({
            ...query,
            movieId: movie.id
          })
          setModal({
            ...modal,
            show: false
          })
          form.setFieldValue('movieId', movie.id)
        }}
      ></MovieModal>
    </>
  )
}
