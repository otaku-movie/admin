'use client'
import React from 'react'
// import { useRouter } from 'next/navigation'
import '@/assets/css/normalize.scss'
import { languages } from '@/config'
// import { processPath } from '@/config/router'

export interface PageProps {
  children: React.ReactNode
  params: {
    lng: keyof typeof languages
  }
}

export default function Page() {
  // const router = useRouter()

  // router.push(processPath('home'))

  return null
}
