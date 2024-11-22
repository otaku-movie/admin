'use client'
import React, { useEffect, useState } from 'react'
import {
  Button,
  DatePicker,
  Input,
  Space,
  InputNumber,
  Checkbox,
  Select,
  Row,
  Col,
  message,
  Form
} from 'antd'
import { useTranslation } from '@/app/i18n/client'
import http from '@/api'
import dayjs from 'dayjs'
import { SpecItem } from '@/type/api'
import { useCommonStore } from '@/store/useCommonStore'
import { CheckPermission } from '@/components/checkPermission'
import { languageType } from '@/config'
import { Upload } from '@/components/upload/Upload'
import { useMovieStore, SaveMovieQuery } from '@/store/useMovieStore'
import { matchFormat } from '@/utils'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import { useSearchParams } from 'next/navigation'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { DictSelect } from '@/components/DictSelect'

dayjs.extend(advancedFormat)

export interface Props {
  language: languageType
  onPrev?: () => void
  onNext?: (data?: any) => void
}

export function One(props: Props) {
  const { t: common } = useTranslation(props.language, 'common')
  const { t } = useTranslation(props.language, 'movieDetail')
  const [tagData, setTagData] = useState<{ id: number; name: string }[]>([])
  const [picker, setPicker] = useState('date')
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null)
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null)

  const [form] = Form.useForm()
  const movieStore = useMovieStore()
  const [data, setData] = useState<SaveMovieQuery>({
    spec: [],
    tags: []
  })
  const [helloMovie, setHelloMovie] = useState<any[]>([])
  const [spec, setSpec] = useState<SpecItem[]>([])
  const levelList = useCommonStore((state) => state.levelList)
  const getLevelList = useCommonStore((state) => state.getLevelList)
  const searchParams = useSearchParams()

  const options = [
    {
      name: '年',
      type: 'year'
    },
    {
      name: '月',
      type: 'month'
    },
    {
      name: '日期',
      type: 'date'
    }
    // {
    //   name: '季节',
    //   type: 'quarter'
    // }
  ]

  const getTagData = () => {
    http({
      url: '/movieTag/list',
      method: 'post',
      data: {
        pageSize: 100
      }
    }).then((res) => {
      setTagData(res.data.list)
    })
  }

  const getSpec = () => {
    http({
      url: 'movie/spec',
      method: 'get'
    }).then((res) => {
      setSpec(res.data)
    })
  }

  const toDayjs = (type: 'start' | 'end', date: string) => {
    const result = matchFormat(date)
    if (result) {
      if (type === 'start') {
        setPicker(result.type)
      }
    }

    return !date ? null : dayjs(date, result?.format)
  }

  useEffect(() => {
    if (searchParams.has('id')) {
      const updateDates = () => {
        setStartDate(() =>
          toDayjs('start', movieStore.movie.startDate as string)
        )
        setEndDate(() => toDayjs('end', movieStore.movie.endDate as string))

        form.setFieldsValue({
          ...movieStore.movie,
          tags: movieStore.movie.tags?.map((item) => item.id),
          startDate: toDayjs('start', movieStore.movie.startDate as string),
          endDate: toDayjs('end', movieStore.movie.endDate as string)
        })
        if (movieStore.movie.helloMovie) {
          setHelloMovie(
            movieStore.movie.helloMovie.map((item) => {
              return {
                ...item,
                date: dayjs(item.date, 'YYYY-MM-DD')
              }
            })
          )
        }
      }

      console.log(movieStore.movie)
      setData({
        ...movieStore.movie,
        tags: movieStore.movie.tags?.map((item) => item.id) as any
      })
      updateDates()
    }
  }, [form, movieStore.movie, movieStore.movie.startDate])

  useEffect(() => {
    getTagData()
    getSpec()
    getLevelList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderPicker = () => {
    return (
      <Space>
        <Select
          value={picker}
          style={{
            width: '100px'
          }}
          onChange={(val) => {
            setPicker(val)
          }}
        >
          {options?.map((item) => {
            return (
              <Select.Option value={item.type} key={item.type}>
                {item.name}
              </Select.Option>
            )
          })}
        </Select>
        <DatePicker
          value={startDate}
          style={{
            width: '200px'
          }}
          picker={picker as 'year' | 'month' | 'date' | 'quarter'}
          onChange={(date) => {
            console.log(date.format('YYYY-[Q]Q'))
            setStartDate(date)
          }}
        />
      </Space>
    )
  }

  const formatDate = (date: null | dayjs.Dayjs, type = 'auto') => {
    if (!date) return null
    const formatMap = {
      year: 'YYYY',
      month: 'YYYY-MM',
      date: 'YYYY-MM-DD',
      quarter: 'YYYY-[Q]Q'
    }
    if (type === 'auto') {
      return dayjs(date).format(formatMap[picker as keyof typeof formatMap])
    } else {
      return dayjs(date).format(formatMap[type as keyof typeof formatMap])
    }
  }

  return (
    <Space
      align="start"
      style={{
        display: 'flex'
      }}
    >
      <Form
        {...{
          labelCol: {
            span: 5
          },
          wrapperCol: {
            offset: 0
          }
        }}
        form={form}
        variant="filled"
        style={{ maxWidth: 600, minWidth: 500 }}
        name="movieDetail"
      >
        <Form.Item
          label={t('form.cover.label')}
          rules={[{ required: true, message: t('form.cover.required') }]}
        >
          <Upload
            value={data.cover || ''}
            // crop={true}
            // cropperOptions={{
            //   aspectRatio: 1006 / 1339
            // }}
            onChange={(val) => {
              setData({
                ...data,
                cover: val
              })
            }}
          />
        </Form.Item>
        <Form.Item
          label={t('form.name.label')}
          name="name"
          rules={[{ required: true, message: t('form.name.required') }]}
        >
          <Input
            value={data.name}
            onChange={(e) => {
              setData({
                ...data,
                name: e.currentTarget.value
              })
            }}
          />
        </Form.Item>

        <Form.Item
          label={t('form.originalName.label')}
          rules={[
            { required: false, message: t('form.originalName.required') }
          ]}
          name="originalName"
        >
          <Input
            value={data.originalName}
            onChange={(e) => {
              data.originalName = e.currentTarget.value
              setData({
                ...data
              })
            }}
          />
        </Form.Item>

        <Form.Item
          label={t('form.time.label')}
          rules={[{ required: false, message: t('form.time.required') }]}
          name="time"
        >
          <InputNumber
            style={{ width: '100%' }}
            value={data.time}
            onChange={(val) => {
              data.time = val as number
              setData({
                ...data
              })
            }}
          />
        </Form.Item>

        <Form.Item
          label={t('form.description.label')}
          name="description"
          rules={[{ required: true, message: t('form.description.required') }]}
        >
          <Input.TextArea
            value={data.description}
            rows={5}
            onChange={(e) => {
              data.description = e.currentTarget.value
              setData({
                ...data
              })
            }}
          />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
          <CheckPermission code="movie.save">
            <Button
              type="primary"
              htmlType="submit"
              onClick={() => {
                form.validateFields().then(() => {
                  console.log(data)
                  http({
                    url: 'admin/movie/save',
                    method: 'post',
                    data: {
                      ...data,
                      startDate: formatDate(startDate),
                      endDate: formatDate(endDate, 'date'),
                      tags: data.tags,
                      helloMovie: helloMovie.map((item) => {
                        return {
                          ...item,
                          date: formatDate(item.date, 'date')
                        }
                      })
                    }
                  }).then((res: any) => {
                    movieStore.setMovie({
                      ...res.data
                    })
                    props.onNext?.()
                  })
                })
              }}
            >
              {t('button.next')}
            </Button>
          </CheckPermission>
        </Form.Item>
      </Form>
      <Form
        {...{
          labelCol: {
            span: 8,
            offset: 2
          },
          wrapperCol: {
            offset: 1
          }
        }}
        form={form}
        variant="filled"
        style={{ width: 600 }}
        name="movieDetail2"
      >
        <Form.Item
          required={true}
          name={['code', 'date']}
          rules={[
            {
              validateTrigger: ['onBlur'],
              validator() {
                const some = helloMovie.some((item) => {
                  if (!item.code || !item.date) {
                    return true
                  }
                  return false
                })
                if (some) {
                  return Promise.reject(
                    new Error(t('form.helloMovie.required'))
                  )
                }

                const set = new Set(helloMovie.map((item) => item.code))

                if (set.size !== helloMovie.length) {
                  return Promise.reject(
                    new Error(t('form.helloMovie.notRepeat'))
                  )
                }

                return Promise.resolve()
              }
            }
          ]}
          label={t('form.helloMovie.label')}
        >
          <Space direction="vertical" size={15}>
            {helloMovie.map((item: any, index: number) => {
              return (
                <Space size={15} key={item.id}>
                  <DictSelect
                    code="helloMovie"
                    value={item.code}
                    style={{ width: '250px' }}
                    onChange={(val) => {
                      item.code = val
                      setHelloMovie([...helloMovie])
                    }}
                  ></DictSelect>
                  <DatePicker
                    style={{ width: '200px' }}
                    value={item.date}
                    onChange={(date) => {
                      item.date = date
                      setHelloMovie([...helloMovie])
                    }}
                  />
                  <MinusCircleOutlined
                    onClick={() => {
                      helloMovie.splice(index, 1)
                      setHelloMovie([...helloMovie])
                    }}
                  />
                </Space>
              )
            })}
            {helloMovie.length < 2 ? (
              <Button
                type="dashed"
                style={{
                  width: '100%'
                }}
                onClick={() => {
                  helloMovie.push({
                    id: helloMovie.length,
                    status: false
                  } as never)

                  setHelloMovie([...helloMovie])
                }}
                icon={<PlusOutlined />}
              >
                {common('button.add')}
              </Button>
            ) : null}
          </Space>
        </Form.Item>
        <Form.Item
          label={t('form.homePage.label')}
          rules={[{ required: false, message: t('form.homePage.required') }]}
          name="homePage"
        >
          <Input
            value={data.homePage}
            onChange={(e) => {
              data.homePage = e.currentTarget.value
              setData({
                ...data
              })
            }}
          />
        </Form.Item>
        <Form.Item
          label={t('form.level.label')}
          rules={[{ required: true, message: t('form.level.required') }]}
          name="levelId"
        >
          <Select
            value={data.levelId}
            onChange={(val) => {
              data.levelId = val
              setData({ ...data })
            }}
          >
            {levelList?.map((item) => {
              return (
                <Select.Option value={item.id} key={item.name}>
                  {item.name}（{item.description}）
                </Select.Option>
              )
            })}
          </Select>
        </Form.Item>
        <Form.Item
          label={t('form.spec.label')}
          rules={[{ required: false, message: t('form.spec.required') }]}
          name="spec"
        >
          <Checkbox.Group
            value={data.spec}
            onChange={(val) => {
              setData({
                ...data,
                spec: val
              })
            }}
          >
            <Row gutter={[20, 10]}>
              {spec.map((item) => {
                return (
                  <Col key={item.id}>
                    <Checkbox value={item.id}>{item.name}</Checkbox>
                  </Col>
                )
              })}
            </Row>
          </Checkbox.Group>
        </Form.Item>
        <Form.Item
          label={t('form.status.label')}
          rules={[{ required: false, message: t('form.level.required') }]}
          name="status"
        >
          <DictSelect
            code="releaseStatus"
            value={data.status}
            style={{ width: '250px' }}
            onChange={(val) => {
              data.status = val as any
              setData({ ...data })
            }}
          ></DictSelect>
        </Form.Item>

        <Form.Item
          label={t('form.startDate.label')}
          rules={[
            {
              required: false,
              message: t('form.startDate.required'),
              type: 'object'
            },
            {
              validator() {
                if (startDate && endDate) {
                  if (!startDate?.isBefore(endDate)) {
                    return Promise.reject(
                      new Error(t('form.endDate.startAfterEnd'))
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
          name="startDate"
        >
          {renderPicker()}
        </Form.Item>
        <Form.Item
          label={t('form.endDate.label')}
          rules={[
            {
              required: false,
              message: t('form.endDate.required'),
              type: 'object'
            },
            {
              validator() {
                if (startDate && endDate) {
                  if (!startDate?.isBefore(endDate)) {
                    return Promise.reject(
                      new Error(t('form.endDate.startAfterEnd'))
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
          name="endDate"
        >
          <DatePicker
            value={endDate}
            style={{
              width: '310px'
            }}
            onChange={(date) => {
              console.log('end-picker', data)
              setEndDate(date)
            }}
          />
        </Form.Item>

        <Form.Item
          label={t('form.tag.label')}
          rules={[{ required: false, message: t('form.tag.required') }]}
          name="tags"
        >
          <Checkbox.Group
            value={data.tags}
            onChange={(val) => {
              setData({
                ...data,
                tags: val
              })
            }}
          >
            <Row gutter={[20, 10]}>
              {tagData.map((item) => {
                return (
                  <Col key={item.id}>
                    <Checkbox value={item.id}>{item.name}</Checkbox>
                  </Col>
                )
              })}
            </Row>
          </Checkbox.Group>
        </Form.Item>
      </Form>
    </Space>
  )
}
