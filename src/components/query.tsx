import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext
} from 'react'
import cloneDeep from 'lodash/cloneDeep'
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

type Option = {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  xxl: number
  xxxl: number
  xxxxl: number
}

export type QueryProps = {
  column?: number
  children: React.ReactNode
  model: Record<string, any>
  maxLine?: number
  option: Option
  onSearch?: () => void
  onClear?: (obj: Record<string, any>) => void
  defaultCol?: keyof Option
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
  const [renderChildren, setRenderChildren] = useState<
    React.ReactElement<QueryItemProps>[]
  >([])
  const { token } = theme.useToken()
  const [form] = Form.useForm()
  const autoCol = {
    xs: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 3,
    xxl: 4,
    xxxl: 5,
    xxxxl: 6
  }
  const { maxLine = 2, option = autoCol, defaultCol = 'lg' } = props
  const [expand, setExpand] = useState(false)
  const initialValue = cloneDeep(props.model)
  const container = useRef(null)
  const row = 24
  const current = defaultCol
  const column = option[current]
  const max = maxLine * row
  const [childrenColumn, setChildrenColumn] = useState(column)

  const children = React.Children.toArray(
    props.children
  ) as unknown as React.ReactElement<QueryItemProps>[]
  const totalSpan = children.reduce(
    (total, current) => total + ((current.props?.column || 1) * row) / column,
    0
  )

  const { t } = useTranslation(navigator.language as languageType, 'components')

  const formStyle: React.CSSProperties = {
    background: token.colorFillAlter,
    borderRadius: token.borderRadiusLG,
    padding: 24
  }

  const onFinish = (values: any) => {
    console.log(values)
    console.log('Received values of form: ', values)
    props.onSearch?.()
  }

  const getColumn = (width: number) => {
    const map = {
      xs: 576,
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
      xxl: 1600,
      xxxl: 1920,
      xxxxl: 2560
    }

    const keys = Object.keys(map)
    // eslint-disable-next-line array-callback-return
    const result = keys.find((key, index) => {
      if (key === 'xs' && width < map[key]) {
        return true
      } else {
        if (index === keys.length - 1) return true
        if (index < keys.length) {
          if (width >= map[key] && width < map[keys[index + 1]]) {
            return true
          }
        }
      }
    })

    return result as keyof Option
  }

  const collapse = (column = 3): React.ReactElement<QueryItemProps>[] => {
    if (expand) return children

    const arr = []
    let init = 0

    for (let i = 0; i < children.length; i++) {
      const node = children[i]
      const span = ((node.props?.column || 1) * row) / column

      init += span
      arr.push(node)

      if (init >= max) {
        break
      }
    }

    return arr
  }

  useEffect(() => {
    if (container.current) {
      const observer = new ResizeObserver((entries) => {
        const target = entries[0].target as HTMLElement
        const size = getColumn(target.offsetWidth)

        setRenderChildren(collapse(autoCol[size]))
        setChildrenColumn(autoCol[size])
      })
      observer.observe(container.current as HTMLElement)
    } else {
      setRenderChildren([...collapse()])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expand])

  return (
    <section
      style={{
        width: '100%'
      }}
      ref={container}
    >
      <FormContext.Provider
        value={{
          query: {
            column: childrenColumn
          }
        }}
      >
        <Form
          form={form}
          name="advanced_search"
          style={formStyle}
          initialValues={props.model}
          onFinish={onFinish}
        >
          <Row gutter={row}>{renderChildren}</Row>

          <div style={{ textAlign: 'right' }}>
            <Space size="small">
              <Button type="primary" htmlType="submit">
                {t('query.search')}
              </Button>
              <Button
                onClick={() => {
                  form.resetFields()
                  console.log(props.model)
                  console.log('clear =====', initialValue)
                  props.onClear?.(initialValue)
                }}
              >
                {t('query.clear')}
              </Button>
              {totalSpan > max ? (
                <a
                  style={{ fontSize: 12 }}
                  onClick={() => {
                    setExpand(!expand)
                  }}
                >
                  <DownOutlined rotate={expand ? 180 : 0} />{' '}
                  {expand ? t('query.collapseClose') : t('query.collapse')}
                </a>
              ) : null}
            </Space>
          </div>
        </Form>
      </FormContext.Provider>
    </section>
  )
}
