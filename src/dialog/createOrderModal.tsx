'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from '@/app/i18n/client'
import {
  Form,
  Modal,
  Select,
  Space,
  Image,
  TableColumnsType,
  Table
} from 'antd'
import http from '@/api'
import { languageType, notFoundImage } from '@/config'

interface ModalProps {
  type: 'create' | 'edit'
  show?: boolean
  data: Record<string, any>
  onConfirm?: () => void
  onCancel?: () => void
}

interface Query {
  id?: number
  movieTicketTypeId?: number
}

export function CreateOrderModal(props: ModalProps) {
  const { t } = useTranslation(navigator.language as languageType, 'showTime')
  const { t: common } = useTranslation(
    navigator.language as languageType,
    'common'
  )
  const [form] = Form.useForm()
  const [query, setQuery] = useState<Query>({})
  const [ticketData, setTicketData] = useState([])
  const [data, setData] = useState<any[]>([])

  const columns: TableColumnsType = [
    {
      title: t('createOrderModal.table.name'),
      dataIndex: 'name',
      width: 250,
      fixed: 'left',
      render(_: any, row) {
        return (
          <Space align="start">
            <Image
              width={80}
              src={row.moviePoster}
              alt="poster"
              fallback={notFoundImage}
            ></Image>
            <span>{row.movieName}</span>
          </Space>
        )
      }
    },
    {
      title: t('createOrderModal.table.spec'),
      dataIndex: ''
    },
    {
      title: t('createOrderModal.table.seat'),
      render(_, row) {
        return row.x + '排' + row.y + '座'
      }
    },
    {
      title: t('createOrderModal.table.area'),
      dataIndex: 'areaName'
    },
    {
      title: t('createOrderModal.table.price'),
      dataIndex: 'areaPrice'
    },
    {
      title: t('createOrderModal.table.plusPrice'),
      dataIndex: 'plusPrice'
    },
    {
      title: t('createOrderModal.table.movieTicketType'),
      width: 250,
      render(_, row) {
        if (!row.areaPrice) {
          return (
            <Form
              name="basic"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
              style={{ maxWidth: 600 }}
              form={form}
            >
              <Form.Item
                rules={[
                  {
                    required: true,
                    message: t('createOrderModal.form.movieTicketType.required')
                  }
                ]}
                name="movieTicketTypeId"
              >
                <Select
                  allowClear
                  style={{ width: '250px' }}
                  placeholder={t(
                    'createOrderModal.form.movieTicketType.required'
                  )}
                  value={query.movieTicketTypeId}
                  onChange={(val) => {
                    setQuery({
                      ...query,
                      movieTicketTypeId: val
                    })
                  }}
                >
                  {ticketData.map((item: any) => {
                    return (
                      <Select.Option value={item.id} key={item.id}>
                        {item.name}（{item.price}
                        {common('unit.jpy')}）
                      </Select.Option>
                    )
                  })}
                </Select>
              </Form.Item>
            </Form>
          )
        }
      }
    }
  ]

  const getTicketData = () => {
    http({
      url: 'movie/ticketType/list',
      method: 'post',
      data: {
        cinemaId: props.data.cinemaId
      }
    }).then((res) => {
      setTicketData(res.data)
    })
  }
  const getData = () => {
    http({
      url: 'movie_show_time/user_select_seat',
      method: 'get',
      params: {
        movieShowTimeId: props.data.id
      }
    }).then((res) => {
      setData(res.data)
    })
  }

  useEffect(() => {
    console.log(props.data)
    if (props.show && props.data.cinemaId) {
      form.resetFields()
      getTicketData()
      getData()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.show, props.data])

  const total = useMemo(() => {
    return data.reduce((total, current) => {
      return current.areaPrice ? total + current.areaPrice : total
    }, 0)
  }, [data])
  return (
    <Modal
      title={t('createOrderModal.title')}
      open={props.show}
      maskClosable={false}
      width={'80%'}
      onOk={() => {
        form.validateFields().then(() => {
          // http({
          //   url: 'admin/character/save',
          //   method: 'post',
          //   data: {
          //     ...query
          //   }
          // }).then(() => {
          //   props?.onConfirm?.()
          // })
        })
      }}
      onCancel={props?.onCancel}
    >
      <Table
        columns={columns}
        dataSource={data}
        bordered={true}
        pagination={false}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
              <Table.Summary.Cell index={1}></Table.Summary.Cell>
              <Table.Summary.Cell index={2}></Table.Summary.Cell>
              <Table.Summary.Cell index={3}>{total}</Table.Summary.Cell>
              <Table.Summary.Cell index={4}></Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </Modal>
  )
}
