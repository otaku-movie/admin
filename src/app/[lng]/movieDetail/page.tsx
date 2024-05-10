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
import { PageProps } from '../layout'
import { useRouter, useSearchParams } from 'next/navigation'
import http from '@/api'
import dayjs from 'dayjs'
import { Movie } from '@/type/api'

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0]

export default function MovieDetail({ params: { lng } }: PageProps) {
  const { t } = useTranslation(lng, 'movieDetail')
  const [form] = Form.useForm()
  const [data, setData] = useState<
    Partial<
      Movie & {
        startDate: dayjs.Dayjs
        endDate: dayjs.Dayjs
      }
    >
  >({
    startDate: dayjs(),
    endDate: dayjs()
  })

  const router = useRouter()
  const searchParams = useSearchParams()
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

  const getData = () => {
    http({
      url: 'movie/detail',
      method: 'get',
      params: {
        id: searchParams.get('id')
      }
    }).then((res) => {
      setData({
        ...res.data,
        startDate: dayjs(res.data.startDate || new Date()),
        endDate: dayjs(res.data.endDate || undefined)
      })
      // form.setFieldsValue({
      //   ...res.data,
      //   startDate: dayjs(res.data.startDate || new Date()),
      //   endDate: dayjs(res.data.endDate || new Date())
      // })
    })
  }
  const spec = [
    {
      label: '2D',
      value: '2D'
    },
    {
      label: '3D',
      value: '3D'
    },
    {
      label: 'IMAX',
      value: 'IMAX'
    },
    {
      label: 'MX4D',
      value: 'MX4D'
    },
    {
      label: '4DX',
      value: '4DX'
    },
    {
      label: 'Dolby Cinema',
      value: 'Dolby Cinema'
    },
    {
      label: 'screen X',
      value: 'screen X'
    }
  ]

  useEffect(() => {
    getData()
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
        style={{ maxWidth: 600 }}
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
          label={t('form.homePage.label')}
          rules={[{ required: true, message: t('form.homePage.required') }]}
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
          label={t('form.name.label')}
          rules={[{ required: true, message: t('form.name.required') }]}
        >
          <Input
            value={data.name}
            onChange={(e) => {
              data.name = e.target.value
              setData({
                ...data
              })
            }}
          />
        </Form.Item>

        <Form.Item
          label={t('form.originalName.label')}
          rules={[{ required: true, message: t('form.originalName.required') }]}
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
          rules={[{ required: true, message: t('form.time.required') }]}
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
          label={t('form.spec.label')}
          rules={[{ required: true, message: t('form.spec.required') }]}
        >
          <Checkbox.Group>
            <Row gutter={[20, 10]}>
              {spec.map((item) => {
                return (
                  <Col key={item.value}>
                    <Checkbox value={item.value}>{item.label}</Checkbox>
                  </Col>
                )
              })}
            </Row>
          </Checkbox.Group>
        </Form.Item>

        <Form.Item
          label={t('form.level.label')}
          rules={[{ required: true, message: t('form.level.required') }]}
        >
          <Select />
        </Form.Item>

        <Form.Item
          label={t('form.startDate.label')}
          rules={[{ required: true, message: t('form.startDate.required') }]}
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
          rules={[{ required: true, message: t('form.endDate.required') }]}
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
          <Button
            type="primary"
            htmlType="submit"
            onClick={() => {
              http({
                url: 'movie/save',
                method: 'post',
                data: {
                  ...data,
                  startDate: data.startDate?.format('YYYY-MM-DD'),
                  endDate: data.endDate?.format('YYYY-MM-DD')
                }
              }).then((res) => {
                message.success('保存成功')
              })
            }}
          >
            {t('form.save')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}
