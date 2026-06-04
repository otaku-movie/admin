'use client'
import React, { useState, useEffect, useCallback } from 'react'
import {
  Switch,
  Tag,
  Button,
  FloatButton,
  Space,
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
  CalendarOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '@/app/[lng]/layout'
import { processPath } from '@/config/router'
import http from '@/api'
import { Dict } from '@/components/dict'
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
import GanttView from './ganttView'

const { Paragraph } = Typography

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
  // 影院名称：由 cinemaList 跳转时通过 query 带入，用于页面标题展示
  const cinemaName = searchParams.get('name') ?? ''

  // 场次右键菜单：编辑 / 删除
  const buildMenuItems = useCallback(
    (item: MovieShowTimeItem) => {
      const onClick: MenuProps['onClick'] = ({ key }) => {
        const remove = () => {
          return new Promise((resolve, reject) => {
            http({
              url: 'admin/movie_show_time/remove',
              method: 'delete',
              params: { id: item.id }
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
          case 'edit': {
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
            break
          }
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
        { label: common('button.edit'), key: 'edit' },
        { label: common('button.remove'), danger: true, key: 'remove' }
      ]

      return { items, onClick }
    },
    [searchParams, router, common, t, showTimeModal]
  )

  const i18nWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ]

  const sortScreenings = (list: CinemaScreeing[]) => {
    return [...list]
      .map((item) => ({
        ...item,
        children: [...item.children].sort((a, b) =>
          dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf()
        )
      }))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: 'base'
        })
      )
  }

  // 甘特按「营业日（30h）」展示：传 use30HourFormat=true，后端会把当天 <6:00 的早场归到
  // 前一天、并把次日 <6:00 的早场作为午夜尾巴并入，返回干净的营业日数据（详见后端 screening）。
  function getData() {
    getCinemaScreeningList({
      id: searchParams.get('id') as string,
      date: day.format('YYYY-MM-DD'),
      use30HourFormat: true
    }).then((res) => {
      const sortedData = sortScreenings(res.data as unknown as CinemaScreeing[])
      setData(sortedData)
      setRenderData(sortedData)
    })
  }

  useEffect(() => {
    getData()
  }, [day])

  return (
    <section className="screening-page" aria-label={t('pageTitle')} title={t('pageTitle')}>
      <div className="screening-header">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
        >
          {t('back')}
        </Button>
        {cinemaName && (
          <Paragraph strong className="screening-cinema-name" title={cinemaName}>
            {cinemaName}
          </Paragraph>
        )}
      </div>
      <section className="todo-top">
        <div className="screening-toolbar">
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
        </div>
      </section>

      <div className="scroll-wrapper">
        <GanttView
          date={day}
          data={renderData}
          onItemClick={(item) => setDetailModal({ show: true, item })}
          buildMenuItems={buildMenuItems}
          emptyText={t('emptyShowtime')}
          hallColumnTitle={t('theaterColumn')}
          closedLabel={t('closedTag')}
        />
      </div>
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
