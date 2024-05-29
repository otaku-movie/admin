'use client'
import React, { useState, useEffect } from 'react'
import {
  Button,
  Space,
  message,
  Form,
  Table,
  Tag,
  TableColumnsType
} from 'antd'
import { useTranslation } from '@/app/i18n/client'
import { Props } from './one'
import { CheckPermission } from '@/components/checkPermission'
import { SelectStaffModal, movieStaff } from '@/dialog/selectStaffModal'
import { SelectCharacterModal } from '@/dialog/selectCharacterModal'
import http from '@/api'
import { useRouter } from 'next/navigation'
import { processPath } from '@/config/router'
import { character } from '@/type/api'

interface modal<T> {
  columns: TableColumnsType<movieStaff>
  data: T[]
  modal: {
    type: 'create' | 'edit'
    show: boolean
    data: Record<string, any>
    index: number
  }
}

export function Two(props: Props) {
  const router = useRouter()
  const { t } = useTranslation(props.language, 'movieDetail')
  const [form] = Form.useForm()

  const [staff, setStaff] = useState<modal<movieStaff>>({
    columns: [
      {
        title: t('staff.table.position'),
        dataIndex: 'name'
      },
      {
        title: t('staff.table.name'),
        dataIndex: 'staff',
        render(staff) {
          return (
            <Space>
              {staff.map((item: any) => {
                return <Tag key={item.id}>{item.name}</Tag>
              })}
            </Space>
          )
        }
      },

      {
        title: t('staff.table.action'),
        key: 'operation',
        width: 100,
        render: (_, row, index: number) => {
          return (
            <Space>
              <Button
                type="primary"
                onClick={() => {
                  setStaff((prev) => {
                    prev.modal.index = index
                    prev.modal.type = 'edit'
                    prev.modal.data = {
                      positionId: row.id,
                      staffId: row.staff.map((item) => item.id)
                    }
                    prev.modal.show = true

                    return {
                      ...prev
                    }
                  })
                }}
              >
                {t('staff.button.edit')}
              </Button>
              <Button
                type="primary"
                danger
                onClick={() => {
                  setStaff((prev) => {
                    const newData = [...prev.data]
                    newData.splice(index, 1)

                    return {
                      ...prev,
                      data: newData
                    }
                  })
                }}
              >
                {t('staff.button.remove')}
              </Button>
            </Space>
          )
        }
      }
    ],
    data: [],
    modal: {
      type: 'create',
      show: false,
      data: {},
      index: 0
    }
  })
  const [character, setCharacter] = useState<modal<character>>({
    columns: [
      {
        title: t('character.table.cover'),
        dataIndex: 'cover'
      },
      {
        title: t('character.table.name'),
        dataIndex: 'name'
      },
      {
        title: t('character.table.staff'),
        dataIndex: 'staff',
        render(staff) {
          return (
            <Space>
              {staff.map((item: any) => {
                return <Tag key={item.id}>{item.name}</Tag>
              })}
            </Space>
          )
        }
      },
      {
        title: t('character.table.action'),
        key: 'operation',
        // width: 100,
        render: (_, row, index: number) => {
          return (
            <Space>
              <Button
                type="primary"
                onClick={() => {
                  setCharacter((prev) => {
                    prev.modal.index = index
                    prev.modal.type = 'edit'
                    prev.modal.data = {
                      characterId: row.id
                    }
                    prev.modal.show = true

                    return {
                      ...prev
                    }
                  })
                }}
              >
                {t('staff.button.edit')}
              </Button>
              <Button
                type="primary"
                danger
                onClick={() => {
                  setCharacter((prev) => {
                    const newData = [...prev.data]
                    newData.splice(index, 1)

                    return {
                      ...prev,
                      data: newData
                    }
                  })
                }}
              >
                {t('staff.button.remove')}
              </Button>
            </Space>
          )
        }
      }
    ],
    data: [],
    modal: {
      type: 'create',
      show: false,
      data: {},
      index: 0
    }
  })

  const select = (type: 'staff' | 'character') => {
    if (type === 'staff') {
      setStaff({
        ...staff,
        modal: {
          type: 'create',
          data: {},
          show: true,
          index: 0
        }
      })
    } else {
      setCharacter({
        ...character,
        modal: {
          type: 'create',
          data: {},
          show: true,
          index: 0
        }
      })
    }
  }

  const getStaffList = () => {
    if (props.data.id) {
      http({
        url: 'movie/staff',
        method: 'get',
        params: {
          id: props.data.id
        }
      }).then((res) => {
        setStaff({
          ...staff,
          data: res.data
        })
      })
    }
  }
  const getCharacterList = () => {
    if (props.data.id) {
      http({
        url: 'movie/character',
        method: 'get',
        params: {
          id: props.data.id
        }
      }).then((res) => {
        setCharacter({
          ...character,
          data: res.data
        })
      })
    }
  }

  const has = (type: any, data: any) => {
    const method: any = type === 'staff' ? setStaff : setCharacter
    const obj = type === 'staff' ? staff : character

    if (obj.modal.type === 'create') {
      const some = obj.data.some((item: {name: string}) => item.name === data.name)

      if (some) {
        message.warning(t(`${type}.message.notRepeat`))
      } else {
        obj.data.push(data)

        method({
          ...obj,
          data: [...obj.data],
          modal: {
            ...obj.modal,
            show: false
          }
        })
      }
    } else {
      const old = obj.data[obj.modal.index]
      const filter = obj.data.filter(item => item.name !== old.name)
      const some = filter.some((item) => item.name === data.name)
      if (old.name === data.name || some) {
        message.warning(t(`${type}.message.notRepeat`))
      } else {
        obj.data[obj.modal.index] = data

        method({
          ...obj,
          data: [...obj.data],
          modal: {
            ...obj.modal,
            show: false
          }
        })
      }
    }
  }

  useEffect(() => {
    getStaffList()
    getCharacterList()
  }, [props.data])

  return (
    <>
      <Form
        {...{
          labelCol: {
            span: 2
          },
          wrapperCol: {
            span: 20
          }
        }}
        form={form}
        // variant="filled"
        // initialValues={data}
        // style={{ width: '100vw' }}
        // layout="vertical"
        name="movieDetail"
      >
        <Form.Item label={t('form.staff.label')}>
          <Space
            direction="vertical"
            style={{
              display: 'flex'
            }}
            size={20}
          >
            <Button type="primary" onClick={() => select('staff')}>
              {t('staff.select')}
            </Button>
            <Table
              columns={staff.columns}
              dataSource={staff.data}
              bordered={true}
              pagination={false}
            />
          </Space>
        </Form.Item>
        <Form.Item label={t('form.character.label')}>
          <Space
            direction="vertical"
            style={{
              display: 'flex'
            }}
            size={20}
          >
            <Button type="primary" onClick={() => select('character')}>
              {t('character.select')}
            </Button>
            <Table
              columns={character.columns}
              dataSource={character.data}
              bordered={true}
              pagination={false}
            />
          </Space>
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 2 }}>
          <Space>
            <Button onClick={props.onPrev}>{t('button.prev')}</Button>
            <CheckPermission code="movie.save">
              <Button
                type="primary"
                htmlType="submit"
                onClick={() => {
                  form.validateFields().then(() => {
                    http({
                      url: 'movie/save',
                      method: 'post',
                      data: {
                        ...props.data,
                        characterList: character.data.map((item) => {
                          return {
                            movieId: props.data.id,
                            characterId: item.id
                          }
                        }),
                        staffList: staff.data.reduce(
                          (
                            total: {
                              positionId: number
                              staffId: number
                              movieId: number
                            }[],
                            current
                          ) => {
                            return total.concat(
                              current.staff.map((children) => {
                                return {
                                  positionId: current.id,
                                  staffId: children.id,
                                  movieId: props.data.id
                                }
                              })
                            )
                          },
                          []
                        )
                      }
                    }).then(() => {
                      message.success('保存成功')
                      router.push(processPath('movieList'))
                    })
                  })
                }}
              >
                {t('button.save')}
              </Button>
            </CheckPermission>
          </Space>
        </Form.Item>
      </Form>
      <SelectStaffModal
        show={staff.modal.show}
        data={staff.modal.data}
        onCancel={() => {
          setStaff({
            ...staff,
            modal: {
              ...staff.modal,
              show: false
            }
          })
        }}
        onConfirm={(data) => {
          has('staff', data)
        }}
      ></SelectStaffModal>
      <SelectCharacterModal
        show={character.modal.show}
        data={character.modal.data}
        onCancel={() => {
          setCharacter({
            ...character,
            modal: {
              ...character.modal,
              show: false
            }
          })
        }}
        onConfirm={(data) => {
          has('character', data)
        }}
      ></SelectCharacterModal>
    </>
  )
}
