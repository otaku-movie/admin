'use client'
import { useCommonStore } from '@/store/useCommonStore'
import React, { useEffect, useState } from 'react'
import { Select } from 'antd'
import { DictItem } from '@/type/api'
// import type { DictItem } from '@/type/api'

export interface DictProps {
  code: string
  value: number | undefined
  onChange: (val: number) => void
  style?: React.CSSProperties
}

export function DictSelect(props: DictProps) {
  const [code, setCode] = useState<number>()
  const [dict, setDict] = useState<Record<string, DictItem[]>>({})
  const getDict = useCommonStore((state) => state.getDict)

  useEffect(() => {
    setCode(props.value)
  }, [props.value])

  useEffect(() => {
    getDict(props.code).then((res) => {
      console.log(res)
      setDict(res)
    })
  }, [props.code])

  return (
    <Select
      value={code}
      allowClear
      style={props.style}
      onChange={(val) => {
        setCode(val)
        props.onChange(val)
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
