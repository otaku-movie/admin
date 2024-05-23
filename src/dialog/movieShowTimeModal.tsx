'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import { Form, Modal, Select, Space, DatePicker, message } from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import dayjs from 'dayjs'
import { Cinema, theaterHall } from '@/type/api'

interface MovieShowTimeModalProps {
  type: 'create' | 'edit'
  show: boolean
  data: Record<string, unknown>
  onConfirm?: () => void
  onCancel?: () => void
}

interface Query {
  id?: number
  movieId?: number
  cinemaId?: number
  theaterHallId?: number
  startTime?: dayjs.Dayjs
  endTime?: dayjs.Dayjs
}

export default function MovieShowTimeModal(props: MovieShowTimeModalProps) {
  const { t } = useTranslation(navigator.language as languageType, 'showTime')
  const { t: common } = useTranslation(navigator.language as languageType, 'common')
  const [movieData, setMovieData] = useState([])
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

  useEffect(() => {
    if (props.show && !props.data.id) {
      // form.resetFields()
      getMovieData()
      getCinemaData()
      console.log(props.data)
    }

    if (props.data.id) {
      setQuery({
        ...props.data,
        startTime: dayjs(props.data.startTime as string),
        endTime: dayjs(props.data.endTime as string)
      })
      getTheaterHallData(props.data.cinemaId as number)
      getMovieData('', props.data.movieId as number)
      getCinemaData('', props.data.cinemaId as number)
    } else {
      setQuery({})
    }
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
            url: 'movie_show_time/save',
            method: 'post',
            data: {
              ...query,
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
              }).then(res => {
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
          label={t('showTimeModal.form.theaterHall.label')}
          required={true}
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
            <Select
              showSearch
              style={{ width: 250 }}
              onChange={(val) => {
                getTheaterHallData(val)
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
            <Select
              style={{ width: 200 }}
              value={query.theaterHallId}
              showSearch
              onChange={(val) => {
                setQuery({
                  ...query,
                  theaterHallId: val
                })
              }}
            >
              {theaterHallData.map((item) => (
                <Select.Option value={item.id} key={item.id}>
                  {item.name}
                </Select.Option>
              ))}
            </Select>
          </Space>
        </Form.Item>
        {/* <Form.Item
          label={t('showTimeModal.form.theaterHall.label')}
          // required={true}
          rules={[
            {
              async validator(_, value) {
                console.log('---------', value)
                return Promise.reject(new Error(''))
              },
              validateTrigger: ['onBlur', 'onChange']
            }
          ]}
        >
          <Space>
            <Select
              showSearch
              style={{ width: 250 }}
              onChange={(val) => {
                getTheaterHallData(val)
                setQuery({
                  ...query,
                  cinemaId: val,
                  theaterHallId: undefined
                })
              }}
              value={query.cinemaId}
              onSearch={getCinemaData}
            >
              {cinemaData.map((item: any) => {
                return (
                  <Select.Option value={item.id} key={item.id}>
                    {item.name}
                  </Select.Option>
                )
              })}
            </Select>
            <Select
              style={{ width: 200 }}
              value={query.theaterHallId}
              onChange={(val) => {
                setQuery({
                  ...query,
                  theaterHallId: val
                })
              }}
            >
              {theaterHallData.map((item: any) => {
                return (
                  <Select.Option value={item.id} key={item.id}>
                    {item.name}
                  </Select.Option>
                )
              })}
            </Select>
          </Space>
        </Form.Item> */}

        <Form.Item
          label={t('showTimeModal.form.showTime.label')}
          required={true}
          rules={[
            {
              required: true,
              message: t('showTimeModal.form.showTime.required')
            }
          ]}
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
