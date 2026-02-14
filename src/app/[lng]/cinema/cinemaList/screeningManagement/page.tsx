'use client'
import React, { useState, useEffect } from 'react'
import {
  Switch,
  Tag,
  Dropdown,
  FloatButton,
  Space,
  Button,
  message,
  MenuProps,
  Modal,
  Typography,
  DatePicker
} from 'antd'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  PlusOutlined,
  LeftOutlined,
  RightOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '@/app/[lng]/layout'
import { processPath } from '@/config/router'
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
import { useCommonStore } from '@/store/useCommonStore'
import { DictCode } from '@/enum/dict'

const { Text, Paragraph } = Typography

export default function CinemaPage({ params: { lng } }: Readonly<PageProps>) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showTimeModal, setShowTimeModal] = useState<any>({
    data: {
      cinemaId: searchParams.get('id')
    },
    show: false
  })
  const { t } = useTranslation(lng, 'screeningManagment')
  const { t: common } = useTranslation(lng, 'common')
  const commonStore = useCommonStore()
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
    <section className="screening-page" aria-label={t('pageTitle')} title={t('pageTitle')}>
      {/* <Query>
        <QueryItem label={t('table.name')} column={1}>
          <Input></Input>
        </QueryItem>
      </Query> */}
      <section className="todo-top">
        <ul className="nav-container nav-date-bar">
          <li>
            <button
              type="button"
              onClick={() => {
                setDay(day.subtract(1, 'day'))
              }}
              className="day-nav-btn"
              title={t('prevDay')}
              aria-label={t('prevDay')}
            >
              <LeftOutlined />
            </button>
          </li>
          <li className="nav-date-inner">
            <div
              className="date-picker-trigger"
              role="button"
              tabIndex={0}
              title={t('selectDate')}
              aria-label={t('selectDate')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.preventDefault() }}
            >
              <CalendarOutlined className="calendar-icon" />
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
                suffixIcon={null}
                inputReadOnly={true}
              />
            </div>
            <span className="week-text">
              （{common(`week.${i18nWeek[day.day()]}`)}）
            </span>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                setDay(day.add(1, 'day'))
              }}
              className="day-nav-btn"
              title={t('nextDay')}
              aria-label={t('nextDay')}
            >
              <RightOutlined />
            </button>
          </li>
        </ul>
        {/* 列宽与最小宽度依赖 renderData.length，仅通过 CSS 变量传入 */}
        <ul
          className="table-header table-header-dynamic"
          style={
            {
              '--table-grid-cols': `40px repeat(${renderData.length}, minmax(200px, 1fr)) 40px`,
              '--table-min-width': `${Math.max(renderData.length * 200 + 80, 100)}px`
            } as React.CSSProperties
          }
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

      <div className="scroll-wrapper">
        <TodoList
          date={day}
          data={renderData}
          render={(item) => {
            const onClick: MenuProps['onClick'] = ({ key }) => {
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
                  {
                    const cinemaId = searchParams.get('id')
                    if (cinemaId) {
                      router.push(
                        processPath({
                          name: 'screeningManagementRelease',
                          query: { id: cinemaId, showTimeId: item.id }
                        }) as string
                      )
                    } else {
                      http({
                        url: 'movie_show_time/detail',
                        method: 'get',
                        params: { id: item.id }
                      }).then((res) => {
                        setShowTimeModal({
                          ...showTimeModal,
                          data: res.data,
                          show: true
                        })
                      })
                    }
                  }
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
                  className={`show-time-card ${item.open ? 'open' : 'closed'}`}
                  onClick={() => {
                    setDetailModal({ show: true, item })
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setDetailModal({ show: true, item })
                    }
                  }}
                >
                  {/* 时间行 */}
                  <div className="card-time-row">
                    <Text strong className="card-time-text">
                      {dayjs(item.startTime).format('HH:mm')} -{' '}
                      {dayjs(item.endTime).format('HH:mm')}
                    </Text>
                    <Tag
                      color={(() => {
                        if (item.status === 1) return 'default'
                        if (item.status === 2) return 'processing'
                        return 'error'
                      })()}
                      className="card-status-tag"
                    >
                      <Dict code={item.status} name={'cinemaPlayState'}></Dict>
                    </Tag>
                  </div>

                  {/* 电影名称 */}
                  <Paragraph strong className="card-title" title={item.movieName}>
                    {item.movieName}
                  </Paragraph>

                  {/* 关键标签行：2D/3D、版本、规格、字幕 */}
                  <div className="card-tags-row">
                    {/* 2D/3D 放映类型（始终展示） */}
                    <Tag
                      color={
                        item.dimensionType != null &&
                        item.dimensionType !== undefined
                          ? 'purple'
                          : 'default'
                      }
                      className="card-tag-small"
                    >
                      {(() => {
                        if (
                          item.dimensionType == null &&
                          item.dimensionType !== 0
                        ) {
                          return t('table.dimensionNotSet') || '未设置'
                        }
                        const dictList =
                          commonStore.dict?.[DictCode.DIMENSION_TYPE] || []
                        const dictItem = dictList.find(
                          (d: any) =>
                            d.id === item.dimensionType ||
                            d.code === item.dimensionType
                        )
                        return (
                          dictItem?.name ?? `类型${item.dimensionType}`
                        )
                      })()}
                    </Tag>
                    {/* 版本 */}
                    {item.versionCode != null && (
                      <Tag color="blue" className="card-tag-small">
                        {(() => {
                          const dictList =
                            commonStore.dict?.[DictCode.DUBBING_VERSION] || []
                          const dictItem = dictList.find(
                            (d: any) => d.code === item.versionCode
                          )
                          return dictItem?.name || `版本${item.versionCode}`
                        })()}
                      </Tag>
                    )}
                    {/* 上映规格 */}
                    {item.specName &&
                      item.specName.split('、').map((name: string, idx: number) => (
                        <Tag key={idx} color="green" className="card-tag-small">
                          {name}
                        </Tag>
                      ))}
                    {/* 字幕 */}
                    {item.subtitle &&
                      item.subtitle.length > 0 &&
                      item.subtitle.map((sub) => (
                        <Tag color="cyan" key={sub.id} className="card-tag-small">
                          {sub.name}
                        </Tag>
                      ))}
                  </div>

                  {/* 底部信息 */}
                  <div className="card-footer">
                    {/* 开放状态 */}
                    <div className="card-footer-row">
                      <Text type="secondary" className="card-label-small">
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
                                specIds: item.specIds ?? (item.specId != null ? [item.specId] : []),
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
                    <div className="card-footer-row">
                      <Text type="secondary" className="card-label-small">
                        {t('table.seatSelectRate')}
                      </Text>
                      <div className="detail-flex-start detail-gap-4">
                        <Text className="card-label-small">
                          {item.selectedSeatCount || 0}/{item.seatCount || 0}
                        </Text>
                        <Tag
                          color={(() => {
                            if (seatRate >= 80) return 'red'
                            if (seatRate >= 50) return 'orange'
                            return 'green'
                          })()}
                          className="card-tag-small"
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
        className="screening-add-float-btn"
        icon={<PlusOutlined />}
        aria-label={t('addShowTime')}
        tooltip={t('addShowTime')}
        onClick={() => {
          const id = searchParams.get('id')
          if (id) {
            router.push(processPath({ name: 'screeningManagementRelease', query: { id } }) as string)
          } else {
            setShowTimeModal({
              data: { cinemaId: id },
              show: true
            })
          }
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
            <ul className="detail-list">
              <li className="detail-list-item">
                <span className="detail-label">
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
            <div className="detail-list-item">
              <div className="detail-list-item-sm">
                {dayjs(detailModal.item.startTime).format('HH:mm:ss')} -{' '}
                {dayjs(detailModal.item.endTime).format('HH:mm:ss')}
              </div>
              <div className="detail-flex-start">
                <Tag color="blue">
                  <Dict
                    code={detailModal.item.status}
                    name={'cinemaPlayState'}
                  ></Dict>
                </Tag>
                <Paragraph
                  strong
                  className="detail-title-strong"
                  title={detailModal.item.movieName}
                >
                  {detailModal.item.movieName}
                </Paragraph>
              </div>
            </div>
            <ul className="detail-list">
              <li className="detail-row">
                <span className="detail-text-14">{t('table.open')}：</span>
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
                        specIds: detailModal.item!.specIds ?? (detailModal.item!.specId != null ? [detailModal.item!.specId] : []),
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
              <li className="detail-row-sm">
                <span className="detail-text-14">
                  {t('table.seatSelectRate')}：
                </span>
                <span className="detail-text-14">
                  <span className="detail-label">
                    {detailModal.item.selectedSeatCount || 0} /
                    {detailModal.item.seatCount || 0}
                  </span>
                  <span className="detail-label">
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
              {detailModal.item.dimensionType != null && (
                <li className="detail-flex-center">
                  <span className="detail-label">
                    {t('table.dimension') || '放映'}：
                  </span>
                  <Tag color="purple">
                    {(() => {
                      const dictList = commonStore.dict?.[DictCode.DIMENSION_TYPE] || []
                      const dictItem = dictList.find(
                        (d: any) => d.id === detailModal.item!.dimensionType || d.code === detailModal.item!.dimensionType
                      )
                      return dictItem?.name ?? `类型${detailModal.item!.dimensionType}`
                    })()}
                  </Tag>
                </li>
              )}
              {detailModal.item.subtitle &&
                detailModal.item.subtitle.length > 0 && (
                  <li className="detail-flex-center detail-flex-start-align">
                    <span className="detail-label-shrink">
                      {t('table.subtitle') || '字幕'}：
                    </span>
                    <Space wrap size={5}>
                      {detailModal.item.subtitle.map((sub) => (
                        <Tag color="#2db7f5" key={sub.id}>
                          {sub.name}
                        </Tag>
                      ))}
                    </Space>
                  </li>
                )}
              {detailModal.item.versionCode && (
                <li className="detail-flex-center">
                  <span className="detail-label">
                    {t('table.version') || '版本'}：
                  </span>
                  <Tag color="blue">
                    {(() => {
                      const dictList = commonStore.dict?.[DictCode.DUBBING_VERSION] || []
                      const dictItem = dictList.find(
                        (d: any) => d.code === detailModal.item!.versionCode
                      )
                      return dictItem?.name || `版本${detailModal.item!.versionCode}`
                    })()}
                  </Tag>
                </li>
              )}
              {detailModal.item.specName && (
                <li className="detail-flex-spec">
                  <span className="detail-label">
                    {t('table.spec') || '上映规格'}：
                  </span>
                  {detailModal.item.specName.split('、').map((name: string, idx: number) => (
                    <Tag color="green" key={idx}>
                      {name}
                    </Tag>
                  ))}
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
