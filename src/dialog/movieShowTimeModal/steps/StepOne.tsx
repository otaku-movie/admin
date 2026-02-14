'use client'

import React from 'react'
import { Form, Select, Space, Input, Button } from 'antd'
import { DictSelect } from '@/components/DictSelect'
import { DictCode } from '@/enum/dict'
import type { MovieShowTimeStepContext } from '../types'

interface StepOneProps {
  ctx: MovieShowTimeStepContext
}

export function StepOne({ ctx }: StepOneProps) {
  const {
    query,
    setQuery,
    form,
    t,
    common,
    fromScreeningManagement,
    movieData,
    languageData,
    showTimeTagData,
    cinemaData,
    theaterHallData,
    specList,
    getMovieData,
    getLanguageData,
    getShowTimeTagData,
    getTheaterHallData,
    getCinemaSpec,
    getCinemaData,
    getPromotionListForCinema,
    setMovieModal
  } = ctx

  return (
    <>
      <Form.Item
        label={t('showTimeModal.form.movie.label')}
        rules={[
          {
            required: true,
            message: t('showTimeModal.form.movie.required'),
            validator() {
              if (!query.movieId) {
                return Promise.reject(
                  new Error(t('showTimeModal.form.movie.required'))
                )
              }
              return Promise.resolve()
            }
          }
        ]}
        name="movieId"
      >
        <Space>
          <Input
            value={movieData.find((item: any) => item.id === query.movieId)?.name || ''}
            readOnly
            placeholder={t('showTimeModal.form.movie.placeholder')}
            style={{ width: 200 }}
          />
          <Button type="primary" onClick={() => setMovieModal({ show: true })}>
            {common('button.select')}
          </Button>
        </Space>
      </Form.Item>
      <Form.Item label={t('showTimeModal.form.subtitle.label')} name="subtitleId">
        <Select
          showSearch
          value={query.subtitleId}
          mode="multiple"
          onFocus={() => getLanguageData()}
          onChange={(val) => setQuery({ ...query, subtitleId: val })}
          onSearch={getMovieData}
        >
          {languageData.map((item: any) => (
            <Select.Option value={item.id} key={item.id}>
              {item.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item
        label={t('showTimeModal.form.showTimeTag.label')}
        name="movieShowTimeTagId"
      >
        <Select
          showSearch
          mode="multiple"
          value={query.movieShowTimeTagId}
          onFocus={() => getShowTimeTagData()}
          onChange={(val) => setQuery({ ...query, movieShowTimeTagId: val })}
          onSearch={getShowTimeTagData}
        >
          {showTimeTagData.map((item: any) => (
            <Select.Option value={item.id} key={item.id}>
              {item.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item
        label={t('showTimeModal.form.theaterHall.label')}
        required
        name={['cinemaId', 'theaterHallId']}
        rules={[
          {
            async validator() {
              if (!query.cinemaId) {
                return Promise.reject(
                  new Error(t('showTimeModal.form.cinema.required'))
                )
              }
              if (!query.theaterHallId) {
                return Promise.reject(
                  new Error(t('showTimeModal.form.theaterHall.required'))
                )
              }
              return Promise.resolve()
            },
            validateTrigger: ['onBlur', 'onChange']
          }
        ]}
      >
        <Space>
          {!fromScreeningManagement ? (
            <Select
              showSearch
              style={{ width: 250 }}
              onChange={(val) => {
                getTheaterHallData(val)
                getCinemaSpec(val)
                getPromotionListForCinema(val)
                setQuery({
                  ...query,
                  cinemaId: val,
                  theaterHallId: undefined
                })
              }}
              value={query.cinemaId}
              onSearch={getCinemaData}
            >
              {cinemaData.map((item) => (
                <Select.Option value={item.id} key={item.id}>
                  {item.name}
                </Select.Option>
              ))}
            </Select>
          ) : null}
          <Select
            style={{ width: 200 }}
            value={query.theaterHallId}
            showSearch
            popupMatchSelectWidth={300}
            onChange={(val) => {
              const hall = theaterHallData.find((item) => item.id === val)
              const cinemaSpecId = hall?.cinemaSpecId
              const hasSpecSelected =
                query.specIds != null && query.specIds.length > 0
              setQuery({
                ...query,
                theaterHallId: val,
                specIds: hasSpecSelected
                  ? query.specIds
                  : cinemaSpecId != null
                    ? [cinemaSpecId]
                    : []
              })
            }}
          >
            {theaterHallData.map((item) => (
              <Select.Option value={item.id} key={item.id}>
                {item.name}（{item.cinemaSpecName}）
              </Select.Option>
            ))}
          </Select>
        </Space>
      </Form.Item>
      <Form.Item
        label={t('showTimeModal.form.dimension.label')}
        name="dimensionType"
        rules={[
          {
            required: true,
            message: t('showTimeModal.form.dimension.required'),
            validator() {
              if (query.dimensionType == null) {
                return Promise.reject(
                  new Error(t('showTimeModal.form.dimension.required'))
                )
              }
              return Promise.resolve()
            }
          }
        ]}
      >
        <DictSelect
          code={DictCode.DIMENSION_TYPE}
          value={query.dimensionType}
          onChange={(val) => {
            setQuery({ ...query, dimensionType: val })
            form.setFieldsValue({ dimensionType: val })
          }}
          style={{ width: 200 }}
        />
      </Form.Item>
      <Form.Item label={t('showTimeModal.form.spec.label')} name="cinemaSpecId">
        <Space>
          <Select
            mode="multiple"
            style={{ width: 200 }}
            value={query.specIds ?? []}
            disabled={!query.cinemaId}
            onChange={(val) => setQuery({ ...query, specIds: val ?? [] })}
          >
            {specList.map((item: any) => (
              <Select.Option value={item.id} key={item.id}>
                {item.name}
              </Select.Option>
            ))}
          </Select>
        </Space>
      </Form.Item>
    </>
  )
}
