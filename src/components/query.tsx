import React, { useState, useEffect, createContext, useContext } from 'react'
import { DownOutlined } from '@ant-design/icons'
import { useTranslation } from '@/app/i18n/client'
import {
  Form,
  theme,
  Row,
  Col,
  Space,
  Button,
  type FormProps,
  type FormItemProps
} from 'antd'
import { languageType } from '@/config'

export type QueryProps = {
  column?: number
  children: React.ReactNode
} & FormProps

export type QueryItemProps = {
  column?: number
} & FormItemProps

const FormContext = createContext({
  query: {
    column: 1
  }
})

export function QueryItem(props: QueryItemProps) {
  const { column = 1 } = props
  const context = useContext(FormContext)
  const queryColumn = 24 / context.query.column
  const span = column * queryColumn

  return (
    <Col span={span}>
      <Form.Item {...props}>{props.children}</Form.Item>
    </Col>
  )
}

export function Query(props: QueryProps) {
  const { token } = theme.useToken()
  const [form] = Form.useForm()
  const { column = 4 } = props
  const [expand, setExpand] = useState(false)

  const { t } = useTranslation(navigator.language as languageType, 'components')

  const formStyle: React.CSSProperties = {
    background: token.colorFillAlter,
    borderRadius: token.borderRadiusLG,
    padding: 24
  }

  const onFinish = (values: any) => {
    console.log('Received values of form: ', values)
  }

  return (
    <section
      style={{
        width: '100%'
      }}
    >
      <FormContext.Provider
        value={{
          query: {
            column
          }
        }}
      >
        <Form
          form={form}
          name="advanced_search"
          style={formStyle}
          onFinish={onFinish}
        >
          <Row gutter={24}>{props.children}</Row>

          <div style={{ textAlign: 'right' }}>
            <Space size="small">
              <Button type="primary" htmlType="submit">
                {t('query.search')}
              </Button>
              <Button
                onClick={() => {
                  form.resetFields()
                }}
              >
                {t('query.clear')}
              </Button>
              <a
                style={{ fontSize: 12 }}
                onClick={() => {
                  setExpand(!expand)
                }}
              >
                <DownOutlined rotate={expand ? 180 : 0} />{' '}
                {expand ? t('query.collapseClose') : t('query.collapse')}
              </a>
            </Space>
          </div>
        </Form>
      </FormContext.Provider>
    </section>
  )
}
