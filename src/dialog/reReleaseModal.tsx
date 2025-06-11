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
  Button
} from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import { buttonItem } from '@/type/api'
import dayjs from 'dayjs'
import { MovieModal } from './movieModal'

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
  startTime?: dayjs.Dayjs
  endTime?: dayjs.Dayjs
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
    startTime: undefined,
    endTime: undefined
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
                startTime: query.startTime?.format('YYYY-MM-DD'),
                endTime: query.endTime?.format('YYYY-MM-DD')
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
          <Form.Item
            label={t('modal.form.showTime.label')}
            required={true}
            rules={[
              {
                required: true,
                validator() {
                  if (!query.startTime || !query.endTime) {
                    return Promise.reject(t('modal.form.showTime.required'))
                  } else {
                    return Promise.resolve()
                  }
                },
                message: t('modal.form.showTime.required')
              },
              {
                validator() {
                  if (query.startTime && query.endTime) {
                    if (!query.startTime?.isBefore(query.endTime)) {
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
            name={['startTime', 'endTime']}
          >
            <Space>
              <DatePicker
                value={query.startTime}
                format="YYYY-MM-DD"
                onChange={(val) => {
                  setQuery({
                    ...query,
                    startTime: val
                  })
                }}
              />
              <DatePicker
                value={query.endTime}
                format="YYYY-MM-DD"
                onChange={(val) => {
                  setQuery({
                    ...query,
                    endTime: val
                  })
                }}
              />
            </Space>
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
