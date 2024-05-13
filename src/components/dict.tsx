'use client'
import { dictStore } from '@/store/dictStore'
import React, { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { camelCase } from '@/utils'

export interface DictProps {
  code: number
  name: string
}

export function Dict(props: DictProps) {
  const dict = dictStore((state) => state.dict)
  const [name, setName] = useState<string>('')

  useEffect(() => {
    const key = camelCase(props.name)
    const find = dict?.[key]?.find((item) => item.code === props.code)
    setName(find?.name || '')
    console.log(1)
  }, [])

  return <span>{name}</span>
}
