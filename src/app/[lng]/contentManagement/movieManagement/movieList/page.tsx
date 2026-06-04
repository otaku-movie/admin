'use client'
import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Row,
  Input,
  Tag,
  Select,
  Modal,
  message,
  Flex
} from 'antd'

import type { TableColumnsType, TablePaginationConfig } from 'antd'
import type { SorterResult } from 'antd/es/table/interface'
import type { MovieListSortField } from '@/type/query/movie'
import { status, notFoundImage } from '@/config/index'
import { useRouter } from '@bprogress/next/app'

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
import { CustomAntImage } from '@/components/CustomAntImage'
import { DictSelect } from '@/components/DictSelect'
import { DictCode } from '@/enum/dict'

interface Query {
  name: string
  status: number
}

interface SortState {
  field?: MovieListSortField
  order?: 'asc' | 'desc'
}

export default function Page({ params: { lng } }: Readonly<PageProps>) {
  const router = useRouter()
  const [data, setData] = useState<Movie[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState<Partial<Query>>({})
  const [sort, setSort] = useState<SortState>({})
  const { t } = useTranslation(lng, 'movie')
  const { t: common } = useTranslation(lng, 'common')

  // 添加配音版模态框状态
  const [addDubbingModal, setAddDubbingModal] = useState<{
    show: boolean
    movieId?: number
    selectedVersion?: number
  }>({
    show: false
  })

  const getData = (page = 1, nextSort: SortState = sort) => {
    getMovieList({
      page,
      pageSize: 10,
      ...query,
      sortField: nextSort.field,
      sortOrder: nextSort.order
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
    // 7 个可排序列：sorter: true 把排序交给后端，sortOrder 受控
    // 一次只激活当前 sort.field 对应列的箭头，切换列时旧列自动清掉。
    ...((): TableColumnsType<Movie> => {
      const buildSortOrder = (field: MovieListSortField) =>
        sort.field === field
          ? sort.order === 'asc'
            ? ('ascend' as const)
            : ('descend' as const)
          : undefined
      const sortable: Array<{
        field: MovieListSortField
        titleKey: string
      }> = [
        { field: 'cinemaCount', titleKey: 'table.cinemaCount' },
        { field: 'theaterCount', titleKey: 'table.theaterCount' },
        { field: 'commentCount', titleKey: 'table.commentCount' },
        { field: 'watchedCount', titleKey: 'table.watchedCount' },
        { field: 'wantToSeeCount', titleKey: 'table.wantToSeeCount' },
        { field: 'startDate', titleKey: 'table.startDate' },
        { field: 'endDate', titleKey: 'table.endDate' }
      ]
      return sortable.map(({ field, titleKey }) => ({
        title: t(titleKey),
        width: 150,
        dataIndex: field,
        sorter: true,
        sortOrder: buildSortOrder(field)
      }))
    })(),
    {
      title: t('table.dubbingVersion'),
      width: 150,
      dataIndex: 'versionCode',
      render(code: number) {
        if (code) {
          return <Dict code={code} name={'dubbingVersion'}></Dict>
        }
        return '--'
      }
    },
    {
      title: t('table.status'),
      width: 150,
      dataIndex: '',
      render(_, row) {
        return <Dict code={row.status} name={'releaseStatus'}></Dict>
      }
    },
    {
      title: t('table.helloMovie'),
      width: 250,
      dataIndex: 'helloMovie',
      render(_, row) {
        return (
          <Space direction="vertical">
            {row.helloMovie.map((item) => {
              return (
                <div key={item.code}>
                  <Dict
                    code={item.code}
                    name="helloMovie"
                    key={item.code}
                    style={{ marginRight: '10px' }}
                  ></Dict>
                  <span>{item.date}</span>
                </div>
              )
            })}
          </Space>
        )
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
            <CheckPermission code="movie.save">
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
            </CheckPermission>

            <CheckPermission code="movie.remove">
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
                          url: 'movie/remove',
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
            </CheckPermission>
            <Button
              onClick={() => {
                router.push(
                  processPath('benefitList', {
                    id: row.id
                  })
                )
              }}
            >
              {common('button.benefitList')}
            </Button>
            <Button
              type="primary"
              onClick={() => {
                router.push(
                  processPath('commentList', {
                    id: row.id
                  })
                )
              }}
            >
              {common('button.commentList')}
            </Button>
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
                router.push(processPath(`movieDetail`))
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
          // 翻页 + 排序统一走 Table.onChange，避免 pagination.onChange 二次触发拉数据。
          // 排序变化时回到第 1 页，翻页时保留当前排序。
          onChange={(pagination: TablePaginationConfig, _filters, sorter) => {
            const s = Array.isArray(sorter) ? sorter[0] : sorter
            const single = s as SorterResult<Movie>
            const field = (single?.field ??
              single?.columnKey) as MovieListSortField | undefined
            const order: 'asc' | 'desc' | undefined =
              single?.order === 'ascend'
                ? 'asc'
                : single?.order === 'descend'
                  ? 'desc'
                  : undefined
            const nextSort: SortState =
              field && order ? { field, order } : {}
            const sortChanged =
              nextSort.field !== sort.field || nextSort.order !== sort.order
            const nextPage = sortChanged ? 1 : pagination.current ?? 1
            if (sortChanged) setSort(nextSort)
            getData(nextPage, nextSort)
          }}
          pagination={{
            pageSize: 10,
            current: page,
            total,
            showTotal,
            position: ['bottomCenter']
          }}
        />
      </Flex>

      {/* 添加配音版模态框 */}
      <Modal
        title={t('modal.addDubbingVersion.title')}
        open={addDubbingModal.show}
        onOk={() => {
          if (!addDubbingModal.selectedVersion) {
            message.warning(t('modal.addDubbingVersion.selectVersion'))
            return
          }
          // 跳转到电影详情页面，传递原电影ID和配音版本ID
          router.push(
            processPath('movieDetail', {
              id: addDubbingModal.movieId,
              versionCode: addDubbingModal.selectedVersion
            })
          )
        }}
        onCancel={() => {
          setAddDubbingModal({
            show: false,
            movieId: undefined,
            selectedVersion: undefined
          })
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>
              {t('modal.addDubbingVersion.selectVersion')}
            </label>
            <DictSelect
              code={DictCode.DUBBING_VERSION}
              value={addDubbingModal.selectedVersion}
              style={{ width: '100%' }}
              onChange={(val) => {
                setAddDubbingModal({
                  ...addDubbingModal,
                  selectedVersion: val
                })
              }}
            />
          </div>
        </Space>
      </Modal>
    </section>
  )
}
