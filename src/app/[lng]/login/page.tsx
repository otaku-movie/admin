'use client'
import React, { useEffect, useState } from 'react'
import { Button, Input, Form } from 'antd'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../layout'
import { useRouter } from 'next/navigation'
import { emailRegExp, passwordRegExp } from '@/utils'
import { processPath } from '@/config/router'
import { useUserStore } from '@/store/useUserStore'
import { md5 } from 'js-md5'
import './style.scss'

interface Query {
  email: string
  password: string
}

export default function Page({ params: { lng } }: PageProps) {
  const store = useUserStore()
  const { t } = useTranslation(lng, 'login')
  const { t: common } = useTranslation(lng, 'common')
  const [form] = Form.useForm()
  const router = useRouter()
  const [query, setQuery] = useState<Query>({
    email: '',
    password: ''
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
                store
                  .login({
                    ...query,
                    password: query.password ? md5(query.password) : ''
                  })
                  .then((res) => {
                    if (res) {
                      const redirectURL = localStorage.getItem('redirectURL')
                      if (redirectURL) {
                        localStorage.setItem('redirectURL', '')
                        location.href = redirectURL
                      } else {
                        localStorage.setItem('redirectURL', '')
                        router.push(processPath('movieList'))
                      }
                    }
                  })
              }}
            >
              {common('button.login')}
            </Button>
          </Form.Item>
        </Form>
      </section>
    </section>
  )
}
