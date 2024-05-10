'use client'
import React, { useState, useEffect } from 'react'
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Form, Input } from 'antd'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../layout'
import { Cinema } from '@/type/api'
import { useRouter } from 'next/navigation'
import http from '@/api'

export default function Page({ params: { lng } }: PageProps) {
  const { t } = useTranslation(lng, 'cinemaDetail')
  const [form, setForm] = useState<Partial<Cinema>>({})
  const router = useRouter()

  useEffect(() => {}, [form])

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
          label={t('form.name.label')}
          name="name"
          rules={[{ required: true, message: t('form.name.required') }]}
        >
          <Input
            value={form.name}
            onChange={(e) => {
              form.name = e.currentTarget.value
              setForm({
                ...form
              })
            }}
          ></Input>
        </Form.Item>
        <Form.Item
          label={t('form.description.label')}
          name="description"
          rules={[{ required: true, message: t('form.description.required') }]}
        >
          <Input.TextArea
            rows={5}
            value={form.description}
            onChange={(e) => {
              form.description = e.currentTarget.value
              setForm({
                ...form
              })
            }}
          ></Input.TextArea>
        </Form.Item>
        <Form.Item
          label={t('form.address.label')}
          name="address"
          rules={[{ required: true, message: t('form.address.required') }]}
        >
          <Input
            value={form.address}
            onChange={(e) => {
              form.address = e.target.value
              setForm({
                ...form
              })
            }}
          ></Input>
        </Form.Item>
        <Form.Item
          label={t('form.tel.label')}
          name="tel"
          rules={[{ required: true, message: t('form.tel.required') }]}
        >
          <Input
            value={form.tel}
            onChange={(e) => {
              form.tel = e.target.value
              setForm({
                ...form
              })
            }}
          ></Input>
        </Form.Item>
        <Form.Item
          label={t('form.homePage.label')}
          name="homePage"
          rules={[{ required: true, message: t('form.homePage.required') }]}
        >
          <Input
            value={form.homePage}
            onChange={(e) => {
              form.homePage = e.target.value
              setForm({
                ...form
              })
            }}
          ></Input>
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
          <Button
            type="primary"
            htmlType="submit"
            onClick={() => {
              console.log(form)
              http({
                url: 'cinema/save',
                method: 'post',
                data: form
              }).then((res) => {
                router.back()
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
