'use client'
import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/client'
import {
  Switch,
  Modal,
  Image,
  Table,
  type TableColumnsType,
  message,
  Space,
  Tag,
  Select,
  Input,
  Flex
} from 'antd'
import http from '@/api'
import { languageType, notFoundImage } from '@/config'
import { Dict } from '@/components/dict'
import { getMovieList } from '@/api/request/movie'
import page from '@/app/[lng]/dataChart/page'
import { Query, QueryItem } from '@/components/query'
import { showTotal } from '@/utils/pagination'
import { Movie } from '@/type/api'
import { CustomAntImage } from '@/components/CustomAntImage'

interface modalProps {
  show?: boolean
  data: Record<string, any>
  onConfirm?: (selectedMovie: Movie) => void
  onCancel?: () => void
}

interface Query {
  name: string
  status: number
}

export function MovieModal(props: modalProps) {
  const [data, setData] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const { t } = useTranslation(navigator.language as languageType, 'movie')
  const [query, setQuery] = useState<Partial<Query>>({})
  const { t: common } = useTranslation(
    navigator.language as languageType,
    'common'
  )
  const [selectedMovie, setSelectedMovie] = useState<any>({})

  const getData = (page = 1) => {
    getMovieList({
      page,
      pageSize: 10,
      ...query
    }).then((res) => {
      const data = res.data

      setData(data.list)
      setPage(page)
      setTotal(data.total)
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
              <section>
                {row.spec.map((item) => {
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
      title: t('table.originalName'),
      width: 200,
      dataIndex: 'originalName'
    },
    {
      title: t('table.tags'),
      width: 100,
      dataIndex: 'tags',
      render(_, row) {
        return (
          <Space direction="vertical">
            {row.tags.map((item) => {
              return <Tag key={item.id}>{item.name}</Tag>
            })}
          </Space>
        )
      }
    },
    {
      title: t('table.time'),
      dataIndex: 'time',
      width: 100,
      render(text: number) {
        if (text) {
          return (
            <span>
              {text}
              {common('unit.minute')}
            </span>
          )
        }
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
    }
  ]

  return (
    <Modal
      title={t('movieModal.title')}
      open={props.show}
      maskClosable={false}
      width={'80%'}
      style={{ top: 40 }}
      onOk={() => {
        props?.onConfirm?.(selectedMovie)
      }}
      onCancel={props?.onCancel}
    >
      <Flex vertical gap={30}>
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
            ),
            y: 'calc(100vh - 450px)'
          }}
          rowKey={'id'}
          sticky={{ offsetHeader: -20 }}
          rowSelection={{
            type: 'radio',
            onChange(selectedKeys, selectedRows) {
              console.log(selectedKeys, selectedRows)
              setSelectedMovie({
                ...selectedRows[0]
              })
            }
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
    </Modal>
  )
}
