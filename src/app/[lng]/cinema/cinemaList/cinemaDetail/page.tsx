'use client'
import React, { useState, useEffect } from 'react'
import {
  Button,
  Cascader,
  Flex,
  Form,
  Input,
  InputNumber,
  Select,
  Space
} from 'antd'
import { useTranslation } from '@/app/i18n/client'
import { PageProps } from '@/app/[lng]/layout'
import { Cinema } from '@/type/api'
import { useRouter, useSearchParams } from 'next/navigation'
import http from '@/api'
import { CheckPermission } from '@/components/checkPermission'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import {
  AddressTreeListResponse,
  getAddressTreeList
} from '@/api/request/cinema'

export default function Page({ params: { lng } }: PageProps) {
  const { t } = useTranslation(lng, 'cinemaDetail')
  const { t: common } = useTranslation(lng, 'common')
  const [data, setData] = useState<Partial<any>>({
    maxSelectSeatCount: 5,
    spec: []
  })
  const [specList, setSpecList] = useState<any[]>([])
  const [addressTreeList, setAddressTreeList] = useState<
    AddressTreeListResponse[]
  >([])
  const [addressSelectedOptions, setAddressSelectedOptions] = useState<
    AddressTreeListResponse[]
  >([])
  const [brandList, setBrandList] = useState<any[]>([])
  const [form] = Form.useForm()
  const router = useRouter()
  const searchParams = useSearchParams()

  const getBrandData = (
    name: string = '',
    id: number | undefined = undefined
  ) => {
    http({
      url: 'brand/list',
      method: 'post',
      data: {
        id,
        name,
        page: 1,
        pageSize: 10
      }
    }).then((res) => {
      setBrandList(res.data?.list)
    })
  }
  const getAddress = () => {
    getAddressTreeList().then((res) => {
      setAddressTreeList(res.data as unknown as AddressTreeListResponse[])
    })
  }

  const getData = () => {
    if (searchParams.has('id')) {
      http({
        url: 'cinema/detail',
        method: 'get',
        params: {
          id: searchParams.get('id')
        }
      }).then((res) => {
        if (res.data.brandId) {
          getBrandData('', res.data.brandId)
        }

        const parsedData = {
          ...res.data,
          areaId: [
            res.data.regionId,
            res.data.prefectureId,
            res.data.cityId
          ].filter(Boolean),
          spec:
            res.data.spec?.map((item: { id: number }) => ({
              ...item,
              specId: item.id
            })) ?? []
        }

        form.setFieldsValue(parsedData)
        setData(parsedData)
      })
    }
  }
  const getSpecData = () => {
    http({
      url: 'cinema/spec/list',
      method: 'post',
      data: {
        page: 1,
        pageSize: 50
      }
    }).then((res) => {
      setSpecList(res.data.list)
    })
  }

  useEffect(() => {
    getBrandData()
    getData()
    getSpecData()
    getAddress()
  }, [])

  return (
    <div>
      <Form
        {...{
          labelCol: {
            xs: { span: 24 },
            sm: { span: 6 }
          },
          wrapperCol: {
            xs: { span: 24 },
            sm: { span: 18 }
          }
        }}
        form={form}
        variant="filled"
        style={{ maxWidth: 800 }}
      >
        <Form.Item
          label={t('form.brandId.label')}
          rules={[{ required: true, message: t('form.brandId.required') }]}
          name="brandId"
        >
          <Select
            showSearch
            value={data.brandId}
            onChange={(val) => {
              setData({
                ...data,
                brandId: val
              })
            }}
            onSearch={getBrandData}
          >
            {brandList.map((item: any) => {
              return (
                <Select.Option value={item.id} key={item.id}>
                  {item.name}
                </Select.Option>
              )
            })}
          </Select>
        </Form.Item>
        <Form.Item
          label={t('form.name.label')}
          rules={[{ required: true, message: t('form.name.required') }]}
          name="name"
        >
          <Input
            value={data.name}
            onChange={(e) => {
              data.name = e.currentTarget.value
              setData({
                ...data
              })
            }}
          ></Input>
        </Form.Item>
        <Form.Item
          label={t('form.description.label')}
          rules={[{ required: true, message: t('form.description.required') }]}
          name="description"
        >
          <Input.TextArea
            rows={5}
            value={data.description}
            onChange={(e) => {
              data.description = e.currentTarget.value
              setData({
                ...data
              })
            }}
          ></Input.TextArea>
        </Form.Item>
        <Form.Item label={t('form.address.label')} required>
          <Flex gap={10}>
            <Form.Item
              name="areaId"
              noStyle
              rules={[{ required: true, message: t('form.areaId.required') }]}
            >
              <Cascader
                fieldNames={{ label: 'name', value: 'id' }}
                options={addressTreeList}
                placeholder="Please select"
                onChange={(value, selectedOptions) =>
                  setAddressSelectedOptions(selectedOptions)
                }
              />
            </Form.Item>
            <Form.Item
              name="address"
              noStyle
              rules={[{ required: true, message: t('form.address.required') }]}
            >
              <Input placeholder="详细地址" />
            </Form.Item>
          </Flex>
        </Form.Item>
        <Form.Item
          label={t('form.tel.label')}
          rules={[{ required: true, message: t('form.tel.required') }]}
          name="tel"
        >
          <Input
            value={data.tel}
            onChange={(e) => {
              data.tel = e.target.value
              setData({
                ...data
              })
            }}
          ></Input>
        </Form.Item>
        <Form.Item
          label={t('form.homePage.label')}
          rules={[{ required: false, message: t('form.homePage.required') }]}
          name="homePage"
        >
          <Input
            value={data.homePage}
            onChange={(e) => {
              data.homePage = e.target.value
              setData({
                ...data
              })
            }}
          ></Input>
        </Form.Item>
        <Form.Item
          label={t('form.maxSelectSeatCount.label')}
          rules={[
            { required: false, message: t('form.maxSelectSeatCount.required') }
          ]}
          name="maxSelectSeatCount"
        >
          <InputNumber
            min={1}
            value={data.maxSelectSeatCount}
            precision={0}
            style={{ width: '200px' }}
            placeholder={t('form.maxSelectSeatCount.required')}
            onChange={(val) => {
              data.maxSelectSeatCount = val as number

              setData({
                ...data
              })
            }}
          />
        </Form.Item>
        <Form.Item
          label={t('form.spec.label')}
          required={true}
          name={['spec', 'price']}
          rules={[
            {
              required: true,
              validator() {
                const array = data.spec.map(
                  (item: { specId: number }) => item.specId
                )

                return array.length === new Set(array).size
                  ? Promise.resolve()
                  : Promise.reject(new Error(t('message.repeat')))
              },
              validateTrigger: ['onChange', 'onBlur']
            },
            {
              required: true,
              validator() {
                const every = data.spec.every(
                  (item: { specId: number; plusPrice: string }) => {
                    return item.specId && /\d+/g.test(item.plusPrice)
                  }
                )

                return every
                  ? Promise.resolve()
                  : Promise.reject(new Error(t('message.required')))
              }
            }
          ]}
        >
          <Space direction="vertical" size={15}>
            {data.spec?.map((item: any, index: number) => {
              return (
                <Space size={15} key={item.id}>
                  <Select
                    value={item.specId}
                    style={{
                      width: '200px'
                    }}
                    placeholder={t('form.spec.required')}
                    onChange={(val) => {
                      data.spec[index].specId = val

                      setData({
                        ...data,
                        data: data.spec
                      })
                    }}
                  >
                    {specList.map((item) => {
                      return (
                        <Select.Option key={item.id} value={item.id}>
                          {item.name}
                        </Select.Option>
                      )
                    })}
                  </Select>
                  <InputNumber
                    min={0}
                    value={item.plusPrice}
                    precision={0}
                    placeholder={t('form.plusPrice.required')}
                    style={{
                      width: '230px'
                    }}
                    onChange={(val) => {
                      data.spec[index].plusPrice = val

                      setData({
                        ...data,
                        data: data.spec
                      })
                    }}
                  />
                  <MinusCircleOutlined
                    onClick={() => {
                      data.spec.splice(index, 1)

                      setData({
                        ...data,
                        data: data.spec
                      })
                    }}
                  />
                </Space>
              )
            })}
            <Button
              type="dashed"
              style={{
                width: '100%'
              }}
              onClick={() => {
                data.spec.push({
                  id: data.spec.length
                } as never)
                setData({
                  ...data,
                  data: data.spec
                })
              }}
              icon={<PlusOutlined />}
            >
              {common('button.add')}
            </Button>
          </Space>
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
          <CheckPermission code="cinema.save">
            <Button
              type="primary"
              htmlType="submit"
              onClick={() => {
                const fullAddress =
                  addressSelectedOptions
                    .slice(1)
                    .map((item) => item.name)
                    .join('') + data.address
                console.log(fullAddress)
                // return
                const [regionId = null, prefectureId = null, cityId = null] =
                  form.getFieldValue('areaId') || []

                http({
                  url: 'admin/cinema/save',
                  method: 'post',
                  data: {
                    ...data,
                    regionId,
                    prefectureId,
                    cityId,
                    fullAddress
                  }
                }).then(() => {
                  router.back()
                })
              }}
            >
              {common('button.save')}
            </Button>
          </CheckPermission>
        </Form.Item>
      </Form>
    </div>
  )
}
