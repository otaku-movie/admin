'use client'
import React, { useState, useEffect } from 'react'
import { PageProps } from '@/app/[lng]/layout'
import { useTranslation } from '@/app/i18n/client'
import { Form, Modal, Input, Select, Space, DatePicker, TimePicker } from 'antd'
import http from '@/api'
import { languageType } from '@/config'

interface MovieShowTimeModalProps {
  type: 'create' | 'edit'
  show?: boolean
  onConfirm?: () => void
  onCancel?: () => void
}

export default function MovieShowTimeModal(props: MovieShowTimeModalProps) {
  const { t } = useTranslation(navigator.language as languageType, 'showTime')
  const [movieData, setMovieData] = useState([])
  const [cinemaData, setCinemaData] = useState([])
  const [theaterHallData, setTheaterHallData] = useState([])

  const onFinish = (values) => {
    console.log('Success:', values)
  }

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo)
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
      setMovieData(res.data?.list)
    })
  }
  const getTheaterHallData = () => {
    http({
      url: 'theater/hall/list',
      method: 'post',
      data: {
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
      getTheaterHallData()
    })
  }

  useEffect(() => {
    if (props.show) {
      getMovieData()
      getCinemaData()
    }
  }, [props.show])

  return (
    <Modal
      title={
        props.type === 'edit'
          ? t('showTimeModal.title.edit')
          : t('showTimeModal.title.create')
      }
      width={700}
      open={props.show}
      onOk={props?.onConfirm}
      onCancel={props?.onCancel}
    >
      <Form
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        initialValues={{ remember: true }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item
          label={t('showTimeModal.form.movie.label')}
          name="username"
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <Select showSearch onChange={() => {}} onSearch={getMovieData}>
            {movieData.map((item: any) => {
              return (
                <Select.Option value={item.id} key={item.id}>
                  {item.name}
                </Select.Option>
              )
            })}
          </Select>
        </Form.Item>
        <Form.Item
          label={t('showTimeModal.form.theaterHall.label')}
          name="username"
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <Space>
            <Select
              showSearch
              style={{ width: 250 }}
              onChange={() => {}}
              onSearch={getCinemaData}
            >
              {cinemaData.map((item: any) => {
                return (
                  <Select.Option value={item.id} key={item.id}>
                    {item.name}
                  </Select.Option>
                )
              })}
            </Select>
            <Select style={{ width: 200 }}>
              {theaterHallData.map((item: any) => {
                return (
                  <Select.Option value={item.id} key={item.id}>
                    {item.name}
                  </Select.Option>
                )
              })}
            </Select>
          </Space>
        </Form.Item>

        <Form.Item
          label={t('showTimeModal.form.startTime.label')}
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <DatePicker showTime needConfirm onChange={() => {}} />
        </Form.Item>
        <Form.Item
          label={t('showTimeModal.form.endTime.label')}
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <DatePicker showTime needConfirm onChange={() => {}} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
