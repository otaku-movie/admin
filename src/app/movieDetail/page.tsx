'use client'
import React, { useState } from 'react'
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Upload
} from 'antd'
import type { GetProp, UploadFile, UploadProps } from 'antd'
import ImgCrop from 'antd-img-crop'

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0]

export default function MovieDetail() {
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
        variant="filled"
        style={{ maxWidth: 600 }}
      >
        <Form.Item
          label="タイトル"
          name="Input"
          rules={[{ required: true, message: 'Please input!' }]}
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
              {!fileList?.length ? <Button>アップロード</Button> : null}
            </Upload>
          </ImgCrop>
        </Form.Item>
        <Form.Item
          label="タイトル"
          name="Input"
          rules={[{ required: true, message: 'Please input!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="タイム"
          name="InputNumber"
          rules={[{ required: true, message: 'タイムを入力してください' }]}
        >
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="紹介"
          name="TextArea"
          rules={[{ required: true, message: '紹介内容を入力してください' }]}
        >
          <Input.TextArea />
        </Form.Item>

        <Form.Item
          label="レベル"
          name="Select"
          rules={[{ required: true, message: 'レベルを選択してください' }]}
        >
          <Select />
        </Form.Item>

        <Form.Item
          label="上映開始時期"
          name="DatePicker"
          rules={[
            { required: true, message: '上映開始時期を入力してください' }
          ]}
        >
          <DatePicker />
        </Form.Item>
        <Form.Item
          label="上映終了時期"
          name="DatePicker"
          rules={[
            { required: true, message: '上映終了時期を入力してください' }
          ]}
        >
          <DatePicker />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
          <Button type="primary" htmlType="submit">
            保存
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}
