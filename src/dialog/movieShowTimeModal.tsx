'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import { Form, Modal, Select, Space, DatePicker, message, Switch } from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import dayjs from 'dayjs'
import { Cinema, theaterHall } from '@/type/api'

interface MovieShowTimeModalProps {
  type: 'create' | 'edit'
  show: boolean
  data: Record<string, unknown>
  fromScreeningManagement?: boolean
  onConfirm?: () => void
  onCancel?: () => void
}

interface Query {
  id?: number
  movieId?: number
  cinemaId?: number
  open?: boolean
  theaterHallId?: number
  specId?: number
  startTime?: dayjs.Dayjs
  endTime?: dayjs.Dayjs
  subtitleId?: number[]
  movieShowTimeTagId?: number[]
}

export default function MovieShowTimeModal(props: MovieShowTimeModalProps) {
  const { t } = useTranslation(navigator.language as languageType, 'showTime')
  const { t: common } = useTranslation(
    navigator.language as languageType,
    'common'
  )
  const [movieData, setMovieData] = useState([])
  const [specList, setSpecList] = useState<any[]>([])
  const [languageData, setLanguageData] = useState([])
  const [showTimeTagData, setShowTimeTagData] = useState([])
  const [cinemaData, setCinemaData] = useState<Cinema[]>([])
  const [theaterHallData, setTheaterHallData] = useState<theaterHall[]>([])
  const [form] = Form.useForm()
  const [time, setTime] = useState(0)
  const [query, setQuery] = useState<Query>({
    startTime: undefined,
    endTime: undefined
  })

  const getMovieData = (
    name: string = '',
    id: number | undefined = undefined
  ) => {
    http({
      url: 'movie/list',
      method: 'post',
      data: {
        id,
        name,
        // 上映中
        releaseStatus: 2,
        page: 1,
        pageSize: 10
      }
    }).then((res) => {
      setMovieData(res.data?.list)
    })
  }
  const getTheaterHallData = (id: number) => {
    http({
      url: 'theater/hall/list',
      method: 'post',
      data: {
        cinemaId: id,
        page: 1,
        pageSize: 100
      }
    }).then((res) => {
      setTheaterHallData(res.data.list)
    })
  }
  const getLanguageData = (
    name: string = '',
    id: number | undefined = undefined
  ) => {
    http({
      url: 'language/list',
      method: 'post',
      data: {
        name,
        id
      }
    }).then((res) => {
      setLanguageData(res.data.list)
    })
  }
  const getShowTimeTagData = (
    name: string = '',
    id: number | undefined = undefined
  ) => {
    http({
      url: 'showTimeTag/list',
      method: 'post',
      data: {
        name,
        id
      }
    }).then((res) => {
      setShowTimeTagData(res.data.list)
    })
  }
  const getCinemaData = (
    name: string = '',
    id: number | undefined = undefined
  ) => {
    http({
      url: 'cinema/list',
      method: 'post',
      data: {
        id,
        name,
        page: 1,
        pageSize: 10
      }
    }).then((res) => {
      setCinemaData(res.data.list)
    })
  }
  const getCinemaSpec = (cinemaId: number) => {
    http({
      url: 'cinema/spec',
      method: 'get',
      params: {
        cinemaId
      }
    }).then((res) => {
      setSpecList(res.data)
    })
  }

  useEffect(() => {
    if (props.show) {
      form.resetFields()
    }

    if (props.show && !props.data.id) {
      getMovieData()
      getCinemaData()
      getLanguageData()
      getShowTimeTagData()
    }

    if (props.data.id) {
      const updatedData = {
        ...props.data,
        movieShowTimeTagId: props.data.movieShowTimeTagsId as number[],
        startTime: dayjs(props.data.startTime as string),
        endTime: dayjs(props.data.endTime as string)
      }

      // 更新查询对象
      setQuery(updatedData)

      // 更新表单字段值
      form.setFieldsValue(updatedData)

      // 获取相关数据
      getTheaterHallData(props.data.cinemaId as number)
      getMovieData('', props.data.movieId as number)
      getCinemaData('', props.data.cinemaId as number)

      // 设置其他数据
      setShowTimeTagData(props.data.movieShowTimeTags as [])
      setLanguageData(props.data.subtitle as [])
    } else {
      // 清空查询和表单
      setQuery({})
      form.setFieldsValue({})
    }

    // 如果存在 cinemaId，更新查询对象和获取影院相关数据
    if (props.data.cinemaId) {
      setQuery((prevQuery) => ({
        ...prevQuery,
        cinemaId: props.data.cinemaId as number
      }))
      getCinemaSpec(props.data.cinemaId as number)

      getCinemaData('', props.data.cinemaId as number)
      getTheaterHallData(props.data.cinemaId as number)
    }

    // debugger
  }, [props.show, props.data])

  return (
    <Modal
      title={
        props.type === 'edit'
          ? t('showTimeModal.title.edit')
          : t('showTimeModal.title.create')
      }
      width={700}
      open={props.show}
      maskClosable={false}
      onOk={() => {
        console.log(query)
        form.validateFields().then(() => {
          http({
            url: 'admin/movie_show_time/save',
            method: 'post',
            data: {
              ...query,
              showTimeTagId: query.movieShowTimeTagId,
              startTime: query.startTime?.format('YYYY-MM-DD HH:mm:ss'),
              endTime: query.endTime?.format('YYYY-MM-DD HH:mm:ss')
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
          label={t('showTimeModal.form.movie.label')}
          rules={[
            { required: true, message: t('showTimeModal.form.movie.required') }
          ]}
          name="movieId"
        >
          <Select
            showSearch
            value={query.movieId}
            onChange={(val) => {
              setQuery({
                ...query,
                movieId: val
              })
              http({
                url: 'movie/detail',
                method: 'get',
                params: {
                  id: val
                }
              }).then((res) => {
                if (res.data.time) {
                  setTime(res.data.time)
                }
              })
            }}
            onSearch={getMovieData}
          >
            {movieData.map((item: any) => {
              return (
                <Select.Option value={item.id} key={item.id}>
                  {item.name}
                </Select.Option>
              )
            })}
          </Select>
        </Form.Item>
        <Form.Item
          label={t('showTimeModal.form.subtitle.label')}
          name="subtitleId"
        >
          <Select
            showSearch
            value={query.subtitleId}
            mode="multiple"
            onFocus={() => {
              getLanguageData()
            }}
            onChange={(val) => {
              setQuery({
                ...query,
                subtitleId: val
              })
            }}
            onSearch={getMovieData}
          >
            {languageData.map((item: any) => {
              return (
                <Select.Option value={item.id} key={item.id}>
                  {item.name}
                </Select.Option>
              )
            })}
          </Select>
        </Form.Item>
        <Form.Item
          label={t('showTimeModal.form.showTimeTag.label')}
          name="movieShowTimeTagId"
        >
          <Select
            showSearch
            mode="multiple"
            value={query.movieShowTimeTagId}
            onFocus={() => {
              getShowTimeTagData()
            }}
            onChange={(val) => {
              setQuery({
                ...query,
                movieShowTimeTagId: val
              })
            }}
            onSearch={getShowTimeTagData}
          >
            {showTimeTagData.map((item: any) => {
              return (
                <Select.Option value={item.id} key={item.id}>
                  {item.name}
                </Select.Option>
              )
            })}
          </Select>
        </Form.Item>
        <Form.Item
          label={t('showTimeModal.form.theaterHall.label')}
          required={true}
          name={['cinemaId', 'theaterHallId']}
          rules={[
            {
              async validator() {
                if (!query.cinemaId) {
                  return Promise.reject(
                    new Error(t('showTimeModal.form.cinema.required'))
                  )
                }
                if (!query.theaterHallId) {
                  return Promise.reject(
                    new Error(t('showTimeModal.form.theaterHall.required'))
                  )
                }
                return Promise.resolve()
              },
              validateTrigger: ['onBlur', 'onChange']
            }
          ]}
        >
          <Space>
            {!props.fromScreeningManagement ? (
              <Select
                showSearch
                style={{ width: 250 }}
                onChange={(val) => {
                  getTheaterHallData(val)
                  getCinemaSpec(val)
                  setQuery({
                    ...query,
                    cinemaId: val,
                    theaterHallId: undefined
                  })
                }}
                value={query.cinemaId}
                onSearch={getCinemaData}
              >
                {cinemaData.map((item) => (
                  <Select.Option value={item.id} key={item.id}>
                    {item.name}
                  </Select.Option>
                ))}
              </Select>
            ) : null}
            <Select
              style={{ width: 200 }}
              value={query.theaterHallId}
              showSearch
              popupMatchSelectWidth={300}
              onChange={(val) => {
                setQuery({
                  ...query,
                  theaterHallId: val,
                  specId: theaterHallData.find((item) => item.id === val)
                    ?.cinemaSpecId
                })
              }}
            >
              {theaterHallData.map((item) => (
                <Select.Option value={item.id} key={item.id}>
                  {item.name}（{item.cinemaSpecName}）
                </Select.Option>
              ))}
            </Select>
          </Space>
        </Form.Item>
        <Form.Item
          label={t('showTimeModal.form.spec.label')}
          name="cinemaSpecId"
        >
          <Space>
            <Select
              style={{ width: 200 }}
              value={query.specId}
              disabled={!query.cinemaId}
              onChange={(val) => {
                setQuery({
                  ...query,
                  specId: val
                })
              }}
            >
              {specList.map((item: any) => {
                return (
                  <Select.Option value={item.id} key={item.id}>
                    {item.name}
                  </Select.Option>
                )
              })}
            </Select>
          </Space>
        </Form.Item>
        <Form.Item label={t('showTimeModal.form.open.label')}>
          <Switch
            value={query.open}
            onChange={(val) => {
              setQuery({
                ...query,
                open: val
              })
            }}
          />
        </Form.Item>

        <Form.Item
          label={t('showTimeModal.form.showTime.label')}
          required={true}
          rules={[
            {
              required: true,
              validator() {
                if (!query.startTime || !query.endTime) {
                  return Promise.reject(
                    t('showTimeModal.form.showTime.required')
                  )
                } else {
                  return Promise.resolve()
                }
              },
              message: t('showTimeModal.form.showTime.required')
            },
            {
              validator() {
                if (query.startTime && query.endTime) {
                  if (!query.startTime?.isBefore(query.endTime)) {
                    return Promise.reject(
                      t('showTimeModal.form.showTime.startAfterEnd')
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
              showTime={{
                format: 'HH:mm'
              }}
              format="YYYY-MM-DD HH:mm:ss"
              onChange={(val) => {
                setQuery({
                  ...query,
                  startTime: val,
                  endTime: time ? dayjs(val).add(time, 'minute') : undefined
                })
              }}
            />
            <DatePicker
              value={query.endTime}
              showTime={{
                format: 'HH:mm'
              }}
              format="YYYY-MM-DD HH:mm:ss"
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
  )
}
