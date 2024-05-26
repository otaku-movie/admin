'use client'
import React, { useState, useEffect } from 'react'
import { Button, Form, Input } from 'antd'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../../layout'
import { Cinema } from '@/type/api'
import { useRouter, useSearchParams } from 'next/navigation'
import http from '@/api'
import { CheckPermission } from '@/components/checkPermission'

export default function Page({ params: { lng } }: PageProps) {
  const { t } = useTranslation(lng, 'cinemaDetail')
  const [data, setData] = useState<Partial<Cinema>>({})
  const [form] = Form.useForm()
  const router = useRouter()
  const searchParams = useSearchParams()

  const getData = () => {
    if (searchParams.has('id')) {
      http({
        url: 'cinema/detail',
        method: 'get',
        params: {
          id: searchParams.get('id')
        }
      }).then((res) => {
        console.log(res.data)
        setData({
          ...res.data
        })
      })
    }
  }

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
          label={t('form.name.label')}
          rules={[{ required: true, message: t('form.name.required') }]}
        >
          <Input
            value={data.name}
            onChange={(e) => {
              data.name = e.currentTarget.value
              setData({
                ...data
              })
            }}
          ></Input>
        </Form.Item>
        <Form.Item
          label={t('form.description.label')}
          rules={[{ required: true, message: t('form.description.required') }]}
        >
          <Input.TextArea
            rows={5}
            value={data.description}
            onChange={(e) => {
              data.description = e.currentTarget.value
              setData({
                ...data
              })
            }}
          ></Input.TextArea>
        </Form.Item>
        <Form.Item
          label={t('form.address.label')}
          rules={[{ required: true, message: t('form.address.required') }]}
        >
          <Input
            value={data.address}
            onChange={(e) => {
              data.address = e.target.value
              setData({
                ...data
              })
            }}
          ></Input>
        </Form.Item>
        <Form.Item
          label={t('form.tel.label')}
          rules={[{ required: true, message: t('form.tel.required') }]}
        >
          <Input
            value={data.tel}
            onChange={(e) => {
              data.tel = e.target.value
              setData({
                ...data
              })
            }}
          ></Input>
        </Form.Item>
        <Form.Item
          label={t('form.homePage.label')}
          rules={[{ required: true, message: t('form.homePage.required') }]}
        >
          <Input
            value={data.homePage}
            onChange={(e) => {
              data.homePage = e.target.value
              setData({
                ...data
              })
            }}
          ></Input>
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
          <CheckPermission code="cinema.save">
            <Button
              type="primary"
              htmlType="submit"
              onClick={() => {
                http({
                  url: 'cinema/save',
                  method: 'post',
                  data
                }).then(() => {
                  router.back()
                })
              }}
            >
              {t('form.save')}
            </Button>
          </CheckPermission>
        </Form.Item>
      </Form>
    </div>
  )
}
