'use client'
import { useCommonStore } from '@/store/useCommonStore'
import React, { useEffect, useState } from 'react'
import { Select } from 'antd'
// import type { DictItem } from '@/type/api'

export interface DictProps {
  code: string
  value: number | undefined
  onChange: (val: number) => void
}

export function DictSelect(props: DictProps) {
  const [code, setCode] = useState<number>()
  const dict = useCommonStore((state) => state.dict)
  const getDict = useCommonStore((state) => state.getDict)

  useEffect(() => {
    setCode(props.value)
  }, [props.value])

  useEffect(() => {
    getDict(props.code)
  }, [props.code])

  return (
    <Select
      value={code}
      allowClear
      onChange={(val) => {
        setCode(val)
        props.onChange(val)
      }}
    >
      {dict[props.code]?.map((item) => (
        <Select.Option value={item.id} key={item.id}>
          {item.name}
        </Select.Option>
      ))}
    </Select>
  )
}
