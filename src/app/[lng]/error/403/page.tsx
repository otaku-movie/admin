'use client'
import React from 'react'
// import { languages } from '@/config'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '../../layout'
import { Button, Result } from 'antd'
import { useRouter } from 'next/navigation'

export default function Page({ params: { lng } }: PageProps) {
  const router = useRouter()
  const { t } = useTranslation(lng, 'common')

  return (
    <>
      <Result
        status="403"
        title="403"
        subTitle={t('error.403.title')}
        extra={
          <Button
            type="primary"
            onClick={() => {
              router.push(`/${lng}/login`)
            }}
          >
            {t('error.403.button')}
          </Button>
        }
      />
    </>
  )
}
