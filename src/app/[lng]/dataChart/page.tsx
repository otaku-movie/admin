'use client'
import React, { useState, useEffect } from 'react'
import http from '@/api/index'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '@/app/[lng]/layout'

export default function Page({ params: { lng } }: PageProps) {
  const { t } = useTranslation(lng, 'menu')

  useEffect(() => {}, [])

  return <section>hello world</section>
}
