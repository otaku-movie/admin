import { Image, ImageProps } from 'antd'

import { getURL } from '@/utils'
import { notFoundImage } from '@/config/index'
import React from 'react'

export interface CustomAntImageProps extends ImageProps {}


export function CustomAntImage(props: CustomAntImageProps) {
  const url = getURL(props.src as string)

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
