'use client'
import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  message,
  Form,
  Flex
} from 'antd'

import type { TableColumnsType } from 'antd'
import { notFoundImage } from '@/config/index'

import { Query, QueryItem } from '@/components/query'
import http from '@/api/index'
import { Cinema, theaterHall } from '@/type/api'
import { useTranslation } from '@/app/i18n/client'
import { showTotal } from '@/utils/pagination'
import { CheckPermission } from '@/components/checkPermission'
import { DictSelect } from '@/components/DictSelect'
import { DictCode } from '@/enum/dict'
import { Dict } from '@/components/dict'
import { OrderState } from '@/config/enum'
import { RangePicker, dateValue } from '@/components/rangePicker'
import { CustomAntImage } from '@/components/CustomAntImage'
import { PageProps } from '@/app/[lng]/page'

interface Query {
  id: number
  movieId: number
  cinemaId: number
  theaterHallId: number
  orderState: number
  payState: number
  orderTime: any[]
}

export default function Page({ params: { lng } }: PageProps) {
  // const router = useRouter()

  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState<Partial<Query>>({})
  const { t } = useTranslation(lng, 'order')
  const { t: common } = useTranslation(lng, 'common')

  const getData = (page = 1) => {}

  useEffect(() => {
    getData()
  }, [])

  const columns: TableColumnsType = []

  return (
    <section>
      <Flex vertical gap={30}>
        <Query
          model={query}
          onSearch={() => {
            console.log(query)
          }}
          onClear={(obj) => {
            setQuery({ ...obj })
          }}
        >
          <QueryItem label={t('search.id')}>
            <Input
              value={query.id}
              allowClear
              onChange={(e) => {
                setQuery({
                  ...query,
                  id: e.target.value as any
                })
              }}
            ></Input>
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
    </section>
  )
}
