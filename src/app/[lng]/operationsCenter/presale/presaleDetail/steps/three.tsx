'use client'

import React from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch
} from 'antd'
import { Upload as ImageUpload } from '@/components/upload/Upload'
import type { StepProps, SpecificationFormItem } from '../types'

export function StepSpecifications({ form, t, common }: StepProps) {
  return (
    <Row gutter={[0, 24]}>
      <Col span={24}>
        <Card title={t('presale.form.section.specifications')} size="small">
          <Form.List
            name="specifications"
            rules={[
              {
                validator: async (_, value) => {
                  if (!value || value.length === 0) {
                    return Promise.reject(
                      new Error(t('presale.form.specifications.required'))
                    )
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                <Form.Item
                  label={t('presale.form.specifications.label')}
                  required={false}
                  style={{ marginBottom: 16 }}
                />
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  {fields.map((record) => (
                    <Card
                      key={record.key}
                      size="small"
                      title={t('presale.form.specifications.untitled', {
                        index: record.name + 1
                      })}
                      extra={
                        <Button
                          type="link"
                          danger
                          size="small"
                          onClick={() => remove(record.name)}
                        >
                          {common('button.remove')}
                        </Button>
                      }
                    >
                      <Form.Item name={[record.name, 'id']} hidden>
                        <Input hidden />
                      </Form.Item>
                      <Row gutter={[16, 0]}>
                        <Col span={24}>
                          <Form.Item
                            label={t('presale.form.specifications.images.label')}
                            name={[record.name, 'images']}
                            style={{ marginBottom: 16 }}
                          >
                            <ImageUpload
                              value={
                                form.getFieldValue([
                                  'specifications',
                                  record.name,
                                  'images'
                                ]) || []
                              }
                              multiple
                              onChange={(val) => {
                                const specs =
                                  form.getFieldValue('specifications') || []
                                specs[record.name] = {
                                  ...specs[record.name],
                                  images: val
                                }
                                form.setFieldsValue({
                                  specifications: [...specs]
                                })
                              }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={[16, 0]}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={t('presale.form.specifications.group.label')}
                            name={[record.name, 'name']}
                            rules={[
                              {
                                required: true,
                                message: t(
                                  'presale.form.specifications.group.required'
                                )
                              }
                            ]}
                            style={{ marginBottom: 16 }}
                          >
                            <Input
                              placeholder={t(
                                'presale.form.specifications.group.placeholder'
                              )}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={[16, 0]}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={t('presale.form.specifications.ticketType.label')}
                            name={[record.name, 'ticketType']}
                            rules={[
                              {
                                required: true,
                                message: t(
                                  'presale.form.specifications.ticketType.required'
                                )
                              }
                            ]}
                            style={{ marginBottom: 16 }}
                          >
                            <Select
                              options={[
                                {
                                  value: 'online',
                                  label: t('presale.mubitikeType.online')
                                },
                                {
                                  value: 'card',
                                  label: t('presale.mubitikeType.card')
                                }
                              ]}
                              placeholder={t(
                                'presale.form.specifications.ticketType.placeholder'
                              )}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item
                        name={[record.name, 'priceItems']}
                        label={t('presale.form.specifications.price.items')}
                        style={{ marginBottom: 16 }}
                        rules={[
                          {
                            validator: (_, value) => {
                              const list = Array.isArray(value) ? value : []
                              const hasValid = list.some(
                                (pi: { label?: string; price?: unknown }) =>
                                  typeof (pi?.label ?? '').trim() === 'string' &&
                                  (pi?.label ?? '').trim().length > 0 &&
                                  typeof pi?.price === 'number' &&
                                  !Number.isNaN(pi.price) &&
                                  pi.price >= 0
                              )
                              if (!hasValid) {
                                return Promise.reject(
                                  new Error(
                                    t(
                                      'presale.form.specifications.price.atLeastOne'
                                    )
                                  )
                                )
                              }
                              return Promise.resolve()
                            }
                          }
                        ]}
                      >
                        <Form.List name={[record.name, 'priceItems']}>
                          {(
                            priceFields,
                            { add: addPrice, remove: removePrice }
                          ) => (
                            <>
                              {priceFields.map((pf) => (
                                <Row
                                  key={pf.key}
                                  gutter={[8, 0]}
                                  align="middle"
                                  style={{ marginBottom: 8 }}
                                >
                                  <Col flex="1">
                                    <Form.Item
                                      name={[pf.name, 'label']}
                                      noStyle
                                      rules={[
                                        {
                                          required: true,
                                          message: t(
                                            'presale.form.specifications.price.itemLabelRequired'
                                          )
                                        }
                                      ]}
                                    >
                                      <Input
                                        placeholder={t(
                                          'presale.form.specifications.price.itemLabelPlaceholder'
                                        )}
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col flex="1">
                                    <Form.Item
                                      name={[pf.name, 'price']}
                                      noStyle
                                      rules={[
                                        {
                                          required: true,
                                          message: t(
                                            'presale.form.specifications.price.required'
                                          )
                                        },
                                        {
                                          type: 'number',
                                          min: 0,
                                          message: t(
                                            'presale.form.specifications.price.min'
                                          )
                                        },
                                        {
                                          type: 'number',
                                          max: 9999999,
                                          message: t(
                                            'presale.form.specifications.price.max'
                                          )
                                        }
                                      ]}
                                    >
                                      <InputNumber
                                        min={0}
                                        max={9999999}
                                        precision={0}
                                        style={{ width: '100%' }}
                                        placeholder={t(
                                          'presale.form.specifications.price.placeholder'
                                        )}
                                      />
                                    </Form.Item>
                                  </Col>
                                  <Col>
                                    <Button
                                      type="link"
                                      danger
                                      size="small"
                                      onClick={() => removePrice(pf.name)}
                                      disabled={priceFields.length <= 1}
                                    >
                                      {common('button.remove')}
                                    </Button>
                                  </Col>
                                </Row>
                              ))}
                              <Button
                                type="dashed"
                                size="small"
                                onClick={() =>
                                  addPrice({ label: '', price: undefined })
                                }
                              >
                                {t('presale.form.specifications.price.addItem')}
                              </Button>
                            </>
                          )}
                        </Form.List>
                      </Form.Item>
                      <Row gutter={[16, 0]}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={t('presale.form.specifications.stock.label')}
                            name={[record.name, 'stock']}
                            style={{ marginBottom: 16 }}
                          >
                            <InputNumber
                              min={0}
                              precision={0}
                              style={{ width: '100%' }}
                              placeholder={t(
                                'presale.form.specifications.stock.placeholder'
                              )}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Divider
                        orientation="left"
                        plain
                        style={{ margin: '8px 0 12px' }}
                      >
                        <Space size={12}>
{t('presale.form.specifications.bonus.section')}
                        <Form.Item
                            name={[record.name, 'bonusIncluded']}
                            valuePropName="checked"
                            noStyle
                          >
                            <Switch
                              size="small"
                              checkedChildren={t(
                                'presale.form.specifications.bonus.yes'
                              )}
                              unCheckedChildren={t(
                                'presale.form.specifications.bonus.no'
                              )}
                            />
                          </Form.Item>
                        </Space>
                      </Divider>
                      <Form.Item
                        noStyle
                        shouldUpdate={(prev, cur) => {
                          const pSpecs = prev.specifications || []
                          const cSpecs = cur.specifications || []
                          return (
                            pSpecs[record.name]?.bonusIncluded !==
                            cSpecs[record.name]?.bonusIncluded
                          )
                        }}
                      >
                        {() => {
                          const bonusOn = form.getFieldValue([
                            'specifications',
                            record.name,
                            'bonusIncluded'
                          ])
                          if (!bonusOn) return null
                          return (
                            <>
                              <Form.Item
                                label={t(
                                  'presale.form.specifications.bonus.images'
                                )}
                                name={[record.name, 'bonusImages']}
                                style={{ marginBottom: 16 }}
                              >
                                <ImageUpload
                                  value={
                                    form.getFieldValue([
                                      'specifications',
                                      record.name,
                                      'bonusImages'
                                    ]) || []
                                  }
                                  multiple
                                  onChange={(val) => {
                                    const specs =
                                      form.getFieldValue('specifications') || []
                                    specs[record.name] = {
                                      ...specs[record.name],
                                      bonusImages: val
                                    }
                                    form.setFieldsValue({
                                      specifications: [...specs]
                                    })
                                  }}
                                />
                              </Form.Item>
                              <Row gutter={[16, 0]}>
                                <Col xs={24} sm={16}>
                                  <Form.Item
                                    label={t(
                                      'presale.form.specifications.bonus.title.label'
                                    )}
                                    name={[record.name, 'bonusTitle']}
                                    style={{ marginBottom: 16 }}
                                  >
                                    <Input
                                      placeholder={t(
                                        'presale.form.specifications.bonus.title.placeholder'
                                      )}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col xs={24} sm={8}>
                                  <Form.Item
                                    label={t(
                                      'presale.form.specifications.bonus.quantity.label'
                                    )}
                                    name={[record.name, 'bonusQuantity']}
                                    style={{ marginBottom: 16 }}
                                  >
                                    <InputNumber
                                      min={0}
                                      precision={0}
                                      style={{ width: '100%' }}
                                      placeholder={t(
                                        'presale.form.specifications.bonus.quantity.placeholder'
                                      )}
                                    />
                                  </Form.Item>
                                </Col>
                              </Row>
                              <Form.Item
                                label={t(
                                  'presale.form.specifications.bonus.description.label'
                                )}
                                name={[record.name, 'bonusDescription']}
                                style={{ marginBottom: 16 }}
                              >
                                <Input.TextArea
                                  rows={2}
                                  placeholder={t(
                                    'presale.form.specifications.bonus.description.placeholder'
                                  )}
                                />
                              </Form.Item>
                            </>
                          )
                        }}
                      </Form.Item>
                    </Card>
                  ))}
                </Space>
                <Button
                  type="dashed"
                  onClick={() => {
                    const specs = form.getFieldValue(
                      'specifications'
                    ) as SpecificationFormItem[] | undefined
                    const first = Array.isArray(specs) ? specs[0] : undefined
                    add({
                      deliveryType: first?.deliveryType ?? 'virtual',
                      ticketType: first?.ticketType ?? 'online',
                      bonusIncluded: true,
                      images: [],
                      priceItems: [{ label: '', price: undefined }]
                    })
                  }}
                  style={{ width: 240, marginTop: 16 }}
                >
                  {t('presale.form.specifications.add')}
                </Button>
                <Form.ErrorList errors={errors} />
              </>
            )}
          </Form.List>
        </Card>
      </Col>
    </Row>
  )
}
