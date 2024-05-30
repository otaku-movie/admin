'use client'
import React, { useEffect, useState } from 'react'
import {
  Button,
  DatePicker,
  Input,
  InputNumber,
  Checkbox,
  Select,
  Row,
  Col,
  message,
  Upload,
  Form
} from 'antd'
import type { GetProp, UploadFile, UploadProps } from 'antd'
import ImgCrop from 'antd-img-crop'
import { useTranslation } from '@/app/i18n/client'
import http from '@/api'
import dayjs from 'dayjs'
import { Movie, SpecItem } from '@/type/api'
import { useCommonStore } from '@/store/useCommonStore'
import { CheckPermission } from '@/components/checkPermission'
import { languageType } from '@/config'

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0]

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
  const getDict = useCommonStore((state) => state.getDict)
  const [fileList, setFileList] = useState<UploadFile[]>()

  const onChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList)
  }

  const onPreview = async (file: UploadFile) => {
    let src = file.url as string
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.readAsDataURL(file.originFileObj as FileType)
        reader.onload = () => resolve(reader.result as string)
      })
    }
    const image = new Image()
    image.src = src
    const imgWindow = window.open(src)
    imgWindow?.document.write(image.outerHTML)
  }

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
    getDict(['release_status'])
  }, [])

  return (
    <div>
      <Form
        {...{
          labelCol: {
            xs: { span: 24 },
            sm: { span: 6 }
          },
          wrapperCol: {
            xs: { span: 24 },
            sm: { span: 14 }
          }
        }}
        form={form}
        variant="filled"
        // initialValues={data}
        style={{ maxWidth: 600 }}
        name="movieDetail"
      >
        <Form.Item
          label={t('form.cover.label')}
          rules={[{ required: true, message: t('form.cover.required') }]}
        >
          <ImgCrop rotationSlider>
            <Upload
              action="https://run.mocky.io/v3/435e224c-44fb-4773-9faf-380c5e6a2188"
              listType="picture"
              maxCount={1}
              onChange={onChange}
              onPreview={onPreview}
              onRemove={() => {
                setFileList([])
                return true
              }}
            >
              {!fileList?.length ? <Button>{t('button.upload')}</Button> : null}
            </Upload>
          </ImgCrop>
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
          label={t('form.level.label')}
          rules={[{ required: false, message: t('form.level.required') }]}
        >
          <Select />
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
            onChange={(date) => {
              data.endDate = date
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
                  http({
                    url: 'movie/save',
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
    </div>
  )
}
