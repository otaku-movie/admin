'use client'
import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Row,
  Input,
  Image,
  Tag,
  Select,
  Modal,
  message,
  Flex
} from 'antd'

import type { TableColumnsType } from 'antd'
import { status, notFoundImage } from '@/config/index'
import { useRouter } from 'next/navigation'

import { Query, QueryItem } from '@/components/query'
import http from '@/api/index'
import { Movie } from '@/type/api'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../../layout'
import { Dict } from '@/components/dict'
import { processPath } from '@/config/router'
import { CheckPermission } from '@/components/checkPermission'
import { showTotal } from '@/utils/pagination'
import { getMovieList } from '@/api/request/movie'
import { ReReleaseModal } from '@/dialog/reReleaseModal'
import { CustomAntImage } from '@/components/CustomAntImage'

interface Query {
  name: string
  status: number
}

export default function Page({ params: { lng } }: PageProps) {
  const router = useRouter()
  const [data, setData] = useState<Movie[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState<Partial<Query>>({})
  const { t } = useTranslation(lng, 'movie')
  const { t: common } = useTranslation(lng, 'common')
  const [modal, setModal] = useState({
    show: false,
    data: {}
  })

  const getData = (page = 1) => {
    http({
      url: '/movie/reRelease/list',
      method: 'post',
      data: {
        page,
        pageSize: 10,
        ...query
      }
    }).then((res) => {
      setData(res.data?.list ?? [])
      setPage(page)
      setTotal(res.data.total)
    })
  }

  useEffect(() => {
    getData()
  }, [])

  const columns: TableColumnsType<Movie> = [
    {
      title: t('table.name'),
      dataIndex: 'name',
      width: 350,
      fixed: 'left',
      render(_: any, row) {
        return (
          <Space
            align="start"
            style={{
              position: 'relative'
            }}
          >
            <CustomAntImage
              width={120}
              src={row.cover}
              alt="poster"
              fallback={notFoundImage}
              placeholder={true}
              style={{
                borderRadius: ' 4px',
                objectFit: 'cover'
              }}
            ></CustomAntImage>
            <Tag
              style={{
                position: 'absolute',
                top: '0',
                left: '0'
              }}
              color="green"
            >
              {row.levelName}
            </Tag>
            <Space direction="vertical">
              <span>{row.name}</span>
            </Space>
          </Space>
        )
      }
    },
    {
      title: t('table.startDate'),
      width: 150,
      dataIndex: 'startDate'
    },
    {
      title: t('table.endDate'),
      width: 150,
      dataIndex: 'endDate'
    },
    // {
    //   title: t('table.status'),
    //   width: 150,
    //   dataIndex: '',
    //   render(_, row) {
    //     return <Dict code={row.status} name={'releaseStatus'}></Dict>
    //   }
    // },
    {
      title: t('table.action'),
      key: 'operation',
      fixed: 'right',
      width: 150,
      render: (_, row) => {
        return (
          <Space align="center">
            {/* <CheckPermission code="movie.save">
              <Button
                type="primary"
                onClick={() => {
                  router.push(
                    processPath('movieDetail', {
                      id: row.id
                    })
                  )
                }}
              >
                {common('button.edit')}
              </Button>
            </CheckPermission> */}

            {/* <CheckPermission code="movie.remove"> */}
            <Button
              type="primary"
              danger
              onClick={() => {
                Modal.confirm({
                  title: common('button.remove'),
                  content: t('message.remove.content'),
                  onCancel() {
                    console.log('Cancel')
                  },
                  onOk() {
                    return new Promise((resolve, reject) => {
                      http({
                        url: 'movie/reRelease/remove',
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
                })
              }}
            >
              {common('button.remove')}
            </Button>
            {/* </CheckPermission> */}
          </Space>
        )
      }
    }
  ]

  return (
    <section>
      <Flex vertical gap={30}>
        <Row justify="end">
          <CheckPermission code="movie.save">
            <Button
              onClick={() => {
                setModal({
                  show: true,
                  data: {}
                })
              }}
            >
              {common('button.add')}
            </Button>
          </CheckPermission>
        </Row>
        <Query
          model={query}
          initialValues={{}}
          onSearch={() => {
            console.log(query)
            getData()
          }}
          onClear={(obj) => {
            setQuery(obj)
          }}
        >
          <QueryItem label={t('table.name')}>
            <Input
              value={query.name}
              allowClear
              onChange={(e) => {
                query.name = e.target.value
                setQuery(query)
              }}
            ></Input>
          </QueryItem>
          <QueryItem label={t('table.status')}>
            <Select
              value={query.status}
              allowClear
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
          scroll={{
            x: columns.reduce(
              (total, current) => total + (current.width as number),
              0
            )
          }}
          sticky={{ offsetHeader: -20 }}
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
      <ReReleaseModal
        show={modal.show}
        data={modal.data}
        onCancel={() => {
          setModal({
            ...modal,
            show: false
          })
        }}
        onConfirm={() => {
          setModal({
            ...modal,
            show: false
          })
          getData()
        }}
        type={'create'}
      ></ReReleaseModal>
    </section>
  )
}
