'use client'

import React from 'react'
import { DatePicker, Select, Space } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import {
  dayjsToThirtyHour,
  thirtyHourToDayjs,
  THIRTY_HOUR_HOUR_OPTIONS,
  THIRTY_HOUR_MINUTE_OPTIONS
} from '@/utils/thirtyHourTime'

export type TimeDisplayMode = '24h' | '30h'

export interface AppTimePickerProps {
  /** 时间（完整 datetime；24h/30h 仅影响显示，提交给后端统一用 value.format('YYYY-MM-DD HH:mm:ss') 即 24h） */
  value?: Dayjs | null
  onChange?: (time: Dayjs | null) => void
  /** 24h 或 30h 显示 */
  mode?: TimeDisplayMode
  /** 放映日（用于 30h 时把 24〜29 转成次日 0〜5 的日期） */
  baseDate?: Dayjs
  style?: React.CSSProperties
  disabled?: boolean
  placeholder?: string
}

export function AppTimePicker({
  value,
  onChange,
  mode = '24h',
  baseDate,
  style,
  disabled,
  placeholder
}: AppTimePickerProps) {
  const base = baseDate ?? dayjs().startOf('day')

  if (mode === '30h') {
    const display = dayjsToThirtyHour(value ?? null)
    const hour30 = display?.hour30 ?? THIRTY_HOUR_HOUR_OPTIONS[0]
    const minute = display?.minute ?? 0

    return (
      <Space.Compact style={{ width: '100%', ...style }} className="app-time-picker-30h">
        <Select
          style={{ width: 72 }}
          disabled={disabled}
          placeholder="6"
          value={display ? hour30 : undefined}
          onChange={(h) => onChange?.(thirtyHourToDayjs(h, minute, base))}
          options={THIRTY_HOUR_HOUR_OPTIONS.map((h) => ({
            value: h,
            label: String(h).padStart(2, '0')
          }))}
        />
        <span style={{ alignSelf: 'center', padding: '0 2px', color: 'rgba(0,0,0,0.45)' }}>:</span>
        <Select
          style={{ width: 72 }}
          disabled={disabled}
          placeholder="00"
          value={display ? minute : undefined}
          onChange={(m) => onChange?.(thirtyHourToDayjs(hour30, m, base))}
          options={THIRTY_HOUR_MINUTE_OPTIONS.map((m) => ({
            value: m,
            label: String(m).padStart(2, '0')
          }))}
        />
      </Space.Compact>
    )
  }

  // 24h：Ant Design TimePicker，value 用 base 的日期 + value 的时分
  const pickerValue = value ? base.hour(value.hour()).minute(value.minute()).second(0).millisecond(0) : null
  return (
    <DatePicker.TimePicker
      value={pickerValue}
      onChange={(v) => {
        if (!v) {
          onChange?.(null)
          return
        }
        onChange?.(base.hour(v.hour()).minute(v.minute()).second(0).millisecond(0))
      }}
      style={{ width: '100%', ...style }}
      format="HH:mm"
      disabled={disabled}
      placeholder={placeholder}
    />
  )
}
