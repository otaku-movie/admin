'use client'
import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Row,
  Image,
  Tag,
  Input,
  Select,
  Modal,
  message,
  Switch,
  DatePicker
} from 'antd'

import type { TableColumnsType } from 'antd'
import { status, notFoundImage } from '@/config/index'

import { Query, QueryItem } from '@/components/query'
import http from '@/api/index'
import { Cinema, SpecItem } from '@/type/api'
import { useTranslation } from '@/app/i18n/client'
import SeatModal from '@/dialog/seatModal'
import { Dict } from '@/components/dict'
import { useCommonStore } from '@/store/useCommonStore'
import MovieShowTimeModal from '@/dialog/movieShowTimeModal'
import dayjs from 'dayjs'
import { CheckPermission } from '@/components/checkPermission'
import { PageProps } from '../../layout'
import { showTotal } from '@/utils/pagination'

interface Query {
  name: string
  cinemaId: number
  status: number
  date: dayjs.Dayjs
}

export default function MoviePage({ params: { lng } }: PageProps) {
  const [cinemaData, setCinemaData] = useState<Cinema[]>([])
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState<Partial<Query>>({})
  const [showTimeModal, setShowTimeModal] = useState<any>({
    data: [],
    show: false
  })
  const [modal, setModal] = useState<any>({
    data: [],
    show: false
  })
  const getDict = useCommonStore((state) => state.getDict)
  const { t } = useTranslation(lng, 'showTime')

  const getData = (page = 1) => {
    http({
      url: 'movie_show_time/list',
      method: 'post',
      data: {
        ...query,
        page,
        pageSize: 10,
        date: query.date?.format('YYYY-MM-DD')
      }
    }).then((res) => {
      setData(res.data.list)
      setPage(page)
      setTotal(res.data.total)
    })
  }

  const getCinemaData = (
    name: string = '',
    id: number | undefined = undefined
  ) => {
    http({
      url: 'cinema/list',
      method: 'post',
      data: {
        id,
        name,
        page: 1,
        pageSize: 10
      }
    }).then((res) => {
      setCinemaData(res.data.list)
    })
  }

  useEffect(() => {
    getDict(['cinema_play_state'])
    getData()
  }, [])

  useEffect(() => {}, [query, setQuery])

  const columns: TableColumnsType = [
    {
      title: t('table.name'),
      dataIndex: 'name',
      width: 350,
      fixed: 'left',
      render(_: any, row) {
        return (
          <Space align="start">
            <Image
              width={120}
              src={row.movieCover}
              alt="poster"
              fallback={notFoundImage}
            ></Image>
            <Space direction="vertical">
              <span>{row.movieName}</span>
              <section>
                {row.spec?.map((item: SpecItem) => {
                  return (
                    <Tag
                      key={item.id}
                      style={{
                        marginBottom: '10px'
                      }}
                    >
                      {item.name}
                    </Tag>
                  )
                })}
              </section>
            </Space>
          </Space>
        )
      }
    },
    {
      title: t('table.cinema'),
      dataIndex: 'cinemaName'
    },
    {
      title: t('table.theaterHall'),
      dataIndex: 'theaterHallName'
    },
    {
      title: t('table.spec'),
      render(_, row) {
        return <Dict code={row.theaterHallSpec} name={'cinema_spec'}></Dict>
      }
    },
    {
      title: t('table.open'),
      dataIndex: '',
      render(_, row) {
        return (
          <Switch
            value={row.open}
            onChange={(val) => {
              row.open = val
              http({
                url: 'admin/movie_show_time/save',
                method: 'post',
                data: {
                  ...row,
                  open: val,
                  startTime: dayjs(row.startTime)?.format(
                    'YYYY-MM-DD HH:mm:ss'
                  ),
                  endTime: dayjs(row.endTime)?.format('YYYY-MM-DD HH:mm:ss')
                }
              }).then(() => {
                // row.open = val
                getData()
              })
            }}
          />
        )
      }
    },
    {
      title: t('table.seatSelectionRatio'),
      render(_, row) {
        return `${row.seatTotal}/${row.selectedSeatCount}`
      }
    },
    {
      title: t('table.attendance'),
      render(_, row) {
        return `${row.selectedSeatCount / row.seatTotal}%`
      }
    },
    {
      title: t('table.startDate'),
      width: 130,
      dataIndex: 'startTime'
    },
    {
      title: t('table.endDate'),
      width: 130,
      dataIndex: 'endTime'
    },
    {
      title: t('table.playState'),
      dataIndex: '',
      render(_, row) {
        return <Dict code={row.status} name={'cinema_play_state'}></Dict>
      }
    },
    {
      title: t('table.action'),
      key: 'operation',
      fixed: 'right',
      width: 100,
      render: (_, row) => {
        return (
          <Space direction="vertical" align="center">
            <CheckPermission code="">
              <Button
                onClick={() => {
                  http({
                    url: '/movie_show_time/select_seat/list',
                    method: 'get',
                    params: {
                      id: row.id
                    }
                  }).then((res) => {
                    setModal({
                      data: res.data,
                      show: true
                    })
                  })
                }}
              >
                {t('button.detail')}
              </Button>
            </CheckPermission>
            <CheckPermission code="">
              <Button
                type="primary"
                onClick={() => {
                  http({
                    url: 'movie_show_time/detail',
                    method: 'get',
                    params: {
                      id: row.id
                    }
                  }).then((res) => {
                    setShowTimeModal({
                      ...modal,
                      data: res.data,
                      show: true
                    })
                  })
                }}
              >
                {t('button.edit')}
              </Button>
            </CheckPermission>
            <CheckPermission code="">
              <Button
                type="primary"
                danger
                onClick={() => {
                  const remove = () => {
                    return new Promise((resolve, reject) => {
                      http({
                        url: 'admin/movie_show_time/remove',
                        method: 'delete',
                        params: {
                          id: row.id
                        }
                      })
                        .then(() => {
                          message.success(t('message.remove.success'))
                          getData()
                          resolve(true)
                        })
                        .catch(reject)
                    })
                  }

                  Modal.confirm({
                    title: t('button.remove'),
                    content: t('message.remove.content'),
                    onCancel() {
                      console.log('Cancel')
                    },
                    onOk() {
                      if (row.selectedSeatCount !== 0) {
                        Modal.confirm({
                          title: t('button.remove'),
                          content: t('message.remove.selectedCount', {
                            count: row.selectedSeatCount
                          }),
                          onCancel() {
                            console.log('Cancel')
                          },
                          onOk() {
                            remove()
                          }
                        })
                      } else {
                        remove()
                      }                 
                    }
                  })
                }}
              >
                {t('button.remove')}
              </Button>
            </CheckPermission>
          </Space>
        )
      }
    }
  ]

  return (
    <section>
      <Space direction="vertical" size={30}>
        <Row justify="end">
          <CheckPermission code="">
            <Button
              onClick={() => {
                setShowTimeModal({
                  ...modal,
                  data: {},
                  show: true
                })
              }}
            >
              {t('button.add')}
            </Button>
          </CheckPermission>
        </Row>
        <Query
          model={query}
          onSearch={() => {
            console.log(query)
            getData()
          }}
          onClear={(obj) => {
            setQuery({ ...obj })
          }}
        >
          <QueryItem label={t('table.name')}>
            <Input
              value={query.name}
              onChange={(e) => {
                query.name = e.target.value
                setQuery(query)
              }}
            ></Input>
          </QueryItem>
          <QueryItem label={t('query.cinema')}>
            <Select
              showSearch
              onChange={(val) => {
                query.cinemaId = val
                setQuery(query)
              }}
              value={query.cinemaId}
              onSearch={getCinemaData}
            >
              {cinemaData.map((item) => (
                <Select.Option value={item.id} key={item.id}>
                  {item.name}
                </Select.Option>
              ))}
            </Select>
          </QueryItem>
          <QueryItem label={t('query.date')}>
            <DatePicker
              value={query.date}
              style={{
                width: '100%'
              }}
              onChange={(val) => {
                query.date = val
                setQuery(query)
              }}
            ></DatePicker>
          </QueryItem>
          <QueryItem label={t('table.playState')}>
            <Select
              value={query.status}
              onChange={(val) => {
                query.status = val
                setQuery(query)
              }}
            >
              {Object.entries(status).map((item, index) => {
                const [key, value] = item

                return (
                  <Select.Option value={key} key={index}>
                    {value}
                  </Select.Option>
                )
              })}
            </Select>
          </QueryItem>
        </Query>

        <Table
          columns={columns}
          dataSource={data}
          bordered={true}
          pagination={{
            pageSize: 10,
            current: page,
            total,
            showTotal,
            onChange(page) {
              getData(page)
            },
            position: ['bottomCenter']
          }}
        />
      </Space>
      <SeatModal
        type="create"
        show={modal.show}
        data={modal.data}
        onConfirm={() => {
          setModal({
            ...modal,
            show: false
          })
        }}
        onCancel={() => {
          setModal({
            ...modal,
            show: false
          })
        }}
      ></SeatModal>
      <MovieShowTimeModal
        show={showTimeModal.show}
        type={showTimeModal.type}
        data={showTimeModal.data}
        onConfirm={() => {
          setShowTimeModal({
            ...showTimeModal,
            show: false
          })
          getData()
        }}
        onCancel={() => {
          setShowTimeModal({
            ...showTimeModal,
            show: false
          })
        }}
      ></MovieShowTimeModal>
    </section>
  )
}
