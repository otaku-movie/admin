'use client'
import React, { useState, useEffect, useRef } from 'react'
import {
  Switch,
  Tag,
  Dropdown,
  Button,
  FloatButton,
  Space,
  message,
  Row,
  MenuProps
} from 'antd'
import { useRouter, useSearchParams } from 'next/navigation'
import { PlusOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '@/app/[lng]/layout'
import http from '@/api'
import { Query, QueryItem } from '@/components/query'
import { processPath } from '@/config/router'
import { CheckPermission } from '@/components/checkPermission'
import { Dict } from '@/components/dict'

import { TodoList } from '@/components/TodoList/todoList'
import './style.scss'
import MovieShowTimeModal from '@/dialog/movieShowTimeModal'
import { CinemaScreeing, getCinemaScreeningList } from '@/api/request/cinema'
import dayjs from 'dayjs'

export default function CinemaPage({ params: { lng } }: PageProps) {
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
  const router = useRouter()
  const [day, setDay] = useState(dayjs())
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
        <ul className="nav-container">
          <li
            onClick={() => {
              setDay(day.subtract(1, 'day'))
            }}
          >
            <LeftOutlined />
          </li>
          <li>
            {day.format('YYYY-MM-DD')}（{common(`week.${i18nWeek[day.day()]}`)}
            ）
          </li>
          <li
            onClick={() => {
              setDay(day.add(1, 'day'))
            }}
          >
            <RightOutlined />
          </li>
        </ul>
        <ul
          className="table-header"
          style={{
            gridTemplateColumns: `40px repeat(${data.length}, 1fr) 40px`
          }}
        >
          <li></li>
          {data.map((item) => {
            return <li key={item.id}>{item.name}</li>
          })}
          <li></li>
        </ul>
      </section>

      <TodoList
        data={data}
        render={(item) => {
          const onClick: MenuProps['onClick'] = ({ key }) => {
            message.info(`Click on item ${key}`)
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

          return (
            <Dropdown
              menu={{ items, onClick }}
              key={item.id}
              trigger={['contextMenu']}
            >
              <div>
                <div>
                  <Tag color="blue">
                    <Dict code={item.status} name={'cinemaPlayState'}></Dict>
                  </Tag>
                  <span className="movie-title">{item.movieName}</span>
                </div>

                <ul>
                  <li>
                  <span>{t('table.open')}：</span>
                    <Switch
                      size="small"
                      value={item.open}
                      onChange={(val) => {}}
                    />
                  </li>
                  <li>
                    <span>{t('table.seatSelectRate')}：</span>
                    <span>
                      {item.seatCount}/{item.selectedSeatCount}{' '}
                      {item.selectedSeatCount || 0 / item.seatCount || 0}%
                    </span>
                  </li>
                  <li>
                    <Space wrap size={5}>
                      <Tag color="#2db7f5">字幕</Tag>
                      <Tag color="#2db7f5">最速上映</Tag>
                      <Tag color="#2db7f5">舞台挨拶</Tag>
                    </Space>
                  </li>
                </ul>
              </div>
            </Dropdown>
          )
        }}
      ></TodoList>
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
