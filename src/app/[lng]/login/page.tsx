'use client'
import React, { useEffect, useState } from 'react'
import { Button, Input, Form } from 'antd'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../layout'
import { useRouter } from 'next/navigation'
import { emailRegExp, passwordRegExp } from '@/utils'
import { processPath } from '@/config/router'
import { userStore } from '@/store/userStore'
import './style.scss'

interface Query {
  email: string
  password: string
}

export default function Page({ params: { lng } }: PageProps) {
  const store = userStore()
  const { t } = useTranslation(lng, 'login')
  const [form] = Form.useForm()
  const router = useRouter()
  const [query, setQuery] = useState<Query>({
    email: '2495713984@qq.com',
    password: '123456'
  })

  useEffect(() => {}, [])

  return (
    <section className="login">
      <section className="login-box">
        <Form
          name="basic"
          // labelCol={{ span: 4 }}
          // wrapperCol={{ span: 16 }}
          style={{ width: 300 }}
          form={form}
        >
          <Form.Item
            rules={[
              {
                required: true,
                message: t('form.email.required')
              },
              {
                pattern: emailRegExp,
                validateTrigger: ['onChange', 'onBlur'],
                message: t('form.email.error')
              }
            ]}
          >
            <Input
              value={query.email}
              placeholder={t('form.email.required')}
              onChange={(e) => {
                setQuery({
                  ...query,
                  email: e.currentTarget.value
                })
              }}
            />
          </Form.Item>

          <Form.Item
            rules={[
              { required: true, message: t('form.password.required') },
              {
                pattern: passwordRegExp,
                validateTrigger: ['onChange', 'onBlur'],
                message: t('form.password.error')
              }
            ]}
          >
            <Input.Password
              placeholder={t('form.password.required')}
              value={query.password}
              onChange={(e) => {
                setQuery({
                  ...query,
                  password: e.currentTarget.value
                })
              }}
            />
          </Form.Item>
          <Form.Item
            style={{
              marginBottom: '0'
            }}
          >
            <Button
              type="primary"
              style={{
                width: '100%',
                height: '40px'
              }}
              onClick={() => {
                store.login(query).then((res) => {
                  if (res) {
                    router.push(processPath('movie'))
                  }
                })
              }}
            >
              {t('button.login')}
            </Button>
          </Form.Item>
        </Form>
      </section>
    </section>
  )
}
