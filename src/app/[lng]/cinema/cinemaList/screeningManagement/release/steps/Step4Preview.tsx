'use client'

import React from 'react'
import { Typography, Card, Alert, Row, Col, Space } from 'antd'
import { CheckCircleOutlined, VideoCameraOutlined, DollarOutlined } from '@ant-design/icons'
import type { ReleaseFormState } from '../types'
import { PRICING_MODE_FIXED } from '../types'

const { Title, Paragraph } = Typography

function PreviewRow({
  label,
  value,
  valueColor
}: {
  label: string
  value: React.ReactNode
  valueColor?: string
}) {
  return (
    <Col span={24}>
      <Row>
        <Col span={8}>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            {label}
          </Paragraph>
        </Col>
        <Col span={16}>
          <Paragraph style={{ marginBottom: 0, color: valueColor }}>
            {value ?? '--'}
          </Paragraph>
        </Col>
      </Row>
    </Col>
  )
}

interface Step4PreviewProps {
  form: ReleaseFormState
  t: (key: string) => string
  common: (key: string) => string
  movieData: { id: number; name: string }[]
  theaterHallData: { id: number; name: string; cinemaSpecName?: string }[]
  languageData: { id: number; name: string }[]
  movieVersionData: { id: number; name: string; startDate?: string; endDate?: string }[]
  specList: { id: number; name: string; cinemaSpecName?: string }[]
  showTimeTagData?: { id: number; name: string }[]
  activityName?: string
  dimensionLabel?: string
}

export function Step4Preview({
  form,
  t,
  common,
  movieData,
  theaterHallData,
  languageData,
  movieVersionData,
  specList,
  showTimeTagData = [],
  dimensionLabel
}: Step4PreviewProps) {
  const movieName =
    form.movieId != null
      ? movieData.find((m) => m.id === form.movieId)?.name ?? form.movieName ?? '--'
      : form.movieName ?? '--'
  const theaterHallName =
    form.theaterHallId != null
      ? theaterHallData.find((h) => h.id === form.theaterHallId)?.name
      : undefined
  const subtitleNames = form.subtitleId?.length
    ? languageData
        .filter((l) => form.subtitleId?.includes(l.id))
        .map((l) => l.name)
        .join('、')
    : undefined
  const movieVersionName =
    form.movieVersionId != null
      ? movieVersionData.find((v) => v.id === form.movieVersionId)?.name
      : undefined

  const billingModeText =
    form.pricingMode === PRICING_MODE_FIXED
      ? t('releasePage.step3.fixedPrice')
      : t('releasePage.step3.noActivity')
  const specNames = form.specIds?.length
    ? specList
        .filter((s) => form.specIds?.includes(s.id))
        .map((s) => s.cinemaSpecName ? `${s.name}（${s.cinemaSpecName}）` : s.name)
        .join('、')
    : undefined
  const showTimeTagNames = form.showTimeTagId?.length
    ? showTimeTagData
        .filter((tag) => form.showTimeTagId?.includes(tag.id))
        .map((tag) => tag.name)
        .join('、')
    : undefined
  const mubiTicketText = form.allowPresale !== false ? t('releasePage.step4.yes') : t('releasePage.step4.no')

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Space align="center" size={8} style={{ marginBottom: 8 }}>
          <CheckCircleOutlined style={{ color: 'var(--ant-color-success)', fontSize: 18 }} />
          <span style={{ color: 'var(--ant-color-primary)', fontWeight: 600 }}>STEP 4</span>
        </Space>
        <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
          {t('releasePage.step4.title')}
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {t('releasePage.step4.instruction')}
        </Paragraph>
      </div>

      {/* Step 1: 基础放映信息 */}
      <Card size="small" style={{ marginBottom: 16 }} title={<Space><VideoCameraOutlined />{t('releasePage.step1.title')}</Space>}>
        <Row gutter={[0, 12]}>
          <PreviewRow label={t('showTimeModal.form.movie.label')} value={movieName} />
          <PreviewRow
            label={t('releasePage.screeningDate')}
            value={form.screeningDate?.format('YYYY/MM/DD')}
          />
          <PreviewRow
            label={t('releasePage.endDate')}
            value={form.endTime ? form.endTime.format('YYYY/MM/DD') : form.screeningDate?.format('YYYY/MM/DD') ?? '-'}
          />
          <PreviewRow
            label={t('showTimeModal.form.dubbingVersion.label')}
            value={movieVersionName}
          />
          <PreviewRow
            label={t('showTimeModal.form.spec.label')}
            value={specNames}
          />
          <PreviewRow
            label={t('showTimeModal.form.subtitle.label')}
            value={subtitleNames}
          />
          <PreviewRow
            label={t('showTimeModal.form.showTimeTag.label')}
            value={showTimeTagNames}
          />
          <PreviewRow
            label={t('showTimeModal.form.dimension.label')}
            value={dimensionLabel}
          />
          <PreviewRow label={t('showTimeModal.form.theaterHall.label')} value={theaterHallName} />
          <PreviewRow
            label={t('releasePage.startTime')}
            value={
              form.startTime && form.screeningDate
                ? `${form.startTime.format('HH:mm')}${form.startTime.date() > form.screeningDate.date() ? ` ${t('releasePage.step4.nextDay')}` : ''}`
                : form.startTime?.format('HH:mm')
            }
          />
          <PreviewRow
            label={t('releasePage.endTime')}
            value={
              form.endTime && form.screeningDate
                ? `${form.endTime.format('HH:mm')}${form.endTime.date() > form.screeningDate.date() ? ` ${t('releasePage.step4.nextDay')}` : ''}`
                : form.endTime?.format('HH:mm')
            }
          />
          <PreviewRow
            label={t('showTimeModal.form.open.label')}
            value={form.open !== false ? t('releasePage.step4.openYes') : t('releasePage.step4.openNo')}
          />
          {form.open !== false && (
            <>
              <PreviewRow
                label={t('showTimeModal.form.publishMode.label')}
                value={
                  form.publishMode === 'scheduled'
                    ? t('showTimeModal.form.publishMode.scheduled')
                    : t('showTimeModal.form.publishMode.immediate')
                }
              />
              {form.publishMode === 'scheduled' && form.publishAt && (
                <PreviewRow
                  label={t('showTimeModal.form.publishAt.label')}
                  value={form.publishAt.format('YYYY/MM/DD HH:mm')}
                />
              )}
              <PreviewRow
                label={t('showTimeModal.form.saleOpenAt.label')}
                value={
                  form.enableSaleOpenAt === false
                    ? t('releasePage.step4.notSet')
                    : form.saleOpenAt
                      ? form.saleOpenAt.format('YYYY/MM/DD HH:mm')
                      : '--'
                }
              />
            </>
          )}
        </Row>
      </Card>

      {/* Step 2: 定价模式与补价 */}
      <Card
        size="small"
        style={{
          marginBottom: 24,
          background: 'var(--ant-color-fill-tertiary)',
          borderColor: 'var(--ant-color-border-secondary)'
        }}
        title={<Space><DollarOutlined />{t('releasePage.step3.title')}</Space>}
      >
        <Row gutter={[0, 12]}>
          <PreviewRow
            label={t('releasePage.step4.billingMode')}
            value={billingModeText}
            valueColor="var(--ant-color-success)"
          />
          <PreviewRow
            label={t('releasePage.step4.allowMubiTicket')}
            value={mubiTicketText}
          />
        </Row>
      </Card>

      <Alert
        type="info"
        showIcon
        icon={<CheckCircleOutlined />}
        message={t('releasePage.step4.confirmAlert')}
        style={{ marginBottom: 24 }}
      />
    </>
  )
}
