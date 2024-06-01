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
import { Movie, SpecItem } from '@/type/api'
import { useCommonStore } from '@/store/useCommonStore'
import { CheckPermission } from '@/components/checkPermission'
import { languageType } from '@/config'
import { Upload } from '@/components/upload/Upload'

export interface Props {
  language: languageType
  data: Record<string, any>
  onPrev?: () => void
  onNext?: (data?: any) => void
}

export function One(props: Props) {
  const { t } = useTranslation(props.language, 'movieDetail')
  const [form] = Form.useForm()
  const [data, setData] = useState<
    Partial<
      Omit<Movie, 'spec'> & {
        spec: number[]
        startDate: dayjs.Dayjs | null
        endDate: dayjs.Dayjs | null
      }
    >
  >({
    spec: [],
    startDate: null,
    endDate: null
  })
  const [spec, setSpec] = useState<SpecItem[]>([])
  const dict = useCommonStore((state) => state.dict)
  const levelList = useCommonStore((state) => state.levelList)
  const getDict = useCommonStore((state) => state.getDict)
  const getLevelList = useCommonStore((state) => state.getLevelList)
 
  const getSpec = () => {
    http({
      url: 'movie/spec',
      method: 'get'
    }).then((res) => {
      setSpec(res.data)
    })
  }
  useEffect(() => {
    setData(props.data)

    form.setFieldsValue(props.data)
  }, [props.data])

  useEffect(() => {
    getSpec()
    getLevelList()
    getDict(['release_status'])
  }, [])

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
            xs: { span: 24 },
            sm: { span: 6 }
          },
          wrapperCol: {
            xs: { span: 24 },
            sm: { span: 15 }
          }
        }}
        form={form}
        variant="filled"
        // initialValues={data}
        style={{ maxWidth: 600, minWidth: 500 }}
        name="movieDetail"
      >
        <Form.Item
          label={t('form.cover.label')}
          rules={[{ required: true, message: t('form.cover.required') }]}
        >
          <Upload 
            value={data.cover || ''} 
            crop={true}
            onChange={(val) => {
             setData({
              ...data,
              cover: val
            })
          }}></Upload>
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

        <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
          <CheckPermission code="movie.save">
            <Button
              type="primary"
              htmlType="submit"
              onClick={() => {
                form.validateFields().then(() => {
                  http({
                    url: 'admin/movie/save',
                    method: 'post',
                    data: {
                      ...data,
                      startDate:
                        data.startDate === null
                          ? null
                          : dayjs(data.startDate || new Date()).format(
                              'YYYY-MM-DD'
                            ),
                      endDate:
                        data.endDate === null
                          ? null
                          : dayjs(data.endDate || new Date()).format(
                              'YYYY-MM-DD'
                            )
                    }
                  }).then((res) => {
                    message.success('保存成功')
                    props.onNext?.(res.data)
                    // router.back()
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
            span: 8
          },
          wrapperCol: {
            offset: 1
          }
        }}
        form={form}
        variant="filled"
        // initialValues={data}
        style={{ width: 500 }}
        name="movieDetail"
      >
        <Form.Item
          label={t('form.spec.label')}
          rules={[{ required: false, message: t('form.spec.required') }]}
          name="spec"
        >
          <Checkbox.Group
            value={data.spec}
            onChange={(val) => {
              console.log(val)
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
          <Select
            value={data.status}
            onChange={(val) => {
              data.status = val
              setData({ ...data })
            }}
          >
            {dict.releaseStatus?.map((item) => {
              return (
                <Select.Option value={item.code} key={item.code}>
                  {item.name}
                </Select.Option>
              )
            })}
          </Select>
        </Form.Item>

        <Form.Item
          label={t('form.startDate.label')}
          rules={[{ required: false, message: t('form.startDate.required') }]}
          name="startDate"
        >
          <DatePicker
            value={data.startDate}
            style={{
              width: '300px'
            }}
            onChange={(date) => {
              data.startDate = date
              setData({
                ...data
              })
            }}
          />
        </Form.Item>
        <Form.Item
          label={t('form.endDate.label')}
          rules={[{ required: false, message: t('form.endDate.required') }]}
          name="endDate"
        >
          <DatePicker
            value={data.endDate}
            style={{
              width: '300px'
            }}
            onChange={(date) => {
              data.endDate = date
              setData({
                ...data
              })
            }}
          />
        </Form.Item>
      </Form>
    </Space>
  )
}
