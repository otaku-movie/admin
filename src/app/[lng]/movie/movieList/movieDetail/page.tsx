'use client'
import React, { useEffect, useState } from 'react'
import { PageProps } from '../../../layout'
import { useSearchParams } from 'next/navigation'
import http from '@/api'
import dayjs from 'dayjs'
import { Movie, SpecItem } from '@/type/api'
import { One } from './step/one'
import { Two } from './step/two'

export default function MovieDetail({ params: { lng } }: PageProps) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<
    Partial<
      Omit<Movie, 'spec'> & {
        spec: number[]
        startDate: dayjs.Dayjs | null
        endDate: dayjs.Dayjs | null
      }
    >
  >({
    spec: [],
    startDate: null,
    endDate: null
  })

  const searchParams = useSearchParams()

  const getData = () => {
    if (searchParams.has('id')) {
      http({
        url: 'movie/detail',
        method: 'get',
        params: {
          id: searchParams.get('id')
        }
      }).then((res) => {
        setData({
          ...res.data,
          startDate:
            res.data.startDate === null
              ? null
              : dayjs(res.data.startDate || new Date()),
          endDate:
            res.data.endDate === null
              ? null
              : dayjs(res.data.endDate || new Date()),
          spec: res.data.spec?.map((item: SpecItem) => item.id)
        })
      })
    }
  }

  const next = () => {
    if (step < components.length) {
      setStep(step + 1)
    }
  }
  const prev = () => {
    if (step !== 0) {
      setStep(step - 1)
    }
  }

  useEffect(() => {
    getData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const components = [
    <One language={lng} data={data} onNext={next} key={0}></One>,
    <Two language={lng} data={data} onNext={next} onPrev={prev} key={1}></Two>
  ]

  return <>{components[step]}</>
}
