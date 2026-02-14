'use client'
import { useCommonStore } from '@/store/useCommonStore'
import React, { useEffect, useState } from 'react'
import { Select } from 'antd'

export interface DictProps {
  code: string
  /** 受控值，不传时由 Form.Item 注入 */
  value?: number | undefined
  /** 变更回调，不传时由 Form.Item 注入 */
  onChange?: (val: number | undefined) => void
  style?: React.CSSProperties
  placeholder?: string
  disabled?: boolean
}

export function DictSelect(props: DictProps) {
  const [code, setCode] = useState<number | undefined>(props.value)
  const dict = useCommonStore((state) => state.dict)

  useEffect(() => {
    setCode(props.value)
  }, [props.value])

  return (
    <Select
      value={code}
      allowClear
      style={props.style}
      placeholder={props.placeholder}
      disabled={props.disabled}
      onChange={(val) => {
        setCode(val)
        props.onChange?.(val)
      }}
    >
      {dict[props.code]?.map((item) => (
        <Select.Option value={item.code} key={item.id}>
          {item.name}
        </Select.Option>
      ))}
    </Select>
  )
}
