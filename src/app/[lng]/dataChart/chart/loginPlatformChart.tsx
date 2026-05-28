import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useTranslation } from '@/app/i18n/client'
import { languageType } from '@/config'

interface Data {
  platform: string
  userCount: number
}
interface Props {
  data: Data[]
}

const COLOR_MAP: Record<string, string> = {
  google: '#4285F4',
  apple: '#111111',
  local: '#52c41a',
  mixed: '#fa8c16'
}

export function LoginPlatformChart(props: Props) {
  const container = useRef<HTMLDivElement | null>(null)
  const { t } = useTranslation(navigator.language as languageType, 'chart')

  useEffect(() => {
    if (!container.current) return
    const list = props.data || []

    const items = list.map((item) => {
      const key = (item.platform || 'local').toLowerCase()
      const i18nKey = `loginPlatform.platform.${key}`
      const translated = t(i18nKey)
      return {
        name: translated && translated !== i18nKey ? translated : item.platform,
        value: item.userCount,
        itemStyle: { color: COLOR_MAP[key] }
      }
    })

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: t('loginPlatform.title'),
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },
          data: items
        }
      ]
    }

    const chart = echarts.init(container.current, null, {
      width: container.current.parentElement?.clientWidth || 400,
      height: 400
    })
    chart.setOption(option)

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [props.data, t])

  return (
    <section>
      <section ref={container} id="login-platform-chart"></section>
    </section>
  )
}
