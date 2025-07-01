import { Image, ImageProps } from 'antd'
import { notFoundImage } from '@/config/index'
import React from 'react'

export interface CustomAntImageProps extends ImageProps {}

export const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL

export function CustomAntImage(props: CustomAntImageProps) {
  const url = props.src?.startsWith('http')
    ? `${props.src}`
    : `${IMAGE_URL}${props.src}`

  console.log('CustomAntImage', url, props.src)
  return (
    // eslint-disable-next-line jsx-a11y/alt-text
    <Image
      {...props}
      src={url}
      fallback={notFoundImage}
      onError={(e) => {
        e.currentTarget.src = notFoundImage
      }}
      style={{ maxWidth: '100%', height: 'auto' }}
      preview={false}
    ></Image>
  )
}
