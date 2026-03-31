import { Image, ImageProps } from 'antd'

import { getURL } from '@/utils'
import { notFoundImage } from '@/config/index'
import React from 'react'

export interface CustomAntImageProps extends ImageProps {}


export function CustomAntImage(props: CustomAntImageProps) {
  const url = getURL(props.src as string)
  const { style, onError, preview = false, ...rest } = props
  const mergedStyle: React.CSSProperties = {
    maxWidth: '100%',
    ...(rest.width == null && rest.height == null ? { height: 'auto' } : {}),
    ...style
  }

  return (
    // eslint-disable-next-line jsx-a11y/alt-text
    <Image
      {...rest}
      src={url}
      fallback={notFoundImage}
      onError={(e) => {
        e.currentTarget.src = notFoundImage
        onError?.(e)
      }}
      style={mergedStyle}
      preview={preview}
    ></Image>
  )
}
