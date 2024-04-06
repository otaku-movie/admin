import React, { useState, useEffect, createContext, useContext } from 'react'
import { DownOutlined } from '@ant-design/icons'
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

export type QueryProps = {
  column?: number
  children: React.ReactNode
} & FormProps

export type QueryItemProps = {
  column?: number
} & FormItemProps

interface options extends QueryItemProps {
  query: {
    column: number
  }
}

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

  const formStyle: React.CSSProperties = {
    background: token.colorFillAlter,
    borderRadius: token.borderRadiusLG,
    padding: 24
  }

  const onFinish = (values: any) => {
    console.log('Received values of form: ', values)
  }

  return (
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
              Search
            </Button>
            <Button
              onClick={() => {
                form.resetFields()
              }}
            >
              Clear
            </Button>
            <a
              style={{ fontSize: 12 }}
              onClick={() => {
                setExpand(!expand)
              }}
            >
              <DownOutlined rotate={expand ? 180 : 0} /> Collapse
            </a>
          </Space>
        </div>
      </Form>
    </FormContext.Provider>
  )
}
