import React, { useState, useEffect } from 'react'
import { DatePicker, Flex, message } from 'antd'
import dayjs, { Dayjs } from 'dayjs'

export type dateValue = {
  start: Dayjs | null
  end: Dayjs | null
}

export interface RangePickerProps {
  value: dateValue
  onChange: (date: dateValue) => void
}

export function RangePicker(props: RangePickerProps) {
  const [startDate, setStartDate] = useState<Dayjs | null>(null)
  const [endDate, setEndDate] = useState<Dayjs | null>(null)

  const handleStartDateChange = (date: Dayjs | null) => {
    if (endDate && date && date.isAfter(endDate)) {
      message.error('开始时间必须小于结束时间')
    } else {
      setStartDate(date)
      props.onChange({
        start: date,
        end: endDate
      })
    }
  }

  const handleEndDateChange = (date: Dayjs | null) => {
    if (startDate && date && date.isBefore(startDate)) {
      message.error('结束时间必须大于开始时间')
    } else {
      setEndDate(date)
      props.onChange({
        start: startDate,
        end: date
      })
    }
  }

  useEffect(() => {
    setStartDate(props.value.start || null)
    setEndDate(props.value.end || null)
  }, [props.value])

  return (
    <Flex gap={10}>
      <DatePicker
        showTime
        onChange={handleStartDateChange}
        value={startDate}
      />
      <span>-</span>
      <DatePicker
        showTime={{ defaultValue: dayjs('23:59:59', 'HH:mm:ss') }}
        onChange={handleEndDateChange}
        value={endDate}
      />
    </Flex>
  )
}
