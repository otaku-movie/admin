'use client'

/**
 * 发布场次 - 第一步：基础放映信息
 * 包含影片、放映/结束日期、配音版本、放映规格、字幕、影厅、2D/3D、开始/结束时间及时长展示
 */
import React from 'react'
import { Form, Input, Button, DatePicker, Select, Row, Col, Space, Typography, message, Switch } from 'antd'
import { VideoCameraOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import { AppTimePicker, type TimeDisplayMode } from '@/components/AppTimePicker'
import type { ReleaseFormState } from '../types'
import { DictSelect } from '@/components/DictSelect'
import { DictCode } from '@/enum/dict'

const { Title, Paragraph } = Typography

interface Step1BasicProps {
  form: ReleaseFormState
  setForm: React.Dispatch<React.SetStateAction<ReleaseFormState>>
  t: (key: string) => string
  common: (key: string) => string
  movieData: { id: number; name: string }[]
  theaterHallData: { id: number; name: string; cinemaSpecName?: string }[]
  movieVersionData: { id: number; name: string; startDate?: string; endDate?: string }[]
  specList: { id: number; name: string; cinemaSpecName?: string }[]
  languageData: { id: number; name: string }[]
  showTimeTagData: { id: number; name: string }[]
  movieDuration: number
  /** 24h 或 30h（30h：当日 6:00～次日 5:59 显示为 6～29） */
  timeDisplayMode?: TimeDisplayMode
  /** 放映日，30h 时用于当日/次日区分 */
  baseDate?: Dayjs
  onSelectMovie: () => void
  getMovieVersionData: (movieId?: number) => void
  getLanguageData: () => void
  getShowTimeTagData: () => void
}

export function Step1Basic({
  form,
  setForm,
  t,
  common,
  movieData,
  theaterHallData,
  movieVersionData,
  specList,
  languageData,
  showTimeTagData,
  movieDuration,
  timeDisplayMode = '24h',
  baseDate,
  onSelectMovie,
  getMovieVersionData,
  getLanguageData,
  getShowTimeTagData
}: Step1BasicProps) {
  const movieName =
    form.movieId != null
      ? movieData.find((m) => m.id === form.movieId)?.name ?? form.movieName ?? ''
      : form.movieName ?? ''

  return (
    <>
      {/* 步骤标题与说明；右上角：是否公开 */}
      <div style={{ marginBottom: 24 }}>
        <Space align="center" size={8} style={{ marginBottom: 8 }}>
          <VideoCameraOutlined style={{ color: 'var(--ant-color-primary)', fontSize: 18 }} />
          <span style={{ color: 'var(--ant-color-primary)', fontWeight: 600 }}>STEP 1</span>
        </Space>
        <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
          {t('releasePage.step1.title')}
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {t('releasePage.step1.instruction')}
        </Paragraph>
      </div>
      {/* 第一行：电影 | 影厅 */}
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            label={t('showTimeModal.form.movie.label')}
            required
            rules={[{ required: true, message: t('showTimeModal.form.movie.required') }]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Input
                readOnly
                value={movieName}
                placeholder={t('showTimeModal.form.movie.placeholder')}
                style={{ flex: 1 }}
              />
              <Button type="primary" onClick={onSelectMovie}>
                {common('button.select')}
              </Button>
            </Space.Compact>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('showTimeModal.form.theaterHall.label')}
            required
            rules={[{ required: true, message: t('showTimeModal.form.theaterHall.required') }]}
          >
            <Select
              placeholder={t('showTimeModal.form.theaterHall.required')}
              value={form.theaterHallId}
              onChange={(v) => setForm((prev) => ({ ...prev, theaterHallId: v }))}
              options={theaterHallData.map((h) => ({
                value: h.id,
                label: `${h.name}${h.cinemaSpecName ? ` (${h.cinemaSpecName})` : ''}`
              }))}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>
      </Row>
      {/* 开始日期 + 开始时间 一行 */}
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item
            label={t('releasePage.screeningDate')}
            required
            rules={[{ required: true, message: t('showTimeModal.form.showTime.required') }]}
          >
            <DatePicker
              value={form.screeningDate}
              onChange={(d) => {
                const newDate = d ?? undefined
                setForm((prev) => {
                  const next = { ...prev, screeningDate: newDate }
                  if (!newDate || !prev.startTime) return next
                  const wasStartNext = prev.screeningDate && prev.startTime.date() > prev.screeningDate.date()
                  next.startTime = newDate.clone().add(wasStartNext ? 1 : 0, 'day').hour(prev.startTime.hour()).minute(prev.startTime.minute()).second(0).millisecond(0)
                  if (prev.endTime) {
                    const wasEndNext = prev.screeningDate && prev.endTime.date() > prev.screeningDate.date()
                    next.endTime = newDate.clone().add(wasEndNext ? 1 : 0, 'day').hour(prev.endTime.hour()).minute(prev.endTime.minute()).second(0).millisecond(0)
                  }
                  return next
                })
              }}
              style={{ width: '100%' }}
              format="YYYY/MM/DD"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('releasePage.startTime')}
            required
            rules={[{ required: true, message: t('showTimeModal.form.showTime.required') }]}
          >
            <AppTimePicker
              value={form.startTime}
              mode={timeDisplayMode}
              baseDate={baseDate}
              onChange={(timeVal) => {
                setForm((prev) => {
                  const next = { ...prev, startTime: timeVal ?? undefined }
                  if (timeVal && (movieDuration > 0 || !prev.endTime)) {
                    next.endTime = timeVal.add(movieDuration || 120, 'minute')
                  }
                  return next
                })
              }}
            />
          </Form.Item>
        </Col>
      </Row>
      {/* 结束日期 + 结束时间 一行 */}
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item label={t('releasePage.endDate')} required>
            <DatePicker
              value={form.endTime ? form.endTime.startOf('day') : form.screeningDate ?? undefined}
              disabledDate={(current) =>
                current && form.screeningDate != null && current.isBefore(form.screeningDate, 'day')
              }
              onChange={(d) => {
                const newEndDate = d ?? undefined
                setForm((prev) => {
                  if (!newEndDate) return { ...prev, endTime: undefined }
                  const base = prev.endTime ?? (prev.startTime ? prev.startTime.add(movieDuration || 120, 'minute') : undefined)
                  if (!base) return { ...prev }
                  const nextEndTime = newEndDate.clone().hour(base.hour()).minute(base.minute()).second(0).millisecond(0)
                  return { ...prev, endTime: nextEndTime }
                })
              }}
              style={{ width: '100%' }}
              format="YYYY/MM/DD"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('releasePage.endTime')}
            required
            validateStatus={
              form.startTime && form.endTime
                ? !form.endTime.isAfter(form.startTime)
                  ? 'error'
                  : movieDuration > 0 &&
                      form.endTime.diff(form.startTime, 'minute') < movieDuration
                    ? 'error'
                    : undefined
                : undefined
            }
            help={
              form.startTime && form.endTime
                ? !form.endTime.isAfter(form.startTime)
                  ? t('showTimeModal.form.showTime.startAfterEnd')
                  : movieDuration > 0 &&
                      form.endTime.diff(form.startTime, 'minute') < movieDuration
                    ? t('showTimeModal.form.showTime.endBeforeMovieDuration')
                    : undefined
                : undefined
            }
          >
            <AppTimePicker
              value={form.endTime}
              mode={timeDisplayMode}
              baseDate={baseDate}
              onChange={(timeVal) => {
                if (timeVal != null && form.startTime != null && !timeVal.isAfter(form.startTime)) {
                  message.warning(t('showTimeModal.form.showTime.startAfterEnd'))
                  return
                }
                if (
                  timeVal != null &&
                  form.startTime != null &&
                  movieDuration > 0 &&
                  timeVal.diff(form.startTime, 'minute') < movieDuration
                ) {
                  message.warning(t('showTimeModal.form.showTime.endBeforeMovieDuration'))
                  return
                }
                setForm((prev) => ({ ...prev, endTime: timeVal ?? undefined }))
              }}
            />
          </Form.Item>
          {(form.startTime && form.endTime && form.endTime.isAfter(form.startTime)) || movieDuration > 0 ? (
            <div style={{ marginTop: -16, marginBottom: 16 }}>
              {form.startTime && form.endTime && form.endTime.isAfter(form.startTime) && (
                <Typography.Text type="secondary" style={{ display: 'block' }}>
                  {(t as (key: string, opts?: Record<string, number>) => string)(
                    'releasePage.currentDuration',
                    {
                      hours: Math.floor(form.endTime.diff(form.startTime, 'minute') / 60),
                      minutes: form.endTime.diff(form.startTime, 'minute') % 60
                    }
                  )}
                </Typography.Text>
              )}
              {movieDuration > 0 && (
                <Typography.Text type="secondary" style={{ display: 'block' }}>
                  {(t as (key: string, opts?: Record<string, number>) => string)(
                    'releasePage.movieDurationLabel',
                    {
                      hours: Math.floor(movieDuration / 60),
                      minutes: movieDuration % 60
                    }
                  )}
                </Typography.Text>
              )}
            </div>
          ) : null}
        </Col>
      </Row>
      {/* 上映规格 | 2D/3D 一行 */}
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item label={t('showTimeModal.form.spec.label')}>
            <Select
              mode="multiple"
              value={form.specIds}
              onChange={(v) => setForm((prev) => ({ ...prev, specIds: v ?? [] }))}
              options={specList.map((item: any) => ({
                value: item.id,
                label: item.cinemaSpecName ? `${item.name}（${item.cinemaSpecName}）` : item.name
              }))}
              placeholder={t('showTimeModal.form.spec.required')}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('showTimeModal.form.dimension.label')}
            required
            rules={[{ required: true, message: t('showTimeModal.form.dimension.required') }]}
          >
            <DictSelect
              code={DictCode.DIMENSION_TYPE}
              value={form.dimensionType}
              onChange={(v) => setForm((prev) => ({ ...prev, dimensionType: v }))}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
      </Row>
      {/* 配音版本 | 字幕 一行 */}
      <Row gutter={24}>
        <Col span={12}>
          <Form.Item label={t('showTimeModal.form.dubbingVersion.label')}>
            <Select
              allowClear
              value={form.movieVersionId}
              onFocus={() => getMovieVersionData(form.movieId)}
              onChange={(v) => setForm((prev) => ({ ...prev, movieVersionId: v }))}
              options={movieVersionData.map((item: any) => ({
                value: item.id,
                label: `${item.name}${item.startDate && item.endDate ? ` (${item.startDate} - ${item.endDate})` : ''}`.trim()
              }))}
              placeholder={t('showTimeModal.form.dubbingVersion.placeholder')}
              style={{ width: '100%' }}
              disabled={!form.movieId}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label={t('showTimeModal.form.subtitle.label')} name="subtitleId">
            <Select
              mode="multiple"
              value={form.subtitleId}
              onFocus={getLanguageData}
              onChange={(v) => setForm((prev) => ({ ...prev, subtitleId: v }))}
              options={languageData.map((item) => ({ value: item.id, label: item.name }))}
              placeholder={t('showTimeModal.form.subtitle.label')}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>
      </Row>
      {/* 场次标签 */}
      <Row gutter={24}>
        <Col span={24}>
          <Form.Item label={t('showTimeModal.form.showTimeTag.label')}>
            <Select
              mode="multiple"
              value={form.showTimeTagId}
              onFocus={getShowTimeTagData}
              onChange={(v) => setForm((prev) => ({ ...prev, showTimeTagId: v ?? [] }))}
              options={showTimeTagData.map((item) => ({ value: item.id, label: item.name }))}
              placeholder={t('showTimeModal.form.showTimeTag.required')}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  )
}
