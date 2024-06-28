'use client'
import { useCommonStore } from '@/store/useCommonStore'
import React, { useEffect, useState } from 'react'

export interface DictProps {
  code: number
  name: string
}

export function Dict(props: DictProps) {
  const dict = useCommonStore((state) => state.dict)
  const getDict = useCommonStore((state) => state.getDict)
  const [code, setCode] = useState<number>()
  const [name, setName] = useState<string>('')

  useEffect(() => {
    const find = dict?.[props.name]?.find((item) => item.code === props.code)
    setName(find?.name || '')

  }, [props.code])

  useEffect(() => {
    getDict(props.name).then((dict) => {
      const find = dict?.[props.name]?.find((item) => item.code === props.code)
      setName(find?.name || '')
    })
  }, [props.name])

  return <span>{name}</span>
}
