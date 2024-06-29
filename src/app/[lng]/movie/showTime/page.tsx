'use client'
import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Row,
  Image,
  Tag,
  Select,
  Modal,
  message,
  Switch,
  DatePicker,
  Flex
} from 'antd'

import type { TableColumnsType } from 'antd'
import { status, notFoundImage } from '@/config/index'

import { Query, QueryItem } from '@/components/query'
import http from '@/api/index'
import { Cinema, SpecItem, theaterHall } from '@/type/api'
import { useTranslation } from '@/app/i18n/client'
import SeatModal from '@/dialog/seatModal/seatModal'
import { Dict } from '@/components/dict'
import MovieShowTimeModal from '@/dialog/movieShowTimeModal'
import dayjs from 'dayjs'
import { CheckPermission } from '@/components/checkPermission'
import { PageProps } from '../../layout'
import { showTotal } from '@/utils/pagination'
import { CreateOrderModal } from '@/dialog/createOrderModal'

interface Query {
  movieId: number
  cinemaId: number
  theaterHallId: number
  status: number
  date: dayjs.Dayjs
}

export default function MoviePage({ params: { lng } }: PageProps) {
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState<Partial<Query>>({})
  const [showTimeModal, setShowTimeModal] = useState<any>({
    data: [],
    show: false
  })
  const [createOrderModal, setCreateOrderModal] = useState<any>({
    data: [],
    show: false
  })
  const [modal, setModal] = useState<any>({
    data: [],
    show: false
  })
  const [currentRow, setCurrentRow] = useState<{
    cinemaId?: number
    id?: number
  }>({})
  const [movieData, setMovieData] = useState([])
  const [cinemaData, setCinemaData] = useState<Cinema[]>([])
  const [theaterHallData, setTheaterHallData] = useState<theaterHall[]>([])
  const { t } = useTranslation(lng, 'showTime')
  const { t: common } = useTranslation(lng, 'common')

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

  const getMovieData = (name: string = '') => {
    http({
      url: 'movie/list',
      method: 'post',
      data: {
        name,
        // 上映中
        releaseStatus: 2,
        page: 1,
        pageSize: 10
      }
    }).then((res) => {
      console.log(res.data.list)
      setMovieData(res.data?.list)
    })
  }
  const getTheaterHallData = (id: number) => {
    http({
      url: 'theater/hall/list',
      method: 'post',
      data: {
        cinemaId: id,
        page: 1,
        pageSize: 100
      }
    }).then((res) => {
      setTheaterHallData(res.data.list)
    })
  }
  const getCinemaData = (name: string = '') => {
    http({
      url: 'cinema/list',
      method: 'post',
      data: {
        name,
        page: 1,
        pageSize: 10
      }
    }).then((res) => {
      setCinemaData(res.data.list)
    })
  }

  useEffect(() => {
    getMovieData()
    getCinemaData()
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
      width: 200,
      dataIndex: 'cinemaName'
    },
    {
      title: t('table.theaterHall'),
      width: 200,
      dataIndex: 'theaterHallName'
    },
    {
      title: t('table.spec'),
      width: 200,
      dataIndex: 'theaterHallSpec'
    },
    {
      title: t('table.open'),
      dataIndex: '',
      width: 200,
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
      width: 200,
      render(_, row) {
        return `${row.seatCount}/${row.selectedSeatCount}`
      }
    },
    {
      title: t('table.attendance'),
      width: 200,
      render(_, row) {
        return `${row.selectedSeatCount || 0 / row.seatCount || 0}%`
      }
    },
    {
      title: t('table.startDate'),
      width: 200,
      dataIndex: 'startTime'
    },
    {
      title: t('table.endDate'),
      width: 200,
      dataIndex: 'endTime'
    },
    {
      title: t('table.playState'),
      dataIndex: '',
      width: 150,
      render(_, row) {
        return <Dict code={row.status} name={'cinemaPlayState'}></Dict>
      }
    },
    {
      title: t('table.action'),
      key: 'operation',
      fixed: 'right',
      width: 150,
      render: (_, row) => {
        return (
          <Space direction="vertical" align="center">
            <Button
              onClick={() => {
                setCurrentRow(row)
                setModal({
                  data: {
                    movieShowTimeId: row.id,
                    id: row.theaterHallId
                  },
                  show: true
                })
              }}
            >
              {common('button.seatSelectedDetail')}
            </Button>
            <CheckPermission code="movieShowTime.save">
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
                {common('button.edit')}
              </Button>
            </CheckPermission>
            <CheckPermission code="movieShowTime.remove">
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
                    title: common('button.remove'),
                    content: t('message.remove.content'),
                    onCancel() {
                      console.log('Cancel')
                    },
                    onOk() {
                      if (row.selectedSeatCount !== 0) {
                        Modal.confirm({
                          title: common('button.remove'),
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
                {common('button.remove')}
              </Button>
            </CheckPermission>
          </Space>
        )
      }
    }
  ]

  return (
    <section>
      <Flex vertical gap={30}>
        <Row justify="end">
          <CheckPermission code="movieShowTime.save">
            <Button
              onClick={() => {
                setShowTimeModal({
                  ...modal,
                  data: {},
                  show: true
                })
              }}
            >
              {common('button.add')}
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
            <Select
              // showSearch
              value={query.movieId}
              onChange={(val) => {
                setQuery({
                  ...query,
                  movieId: val
                })
              }}
              // onSearch={getMovieData}
            >
              {movieData.map((item: any) => {
                return (
                  <Select.Option value={item.id} key={item.id}>
                    {item.name}
                  </Select.Option>
                )
              })}
            </Select>
          </QueryItem>
          <QueryItem label={t('table.cinema')} column={1}>
            <Select
              showSearch
              onChange={(val) => {
                getTheaterHallData(val)
                setQuery({
                  ...query,
                  cinemaId: val,
                  theaterHallId: undefined
                })
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
          <QueryItem label={t('table.theaterHall')} column={1}>
            <Select
              value={query.theaterHallId}
              showSearch
              onChange={(val) => {
                setQuery({
                  ...query,
                  theaterHallId: val
                })
              }}
            >
              {theaterHallData.map((item) => (
                <Select.Option value={item.id} key={item.id}>
                  {item.name}（{item.cinemaSpecName}）
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
          sticky={{ offsetHeader: -20 }}
          scroll={{
            x: columns.reduce(
              (total, current) => total + (current.width as number),
              0
            )
          }}
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
      </Flex>
      <SeatModal
        type="create"
        show={modal.show}
        data={modal.data}
        permission="selctSeat"
        onConfirm={() => {
          // setModal({
          //   ...modal,
          //   show: false
          // })
          setCreateOrderModal({
            ...createOrderModal,
            data: currentRow,
            show: true
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
      <CreateOrderModal
        show={createOrderModal.show}
        type={createOrderModal.type}
        data={createOrderModal.data}
        onConfirm={() => {
          setCreateOrderModal({
            ...createOrderModal,
            show: false
          })
          setModal({
            ...modal,
            show: false
          })
          getData()
        }}
        onCancel={() => {
          setCreateOrderModal({
            ...createOrderModal,
            show: false
          })
        }}
      ></CreateOrderModal>
    </section>
  )
}
