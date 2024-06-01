import React, { useState, useEffect } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { Image, Upload as AntdUpload, message } from 'antd'
import type { GetProp, UploadFile, UploadProps as AntdUploadProps } from 'antd'
import { BASE_URL } from '@/config'
import { ImageCropper } from '../cropper/cropper'
import './style.scss'
import http from '@/api'

type FileType = Parameters<GetProp<AntdUploadProps, 'beforeUpload'>>[0]

const getBase64 = (file: FileType): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

export interface UploadProps {
  value: string
  crop?: boolean
  onChange?: (val: string) => void
}

export function Upload(props: UploadProps) {
  const [crop] = useState(props.crop)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [imageURL, setImageURL] = useState('')
  const [cropperURL, setCropperURL] = useState('')
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [modal, setModal] = useState({
    show: false
  })

  useEffect(() => {
    if (props.value) {
      setFileList([
        {
          uid: '-1',
          name: 'image.png',
          status: 'done',
          url: props.value
        }
      ])
      setImageURL(props.value)
    }
  }, [props.value])

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as FileType)
    }

    setPreviewImage(file.url || (file.preview as string))
    setPreviewOpen(true)
  }

  const handleChange: AntdUploadProps['onChange'] = ({
    fileList,
    file,
    event
  }) => {
    console.log(file, event, fileList)

    setFileList(fileList)
    if (file.status === 'done') {
      const url = file.response.data.url
      setImageURL(url)
      props.onChange?.(url)
    }
  }

  const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type="button">
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  )

  const deleteFile = () => {
    http({
      url: '/deleteFile',
      method: 'delete',
      params: {
        path: imageURL.split('/').slice(4).join('/')
      }
    }).then(() => {
      message.success('success')
    })
  }
  return (
    <>
      <AntdUpload
        action={BASE_URL + '/upload'}
        listType="picture-card"
        fileList={fileList}
        // beforeUpload={() => {
        //   return false
        // }}
        onPreview={handlePreview}
        onChange={handleChange}
        customRequest={(options) => {
          console.log(options)
          if (crop) {
            setModal({
              show: true
            })
            const file = options.file as File
            const blob = new Blob([options.file], {
              type: file.type
            })

            setCropperURL(URL.createObjectURL(blob))
          }
        }}
        onRemove={() => {
          deleteFile()
        }}
      >
        {fileList.length >= 1 ? null : uploadButton}
      </AntdUpload>
      <ImageCropper
        imageURL={cropperURL}
        visible={modal.show}
        fixed={true}
        options={{
          aspectRatio: 160 / 190,
          cropBoxResizable: true,
        }}
        onConfirm={(data) => {
          const fd = new FormData()
          fd.append('file', data.file)

          http({
            url: '/upload',
            method: 'post',
            data: fd
          }).then((res: any) => {
            setFileList([
              {
                uid: '-1',
                name: 'image.png',
                status: 'done',
                url: res.data.url
              }
            ])
            props.onChange?.(res.data.url)
            message.success('success')
          })
         
        }}
      ></ImageCropper>
      {previewImage && (
        <Image
          wrapperStyle={{ display: 'none' }}
          alt="image"
          preview={{
            visible: previewOpen,
            onVisibleChange: (visible) => setPreviewOpen(visible),
            afterOpenChange: (visible) => !visible && setPreviewImage('')
          }}
          src={previewImage}
        />
      )}
    </>
  )
}
