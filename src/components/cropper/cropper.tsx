import React, { useLayoutEffect, useState, useRef, useEffect } from 'react'
import classNames from 'classnames'
import Cropper from 'cropperjs'
import { Modal } from 'antd'
import 'cropperjs/src/css/cropper.scss'
import './cropper.scss'

interface OutputResult {
  file: File
  blob: Blob
}

export interface ImageCropperProps {
  imageURL: string
  visible?: boolean
  circle?: boolean
  options?: Omit<Cropper.Options, 'preview'>
  action?: React.ReactNode
  outputFilename?: string
  children?: React.ReactNode
  fixed?: boolean
  fixedNumber?: number
  getInstance?: (instance: Cropper) => void
  onClose?: () => void
  onCancel?: () => void
  onConfirm?: (cropperData: OutputResult) => void
}

export function ImageCropper(props: ImageCropperProps) {
  const {
    imageURL,
    visible,
    options,
    // action,
    fixed,
    fixedNumber,
    circle = false,
    outputFilename = 'cropper.png',
    getInstance,
    onCancel,
    // onClose,
    onConfirm
  } = props

  const image = useRef<HTMLImageElement>(null)
  const container = useRef<HTMLDivElement>(null)
  const [cropperInstance, setCropperInstance] = useState<Cropper | null>(null)
  const [show, setShow] = useState(visible)

  useEffect(() => {
    if (visible) {
      setShow(true)
    }
  }, [visible])

  useLayoutEffect(() => {
    if (show && image.current && container.current) {
      const cropper = new Cropper(image.current, {
        autoCropArea: 0.5,
        cropBoxResizable: true,
        ...options,
        viewMode: 1,
        autoCrop: true,
        preview: container.current
      })
      setCropperInstance(cropper)
      getInstance?.(cropper)

      return () => {
        cropper.destroy()
      }
    }
  }, [show, fixed, fixedNumber, options, getInstance])

  const cancel = () => {
    setShow(false)
    onCancel?.()
  }

  const confirm = async () => {
    const getData = () => {
      return new Promise<OutputResult>((resolve, reject) => {
        const canvasData = cropperInstance?.getCroppedCanvas({
          imageSmoothingQuality: 'high'
        })
        canvasData?.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], outputFilename, {
              type: blob.type
            })
            resolve({
              blob,
              file
            })
          } else {
            reject(new Error('Blob creation failed'))
          }
        })
      })
    }

    setShow(false)

    const result = await getData()
    onConfirm?.(result)
  }

  return (
    <aside className="otaku-cropper-container">
      <Modal
        open={show}
        title="图片裁剪"
        className="otaku-cropper-dialog"
        maskClosable={false}
        width="80vw"
        style={{
          maxHeight: '50vh'
        }}
        // height="80vh"
        onOk={confirm}
        onCancel={cancel}
      >
        <section className="otaku-dialog-content">
          <div className="otaku-image-cropper">
            <img
              src={imageURL}
              alt=""
              ref={image}
              className="otaku-image-cropper-image"
            />
          </div>
          <div
            className={classNames('otaku-image-cropper-preview-container', {
              'is-circle': circle
            })}
          >
            <div className="otaku-image-cropper-preview" ref={container}></div>
          </div>
        </section>
      </Modal>
    </aside>
  )
}
