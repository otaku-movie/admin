'use client'
import React, { useEffect, useState } from 'react'
import { PageProps } from '../../../layout'
import { useSearchParams } from 'next/navigation'
import http from '@/api'
import { SpecItem } from '@/type/api'
import { One } from './step/one'
import { Two } from './step/two'
import { useMovieStore } from '@/store/useMovieStore'

export default function MovieDetail({ params: { lng } }: PageProps) {
  
  const [step, setStep] = useState(0)
  const movieStore = useMovieStore()
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
        movieStore.setMovie({
          ...res.data,
          tags: res.data.tags?.map((item: SpecItem) => item.id),
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
    <One language={lng} onNext={next} key={0}></One>,
    <Two language={lng} onNext={next} onPrev={prev} key={1}></Two>
  ]

  return <>{components[step]}</>
}
