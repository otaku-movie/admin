import React from 'react'
import Link from 'next/link'
import Movie from '@/app/[lng]/movie/page'
import cinema from '@/app/[lng]/cinema/page'

export const menu = [
  {
    router: '/cinema',
    name: <Link href="/cinema">劇場リスト</Link>,
    component: cinema
  },
  {
    router: '/movie',
    name: <Link href="/movie">映画リスト</Link>,
    component: Movie
  }
]
