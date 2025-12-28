'use client'
import React, { useState, useEffect } from 'react'
import {
  Switch,
  Tag,
  Dropdown,
  FloatButton,
  Space,
  message,
  MenuProps,
  Modal,
  Typography,
  DatePicker
} from 'antd'
import { useSearchParams } from 'next/navigation'
import {
  PlusOutlined,
  LeftOutlined,
  RightOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '@/app/[lng]/layout'
import http from '@/api'
import { Dict } from '@/components/dict'
import { TodoList } from '@/components/TodoList/todoList'
import './style.scss'
import MovieShowTimeModal from '@/dialog/movieShowTimeModal'
import {
  CinemaScreeing,
  getCinemaScreeningList,
  MovieShowTimeItem
} from '@/api/request/cinema'
import dayjs from 'dayjs'

const { Text, Paragraph } = Typography

export default function CinemaPage({ params: { lng } }: Readonly<PageProps>) {
  const searchParams = useSearchParams()
  const [showTimeModal, setShowTimeModal] = useState<any>({
    data: {
      cinemaId: searchParams.get('id')
    },
    show: false
  })
  const { t } = useTranslation(lng, 'screeningManagment')
  const { t: common } = useTranslation(lng, 'common')
  const [data, setData] = useState<CinemaScreeing[]>([])
  const [day, setDay] = useState(dayjs())
  const [renderData, setRenderData] = useState<CinemaScreeing[]>([])
  const [detailModal, setDetailModal] = useState<{
    show: boolean
    item: MovieShowTimeItem | null
  }>({
    show: false,
    item: null
  })

  const i18nWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ]

  function getData() {
    getCinemaScreeningList({
      id: searchParams.get('id') as string,
      date: day.format('YYYY-MM-DD')
    }).then((res) => {
      setData(res.data as unknown as CinemaScreeing[])
      setRenderData([...(res.data as unknown as CinemaScreeing[])])
    })
  }

  useEffect(() => {
    getData()
  }, [day])

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* <Query>
        <QueryItem label={t('table.name')} column={1}>
          <Input></Input>
        </QueryItem>
      </Query> */}
      <section className="todo-top">
        <ul
          className="nav-container"
          style={{
            gridTemplateColumns: `40px 1fr 40px`
          }}
        >
          <li>
            <button
              type="button"
              onClick={() => {
                setDay(day.subtract(1, 'day'))
              }}
              style={{
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%'
              }}
            >
              <LeftOutlined />
            </button>
          </li>
          <li
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 4,
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  // DatePicker 会自动处理点击
                }
              }}
            >
              <CalendarOutlined style={{ color: '#1677ff', fontSize: 16 }} />
              <DatePicker
                value={dayjs(day)}
                onChange={(date) => {
                  if (date) {
                    setDay(date)
                  }
                }}
                format="YYYY-MM-DD"
                allowClear={false}
                variant="borderless"
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  padding: 0,
                  border: 'none',
                  boxShadow: 'none',
                  cursor: 'pointer',
                  width: '100px'
                }}
                suffixIcon={null}
                inputReadOnly={true}
              />
            </div>
            <span style={{ fontSize: 16 }}>
              （{common(`week.${i18nWeek[day.day()]}`)}）
            </span>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                setDay(day.add(1, 'day'))
              }}
              style={{
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%'
              }}
            >
              <RightOutlined />
            </button>
          </li>
        </ul>
        <ul
          className="table-header"
          style={{
            gridTemplateColumns: `40px repeat(${renderData.length}, minmax(200px, 1fr)) 40px`,
            minWidth: `${Math.max(renderData.length * 200 + 80, 100)}px`
          }}
        >
          <li>
            {/* <DoubleLeftOutlined
              style={{
                color: '#c8c8c8'
              }}
              onClick={() => {
                if (current > 1) {
                  setCurrent(current - 1)
                }
              }}
            /> */}
          </li>
          {renderData.map((item) => {
            return <li key={item.id}>{item.name}</li>
          })}
          <li>
            {/* <DoubleRightOutlined
              style={{
                color: '#929292'
              }}
            /> */}
          </li>
        </ul>
        {/* <Table
          columns={[
            {},
            ...renderData.map((children) => {
              return {
                title: children.name
              }
            }),
            {}
          ]}
          dataSource={data}
          bordered={true}
          pagination={false}
        /> */}
      </section>

      <div style={{ overflowX: 'auto', width: '100%' }}>
        <TodoList
          date={day}
          data={renderData}
          render={(item) => {
            const onClick: MenuProps['onClick'] = ({ key }) => {
              message.info(`Click on item ${key}`)
              const remove = () => {
                return new Promise((resolve, reject) => {
                  http({
                    url: 'admin/movie_show_time/remove',
                    method: 'delete',
                    params: {
                      id: item.id
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

              switch (key) {
                case 'edit':
                  http({
                    url: 'movie_show_time/detail',
                    method: 'get',
                    params: {
                      id: item.id
                    }
                  }).then((res) => {
                    setShowTimeModal({
                      ...showTimeModal,
                      data: res.data,
                      show: true
                    })
                  })
                  break
                case 'remove':
                  Modal.confirm({
                    title: common('button.remove'),
                    content: t('message.remove.content'),
                    onCancel() {
                      console.log('Cancel')
                    },
                    onOk() {
                      if (item.selectedSeatCount > 0) {
                        Modal.confirm({
                          title: common('button.remove'),
                          content: t('message.remove.selectedCount', {
                            count: item.selectedSeatCount
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
                  break
              }
            }

            const items: MenuProps['items'] = [
              {
                label: common('button.edit'),
                key: 'edit'
              },
              {
                label: common('button.remove'),
                danger: true,
                key: 'remove'
              }
            ]

            const seatRate =
              item.seatCount && item.seatCount > 0
                ? Math.round(
                    ((item.selectedSeatCount || 0) / item.seatCount) * 100
                  )
                : 0

            return (
              <Dropdown
                menu={{ items, onClick }}
                key={item.id}
                trigger={['contextMenu']}
              >
                <div
                  role="button"
                  tabIndex={0}
                  style={{
                    padding: '10px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    cursor: 'pointer',
                    borderRadius: 4,
                    transition: 'background-color 0.2s',
                    backgroundColor: item.open ? '#f0f7ff' : '#fafafa',
                    border: `1px solid ${item.open ? '#bae0ff' : '#e8e8e8'}`
                  }}
                  onClick={() => {
                    setDetailModal({ show: true, item })
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setDetailModal({ show: true, item })
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e6f4ff'
                    e.currentTarget.style.borderColor = '#91caff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = item.open
                      ? '#f0f7ff'
                      : '#fafafa'
                    e.currentTarget.style.borderColor = item.open
                      ? '#bae0ff'
                      : '#e8e8e8'
                  }}
                >
                  {/* 时间行 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8
                    }}
                  >
                    <Text
                      strong
                      style={{
                        fontSize: 14,
                        color: '#1677ff',
                        fontFamily: 'monospace'
                      }}
                    >
                      {dayjs(item.startTime).format('HH:mm')} -{' '}
                      {dayjs(item.endTime).format('HH:mm')}
                    </Text>
                    <Tag
                      color={(() => {
                        if (item.status === 1) return 'default'
                        if (item.status === 2) return 'processing'
                        return 'error'
                      })()}
                      style={{
                        margin: 0,
                        fontSize: 11,
                        lineHeight: '20px',
                        fontWeight: 500,
                        padding: '0 8px'
                      }}
                    >
                      <Dict code={item.status} name={'cinemaPlayState'}></Dict>
                    </Tag>
                  </div>

                  {/* 电影名称 */}
                  <Paragraph
                    strong
                    ellipsis={{ rows: 2 }}
                    style={{
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: '#262626',
                      marginBottom: 4,
                      margin: 0
                    }}
                    title={item.movieName}
                  >
                    {item.movieName}
                  </Paragraph>

                  {/* 字幕标签 */}
                  {item.subtitle && item.subtitle.length > 0 && (
                    <div style={{ marginBottom: 4 }}>
                      <Space wrap size={4}>
                        {item.subtitle.map((sub) => (
                          <Tag
                            color="cyan"
                            key={sub.id}
                            style={{
                              margin: 0,
                              fontSize: 10,
                              padding: '0 6px'
                            }}
                          >
                            {sub.name}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  )}

                  {/* 底部信息 */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      marginTop: 'auto',
                      paddingTop: 6,
                      borderTop: '1px solid #f0f0f0'
                    }}
                  >
                    {/* 开放状态 */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 14
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {t('table.open')}
                      </Text>
                      <span
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation()
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <Switch
                          size="small"
                          checked={item.open}
                          onChange={(val) => {
                            item.open = val
                            setData([...data])
                            http({
                              url: 'admin/movie_show_time/save',
                              method: 'post',
                              data: {
                                id: item.id,
                                open: val,
                                movieId: item.movieId,
                                cinemaId: item.cinemaId,
                                theaterHallId: item.theaterHallId,
                                showTimeTagId: item.movieShowTimeTagsId,
                                specId: item.specId,
                                startTime: dayjs(item.startTime)?.format(
                                  'YYYY-MM-DD HH:mm:ss'
                                ),
                                endTime: dayjs(item.endTime)?.format(
                                  'YYYY-MM-DD HH:mm:ss'
                                )
                              }
                            }).then(() => {
                              message.success(common('message.save'))
                              getData()
                            })
                          }}
                        />
                      </span>
                    </div>

                    {/* 座位选择率 */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 14
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {t('table.seatSelectRate')}
                      </Text>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <Text style={{ fontSize: 11 }}>
                          {item.selectedSeatCount || 0}/{item.seatCount || 0}
                        </Text>
                        <Tag
                          color={(() => {
                            if (seatRate >= 80) return 'red'
                            if (seatRate >= 50) return 'orange'
                            return 'green'
                          })()}
                          style={{
                            margin: 0,
                            fontSize: 10,
                            padding: '0 4px',
                            lineHeight: '16px'
                          }}
                        >
                          {seatRate}%
                        </Tag>
                      </div>
                    </div>
                  </div>
                </div>
              </Dropdown>
            )
          }}
        ></TodoList>
      </div>
      {/* <ul className="nav-hour">
        {Array(24)
          .fill(undefined)
          .map((item, index) => {
            return <li key={index}>{index + 1}</li>
          })}
      </ul> */}
      <FloatButton
        shape="circle"
        type="primary"
        style={{ insetInlineEnd: 94 }}
        icon={<PlusOutlined />}
        onClick={() => {
          setShowTimeModal({
            data: {
              cinemaId: searchParams.get('id')
            },
            show: true
          })
        }}
      />
      <Modal
        title={null}
        open={detailModal.show}
        footer={null}
        onCancel={() => {
          setDetailModal({ show: false, item: null })
        }}
        width={500}
      >
        {detailModal.item && (
          <div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: 16 }}>
                <span style={{ fontWeight: 500, marginRight: 8 }}>
                  {t('table.tags')}：
                </span>
                <Space wrap size={5}>
                  {detailModal.item.movieShowTimeTags?.map((sub) => {
                    return (
                      <Tag color="#2db7f5" key={sub.id}>
                        {sub.name}
                      </Tag>
                    )
                  })}
                </Space>
              </li>
            </ul>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 12 }}>
                {dayjs(detailModal.item.startTime).format('HH:mm:ss')} -{' '}
                {dayjs(detailModal.item.endTime).format('HH:mm:ss')}
              </div>
              <div
                style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}
              >
                <Tag color="blue">
                  <Dict
                    code={detailModal.item.status}
                    name={'cinemaPlayState'}
                  ></Dict>
                </Tag>
                <Paragraph
                  strong
                  ellipsis={{ rows: 2 }}
                  style={{
                    fontSize: 14,
                    lineHeight: 1.5,
                    flex: 1,
                    margin: 0
                  }}
                  title={detailModal.item.movieName}
                >
                  {detailModal.item.movieName}
                </Paragraph>
              </div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                  fontSize: 14
                }}
              >
                <span style={{ fontSize: 14 }}>{t('table.open')}：</span>
                <Switch
                  checked={detailModal.item.open}
                  onChange={(val) => {
                    const updatedItem = { ...detailModal.item!, open: val }
                    setDetailModal({ show: true, item: updatedItem })
                    http({
                      url: 'admin/movie_show_time/save',
                      method: 'post',
                      data: {
                        id: detailModal.item!.id,
                        open: val,
                        movieId: detailModal.item!.movieId,
                        cinemaId: detailModal.item!.cinemaId,
                        theaterHallId: detailModal.item!.theaterHallId,
                        showTimeTagId: detailModal.item!.movieShowTimeTagsId,
                        specId: detailModal.item!.specId,
                        startTime: dayjs(detailModal.item!.startTime)?.format(
                          'YYYY-MM-DD HH:mm:ss'
                        ),
                        endTime: dayjs(detailModal.item!.endTime)?.format(
                          'YYYY-MM-DD HH:mm:ss'
                        )
                      }
                    }).then(() => {
                      message.success(common('message.save'))
                      getData()
                    })
                  }}
                />
              </li>
              <li
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                  fontSize: 14
                }}
              >
                <span style={{ fontSize: 14 }}>
                  {t('table.seatSelectRate')}：
                </span>
                <span style={{ fontSize: 14 }}>
                  <span style={{ marginRight: '8px' }}>
                    {detailModal.item.selectedSeatCount || 0} /
                    {detailModal.item.seatCount || 0}
                  </span>
                  <span style={{ fontWeight: 500 }}>
                    {detailModal.item.seatCount &&
                    detailModal.item.seatCount > 0
                      ? Math.round(
                          ((detailModal.item.selectedSeatCount || 0) /
                            detailModal.item.seatCount) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </span>
              </li>
              {detailModal.item.subtitle &&
                detailModal.item.subtitle.length > 0 && (
                  <li>
                    <Space wrap size={5}>
                      {detailModal.item.subtitle.map((sub) => {
                        return (
                          <Tag color="#2db7f5" key={sub.id}>
                            {sub.name}
                          </Tag>
                        )
                      })}
                    </Space>
                  </li>
                )}
            </ul>
          </div>
        )}
      </Modal>
      <MovieShowTimeModal
        show={showTimeModal.show}
        type={showTimeModal.type}
        data={showTimeModal.data}
        fromScreeningManagement={true}
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
