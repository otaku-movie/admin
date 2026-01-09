'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import {
  Form,
  Modal,
  Select,
  Space,
  DatePicker,
  message,
  Switch,
  Input,
  Button,
  InputNumber
} from 'antd'
import http from '@/api'
import { languageType } from '@/config'
import dayjs from 'dayjs'
import { Cinema, theaterHall } from '@/type/api'
import { MovieModal } from './movieModal'

interface MovieShowTimeModalProps {
  readonly type: 'create' | 'edit'
  readonly show: boolean
  readonly data: Record<string, unknown>
  readonly fromScreeningManagement?: boolean
  readonly onConfirm?: () => void
  readonly onCancel?: () => void
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
  price?: number
  reReleaseId?: number
  dubbingVersionId?: number
}

export default function MovieShowTimeModal(props: MovieShowTimeModalProps) {
  const { t } = useTranslation(navigator.language as languageType, 'showTime')
  const { t: common } = useTranslation(
    navigator.language as languageType,
    'common'
  )
  const [movieData, setMovieData] = useState<any[]>([])
  const [specList, setSpecList] = useState<any[]>([])
  const [languageData, setLanguageData] = useState([])
  const [showTimeTagData, setShowTimeTagData] = useState([])
  const [reReleaseData, setReReleaseData] = useState<any[]>([])
  const [dubbingVersionData, setDubbingVersionData] = useState<any[]>([])
  const [cinemaData, setCinemaData] = useState<Cinema[]>([])
  const [theaterHallData, setTheaterHallData] = useState<theaterHall[]>([])
  const [form] = Form.useForm()
  const [time, setTime] = useState(0)
  const [query, setQuery] = useState<Query>({
    startTime: undefined,
    endTime: undefined
  })
  const [movieModal, setMovieModal] = useState({
    show: false
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
  const getReReleaseData = (movieId?: number) => {
    if (!movieId) {
      setReReleaseData([])
      return
    }
    http({
      url: 'movie/reRelease/list',
      method: 'post',
      data: {
        movieId,
        page: 1,
        pageSize: 100
      }
    })
      .then((res) => {
        setReReleaseData(res.data?.list || [])
      })
      .catch(() => {
        setReReleaseData([])
      })
  }
  const getDubbingVersionDataFromDict = () => {
    http({
      url: 'dict/list',
      method: 'post',
      data: {
        name: 'dubbingVersion',
        page: 1,
        pageSize: 100
      }
    })
      .then((res) => {
        const versions = res.data?.list || []
        // 确保包含"原版"选项（code=0或1）
        const hasOriginal = versions.some(
          (v: any) => (v.id || v.code) === 0 || (v.id || v.code) === 1
        )
        if (!hasOriginal && versions.length > 0) {
          versions.unshift({
            id: 0,
            code: 0,
            name: '原版'
          })
        }
        setDubbingVersionData(versions)
      })
      .catch(() => {
        // 如果字典API失败，至少显示原版和配音版
        setDubbingVersionData([
          { id: 0, code: 0, name: '原版' },
          { id: 1, code: 1, name: '配音版' }
        ])
      })
  }
  const getDubbingVersionData = (movieId?: number) => {
    // 如果指定了电影ID，获取该电影的配音版本信息
    // 然后结合字典数据展示所有可用的配音版本选项
    if (movieId) {
      http({
        url: 'movie/detail',
        method: 'get',
        params: {
          id: movieId
        }
      })
        .then((res) => {
          const movie = res.data
          // 获取字典中的配音版本列表
          http({
            url: 'dict/list',
            method: 'post',
            data: {
              name: 'dubbingVersion',
              page: 1,
              pageSize: 100
            }
          })
            .then((dictRes) => {
              const versions = dictRes.data?.list || []
              // 如果电影有配音版本ID，确保包含该版本
              if (movie.dubbingVersionId) {
                const hasVersion = versions.some(
                  (v: any) => (v.id || v.code) === movie.dubbingVersionId
                )
                if (!hasVersion) {
                  versions.push({
                    id: movie.dubbingVersionId,
                    code: movie.dubbingVersionId,
                    name: '配音版'
                  })
                }
              }
              // 确保包含"原版"选项
              const hasOriginal = versions.some(
                (v: any) => (v.id || v.code) === 0 || (v.id || v.code) === 1
              )
              if (!hasOriginal) {
                versions.unshift({
                  id: 0,
                  code: 0,
                  name: '原版'
                })
              }
              setDubbingVersionData(versions)
            })
            .catch(() => {
              // 如果字典API失败，至少显示原版和电影的配音版本
              const versions: any[] = [{ id: 0, code: 0, name: '原版' }]
              if (movie.dubbingVersionId) {
                versions.push({
                  id: movie.dubbingVersionId,
                  code: movie.dubbingVersionId,
                  name: '配音版'
                })
              }
              setDubbingVersionData(versions)
            })
        })
        .catch(() => {
          // 如果获取电影详情失败，使用字典数据
          getDubbingVersionDataFromDict()
        })
    } else {
      getDubbingVersionDataFromDict()
    }
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
      getDubbingVersionDataFromDict()
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
      if (props.data.movieId) {
        getReReleaseData(props.data.movieId as number)
        getDubbingVersionData(props.data.movieId as number)
      } else {
        getDubbingVersionDataFromDict()
      }
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
              endTime: query.endTime?.format('YYYY-MM-DD HH:mm:ss'),
              price: query.price,
              reReleaseId: query.reReleaseId,
              dubbingVersionId: query.dubbingVersionId
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
            {
              required: true,
              message: t('showTimeModal.form.movie.required'),
              validator(_, value) {
                if (!query.movieId) {
                  return Promise.reject(
                    new Error(t('showTimeModal.form.movie.required'))
                  )
                }
                return Promise.resolve()
              }
            }
          ]}
          name="movieId"
        >
          <Space>
            <Input
              value={
                movieData.find((item: any) => item.id === query.movieId)
                  ?.name || ''
              }
              readOnly
              placeholder={t('showTimeModal.form.movie.placeholder')}
              style={{ width: 200 }}
            />
            <Button
              type="primary"
              onClick={() => setMovieModal({ show: true })}
            >
              {common('button.select')}
            </Button>
          </Space>
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
        <Form.Item label={t('showTimeModal.form.price.label')} name="price">
          <InputNumber
            style={{ width: 200 }}
            min={0}
            precision={0}
            step={100}
            value={query.price}
            placeholder={t('showTimeModal.form.price.placeholder')}
            onChange={(val) => {
              setQuery({
                ...query,
                price: val ?? undefined
              })
            }}
            addonAfter={common('unit.jpy')}
          />
        </Form.Item>
        <Form.Item
          label={t('showTimeModal.form.reRelease.label')}
          name="reReleaseId"
        >
          <Select
            allowClear
            showSearch
            style={{ width: 200 }}
            value={query.reReleaseId}
            disabled={!query.movieId}
            placeholder={t('showTimeModal.form.reRelease.placeholder')}
            onFocus={() => {
              if (query.movieId) {
                getReReleaseData(query.movieId)
              }
            }}
            onChange={(val) => {
              setQuery({
                ...query,
                reReleaseId: val
              })
            }}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={reReleaseData.map((item: any) => ({
              value: item.id,
              label: `${item.name || ''} (${dayjs(item.startTime).format('YYYY-MM-DD')} - ${dayjs(item.endTime).format('YYYY-MM-DD')})`
            }))}
          />
        </Form.Item>
        <Form.Item
          label={t('showTimeModal.form.dubbingVersion.label')}
          name="dubbingVersionId"
        >
          <Select
            allowClear
            showSearch
            style={{ width: 200 }}
            value={query.dubbingVersionId}
            placeholder={t('showTimeModal.form.dubbingVersion.placeholder')}
            onFocus={() => {
              if (query.movieId) {
                getDubbingVersionData(query.movieId)
              } else {
                getDubbingVersionDataFromDict()
              }
            }}
            onChange={(val) => {
              setQuery({
                ...query,
                dubbingVersionId: val
              })
            }}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={dubbingVersionData.map((item: any) => ({
              value: item.id || item.code,
              label: item.name || item.label
            }))}
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
              disabledDate={(current) => {
                return current && current.isBefore(dayjs(), 'day')
              }}
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
              disabledDate={(current) => {
                if (!query.startTime) return true
                return (
                  current &&
                  current.isBefore(query.startTime.add(1, 'minute'), 'day')
                )
              }}
              disabledTime={(current) => {
                if (!current || !query.startTime) return {}

                // 如果是同一天，需要禁用开始时间之前的时间
                if (current.isSame(query.startTime, 'day')) {
                  const startHour = query.startTime.hour()
                  const startMinute = query.startTime.minute()

                  return {
                    disabledHours: () => {
                      const hours = []
                      for (let i = 0; i < startHour; i++) {
                        hours.push(i)
                      }
                      return hours
                    },
                    disabledMinutes: (selectedHour) => {
                      if (selectedHour === startHour) {
                        const minutes = []
                        for (let i = 0; i <= startMinute; i++) {
                          minutes.push(i)
                        }
                        return minutes
                      }
                      return []
                    }
                  }
                }
                return {}
              }}
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
      <MovieModal
        show={movieModal.show}
        data={{}}
        onCancel={() => {
          setMovieModal({ show: false })
        }}
        onConfirm={(movie) => {
          setQuery({
            ...query,
            movieId: movie.id
          })
          form.setFieldValue('movieId', movie.id)

          // 获取电影时长和配音版本
          http({
            url: 'movie/detail',
            method: 'get',
            params: {
              id: movie.id
            }
          }).then((res) => {
            if (res.data.time) {
              setTime(res.data.time)
            }
            // 根据电影获取配音版本选项
            getDubbingVersionData(movie.id)
          })

          // 获取重映数据
          getReReleaseData(movie.id)

          setMovieModal({ show: false })
        }}
      />
    </Modal>
  )
}
