import React, { useState, useEffect } from 'react'
import { Flex, Button, Input } from 'antd'
import http from '@/api'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'

export interface VerifyCodeProps {
  value: string
  length?: number
  query: Record<string, any>
  onChange: (code: string) => void
  onSuccess: (data: any) => void
}

export function VerifyCode(props: Readonly<VerifyCodeProps>) {
  const defaultTime = 120
  const [code, setCode] = useState('')
  const [time, setTime] = useState(defaultTime)
  const [countdown, setCountdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation(navigator.language as languageType, 'components')
  const { length = 6 } = props

  useEffect(() => {
    let timer: any

    if (time < 1) {
      setCountdown(false)
      clearInterval(timer)
    }
    if (countdown && time > 0) {
      timer = setInterval(() => {
        setTime(time - 1)
      }, 1000)
    }

    return () => {
      clearInterval(timer)
    }
  }, [time, countdown])

  useEffect(() => {
    setCode(props.value)
  }, [props.value])

  return (
    <Flex gap={10}>
      <Input
        value={code}
        onChange={(e) => {
          setCode(e.target.value)
          props.onChange(e.target.value)
        }}
        showCount
        maxLength={length}
      />
      {countdown ? (
        <Button type="primary">
          {time} {t('verifyCode.second')}
        </Button>
      ) : (
        <Button
          type="primary"
          loading={loading}
          onClick={() => {
            setLoading(true)

            http({
              url: 'verify/sendCode',
              method: 'post',
              data: props.query
            })
              .then((res) => {
                setCountdown(true)
                setTime(defaultTime)
                props.onSuccess(res)
              })
              .finally(() => {
                setLoading(false)
              })
          }}
        >
          {t('verifyCode.button')}
        </Button>
      )}
    </Flex>
  )
}
