import React from 'react'
// import { languages } from '@/config'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../../layout'

export default function RootLayout({ params: { lng } }: PageProps) {
  const { t } = useTranslation(lng, 'common')

  return <span>403</span>
}
