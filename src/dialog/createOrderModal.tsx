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
  Table,
  message
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
      dataIndex: 'specName'
    },
    {
      title: t('createOrderModal.table.seat'),
      render(_, row) {
        return row.x + '排' + row.y + '座'
      }
    },
    {
      title: t('createOrderModal.table.area'),
      render(_, row) {
        if (row.areaName) {
          return `${row.areaName}（${row.areaPrice}${common('unit.jpy')}）`
        }
      }
    },
    {
      title: t('createOrderModal.table.price'),
      dataIndex: 'price'
    },
    {
      title: t('createOrderModal.table.plusPrice'),
      dataIndex: 'plusPrice'
    },
    {
      title: t('createOrderModal.table.movieTicketType'),
      width: 250,
      render(_, row, index) {
        return (
          <Select
            style={{ width: '250px' }}
            placeholder={t('createOrderModal.form.movieTicketType.required')}
            value={row.movieTicketTypeId}
            onChange={(val) => {
              data[index].movieTicketTypeId = val
              const find: any = ticketData.find(
                (item: { id: number; price: number }) =>
                  item.id === data[index].movieTicketTypeId
              )

              if (find) {
                // eslint-disable-next-line
                console.log(
                  find.price,
                  row.areaPrice || 0,
                  Number(row.plusPrice)
                )
                data[index].price =
                  find.price + (row.areaPrice || 0) + Number(row.plusPrice)

                setData([...data])
              }
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
        )
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
    if (props.show && props.data.cinemaId) {
      form.resetFields()
      getTicketData()
      getData()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.show, props.data])

  const total = useMemo(() => {
    return data.reduce((total, current) => {
      return current.price ? total + current.price || 0 : total
    }, 0)
  }, [data])

  return (
    <Modal
      title={t('createOrderModal.title')}
      open={props.show}
      maskClosable={false}
      width={'80%'}
      onOk={() => {
        const every = data.every((item) => item.movieTicketTypeId)
        
        if (every) {
          if (data.length > 0) {
            http({
              url: 'order/create',
              method: 'post',
              data: {
                movieShowTimeId: data[0]?.movieShowTimeId,
                seat: data.map((item) => {
                  return {
                    x: item.x,
                    y: item.y,
                    movieTicketTypeId: item.movieTicketTypeId
                  }
                })
              }
            }).then(() => {
              props?.onConfirm?.()
            })
          }
        } else {
          message.warning(
            t('createOrderModal.message.movieTicketTypeId.required')
          )
        }
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
              <Table.Summary.Cell index={0}>
                {t('createOrderModal.total')}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}></Table.Summary.Cell>
              <Table.Summary.Cell index={2}></Table.Summary.Cell>
              <Table.Summary.Cell index={3}></Table.Summary.Cell>
              <Table.Summary.Cell index={4}>
                {total}
                {common('unit.jpy')}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5}></Table.Summary.Cell>
              <Table.Summary.Cell index={6}></Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </Modal>
  )
}
