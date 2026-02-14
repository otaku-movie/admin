'use client'

import React from 'react'
import { Form, Select, Space, DatePicker, message, Typography } from 'antd'
import dayjs from 'dayjs'
import { AppTimePicker } from '@/components/AppTimePicker'
import type { MovieShowTimeStepContext } from '../types'

interface StepThreeProps {
  ctx: MovieShowTimeStepContext
}

export function StepThree({ ctx }: StepThreeProps) {
  const {
    query,
    setQuery,
    t,
    getReReleaseData,
    getMovieVersionData,
    reReleaseData,
    movieVersionData,
    time,
    timeDisplayMode = '24h'
  } = ctx

  const baseDate = query.screeningDate ?? query.startTime?.startOf('day') ?? dayjs()

  return (
    <>
      <Form.Item
        label={t('showTimeModal.form.reRelease.label')}
        name="reReleaseId"
      >
        <Select
          allowClear
          showSearch
          style={{ width: 200 }}
          value={query.reReleaseId}
          disabled={!query.movieId}
          placeholder={t('showTimeModal.form.reRelease.placeholder')}
          onFocus={() => {
            if (query.movieId) getReReleaseData(query.movieId)
          }}
          onChange={(val) => setQuery({ ...query, reReleaseId: val })}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={reReleaseData.map((item: any) => ({
            value: item.id,
            label: `${item.name || ''} (${dayjs(item.startTime).format('YYYY-MM-DD')} - ${dayjs(item.endTime).format('YYYY-MM-DD')})`
          }))}
        />
      </Form.Item>
      <Form.Item
        label={t('showTimeModal.form.dubbingVersion.label')}
        name="movieVersionId"
      >
        <Select
          allowClear
          showSearch
          style={{ width: 300 }}
          value={query.movieVersionId}
          placeholder={t('showTimeModal.form.dubbingVersion.placeholder')}
          onFocus={() => {
            if (query.movieId) getMovieVersionData(query.movieId)
          }}
          onChange={(val) => setQuery({ ...query, movieVersionId: val })}
          disabled={!query.movieId}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={movieVersionData.map((item: any) => ({
            value: item.id,
            label: `${item.name}${item.startDate && item.endDate ? ` (${item.startDate} - ${item.endDate})` : ''}`
          }))}
        />
      </Form.Item>
      <Form.Item
        label={t('showTimeModal.form.showTime.label')}
        required
        validateStatus={
          query.startTime && query.endTime
            ? !query.startTime.isBefore(query.endTime)
              ? 'error'
              : time > 0 &&
                  query.endTime.diff(query.startTime, 'minute') < time
                ? 'error'
                : undefined
            : undefined
        }
        help={
          query.startTime && query.endTime
            ? !query.startTime.isBefore(query.endTime)
              ? t('showTimeModal.form.showTime.startAfterEnd')
              : time > 0 &&
                  query.endTime.diff(query.startTime, 'minute') < time
                ? t('showTimeModal.form.showTime.endBeforeMovieDuration')
                : undefined
            : undefined
        }
        rules={[
          {
            required: true,
            validator() {
              if (!query.screeningDate) {
                return Promise.reject(t('showTimeModal.form.showTime.required'))
              }
              if (!query.startTime) {
                return Promise.reject(t('showTimeModal.form.showTime.required'))
              }
              if (!query.endTime) {
                return Promise.reject(t('showTimeModal.form.showTime.required'))
              }
              if (query.startTime && query.endTime && !query.startTime.isBefore(query.endTime)) {
                return Promise.reject(t('showTimeModal.form.showTime.startAfterEnd'))
              }
              if (
                time > 0 &&
                query.startTime &&
                query.endTime &&
                query.endTime.diff(query.startTime, 'minute') < time
              ) {
                return Promise.reject(t('showTimeModal.form.showTime.endBeforeMovieDuration'))
              }
              return Promise.resolve()
            },
            message: t('showTimeModal.form.showTime.required')
          }
        ]}
        name={['startTime', 'endTime']}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space wrap align="center">
            <DatePicker
              value={query.screeningDate ?? query.startTime?.startOf('day')}
              format="YYYY/MM/DD"
              disabledDate={(current) =>
                current && current.isBefore(dayjs(), 'day')
              }
              onChange={(d) => {
                const date = d ?? dayjs().startOf('day')
                const wasStartNext = query.startTime && query.screeningDate && query.startTime.date() > query.screeningDate.date()
                const wasEndNext = query.endTime && query.screeningDate && query.endTime.date() > query.screeningDate.date()
                setQuery({
                  ...query,
                  screeningDate: date,
                  startTime: query.startTime
                    ? date.clone().add(wasStartNext ? 1 : 0, 'day').hour(query.startTime.hour()).minute(query.startTime.minute()).second(0).millisecond(0)
                    : undefined,
                  endTime: query.endTime
                    ? date.clone().add(wasEndNext ? 1 : 0, 'day').hour(query.endTime.hour()).minute(query.endTime.minute()).second(0).millisecond(0)
                    : undefined
                })
              }}
            />
            <span style={{ marginRight: 4 }}>～</span>
            <DatePicker
              value={query.endTime ? query.endTime.startOf('day') : query.screeningDate ?? query.startTime?.startOf('day')}
              format="YYYY/MM/DD"
              disabledDate={(current) =>
                (current && current.isBefore(dayjs(), 'day')) ||
                (current && query.screeningDate != null && current.isBefore(query.screeningDate, 'day'))
              }
              onChange={(d) => {
                const newEndDate = d ?? undefined
                setQuery((prev) => {
                  if (!newEndDate) return { ...prev, endTime: undefined }
                  const base = prev.endTime ?? (prev.startTime ? prev.startTime.add(time || 120, 'minute') : undefined)
                  if (!base) return prev
                  const nextEndTime = newEndDate.clone().hour(base.hour()).minute(base.minute()).second(0).millisecond(0)
                  return { ...prev, endTime: nextEndTime }
                })
              }}
            />
          </Space>
          <Space wrap align="center">
            <AppTimePicker
              value={query.startTime}
              mode={timeDisplayMode}
              baseDate={baseDate}
              onChange={(timeVal) => {
                setQuery({
                  ...query,
                  startTime: timeVal ?? undefined,
                  endTime: timeVal && (time > 0 || !query.endTime) ? timeVal.add(time || 120, 'minute') : query.endTime
                })
              }}
            />
            <span style={{ marginRight: 4 }}>～</span>
            <AppTimePicker
              value={query.endTime}
              mode={timeDisplayMode}
              baseDate={baseDate}
              onChange={(timeVal) => {
                if (timeVal != null && query.startTime != null && !timeVal.isAfter(query.startTime)) {
                  message.warning(t('showTimeModal.form.showTime.startAfterEnd'))
                  return
                }
                if (
                  time > 0 &&
                  timeVal != null &&
                  query.startTime != null &&
                  timeVal.diff(query.startTime, 'minute') < time
                ) {
                  message.warning(t('showTimeModal.form.showTime.endBeforeMovieDuration'))
                  return
                }
                setQuery({ ...query, endTime: timeVal ?? undefined })
              }}
            />
          </Space>
          {(query.startTime &&
              query.endTime &&
              query.endTime.isAfter(query.startTime)) ||
            time > 0 ? (
              <>
                {query.startTime &&
                  query.endTime &&
                  query.endTime.isAfter(query.startTime) && (
                    <Typography.Text type="secondary" style={{ display: 'block' }}>
                      {(t as (key: string, opts?: Record<string, number>) => string)(
                        'releasePage.currentDuration',
                        {
                          hours: Math.floor(query.endTime.diff(query.startTime, 'minute') / 60),
                          minutes: query.endTime.diff(query.startTime, 'minute') % 60
                        }
                      )}
                    </Typography.Text>
                  )}
                {time > 0 && (
                  <Typography.Text type="secondary" style={{ display: 'block' }}>
                    {(t as (key: string, opts?: Record<string, number>) => string)(
                      'releasePage.movieDurationLabel',
                      {
                        hours: Math.floor(time / 60),
                        minutes: time % 60
                      }
                    )}
                  </Typography.Text>
                )}
              </>
            ) : null}
        </Space>
      </Form.Item>
    </>
  )
}
