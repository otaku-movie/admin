'use client'
import React, { useState, useEffect, useMemo } from 'react'
import {
  Button,
  Space,
  message,
  Form,
  Table,
  Tag,
  TableColumnsType,
  Modal,
  Typography,
  DatePicker,
  Select
} from 'antd'
import { useTranslation } from '@/app/i18n/client'
import { Props } from './one'
import { CheckPermission } from '@/components/checkPermission'
import { SelectCharacterModal } from '@/dialog/selectCharacterModal'
import { SelectActorModal } from '@/dialog/selectActorModal'
import { character, staff, MovieVersion } from '@/type/api'
import { useMovieStore } from '@/store/useMovieStore'
import { notFoundImage } from '@/config'
import { CustomAntImage } from '@/components/CustomAntImage'
import { DictSelect } from '@/components/DictSelect'
import { useCommonStore } from '@/store/useCommonStore'
import dayjs from 'dayjs'
import { DictCode, DubbingVersionEnum } from '@/enum/dict'
import { getMovieVersions } from '@/api/request/movie'
import http from '@/api'
import { useRouter } from 'next/navigation'
import { processPath } from '@/config/router'

const { Title } = Typography

export function Three(props: Readonly<Props>) {
  const movieStore = useMovieStore()
  const { t } = useTranslation(props.language, 'movieDetail')
  const commonStore = useCommonStore()
  const router = useRouter()
  const [form] = Form.useForm()
  const [modalForm] = Form.useForm()

  // 存储所有版本信息
  const [versions, setVersions] = useState<MovieVersion[]>([])

  // 语言列表
  const [languageList, setLanguageList] = useState<
    { id: number; name: string }[]
  >([])

  // 版本编辑模态框状态
  const [versionModal, setVersionModal] = useState<{
    show: boolean
    type: 'create' | 'edit'
    data?: MovieVersion
    index?: number
  }>({
    show: false,
    type: 'create'
  })

  // 角色选择模态框状态
  const [characterModal, setCharacterModal] = useState<{
    show: boolean
    versionIndex: number
    characterId?: number
  }>({
    show: false,
    versionIndex: -1
  })

  // 演员选择模态框状态
  const [staffModal, setStaffModal] = useState<{
    show: boolean
    versionIndex: number
    characterIndex: number
    selectedStaff: staff[]
  }>({
    show: false,
    versionIndex: -1,
    characterIndex: -1,
    selectedStaff: []
  })

  // 当前选中的版本筛选
  const [selectedVersionFilter, setSelectedVersionFilter] = useState<
    number | null | undefined
  >(undefined)

  // 监听版本弹窗中选择的版本类型
  const [currentVersionId, setCurrentVersionId] = useState<number | undefined>(
    DubbingVersionEnum.ORIGINAL
  )

  // 获取所有版本（包括原版）
  const allVersions = useMemo(() => {
    const versions = commonStore.dict?.[DictCode.DUBBING_VERSION] || []
    return [...versions]
  }, [commonStore.dict, t])

  // 版本表格列
  const versionColumns: TableColumnsType<MovieVersion> = [
    {
      title: t('version.table.version'),
      dataIndex: 'dubbingVersionId',
      render: (versionId: number) => {
        const version = allVersions.find((v) => v.code === versionId)
        return version?.name || '--'
      }
    },
    {
      title: t('version.table.startDate'),
      dataIndex: 'startDate',
      render: (date: string) => {
        return date ? dayjs(date).format('YYYY-MM-DD') : '--'
      }
    },
    {
      title: t('version.table.endDate'),
      dataIndex: 'endDate',
      render: (date: string) => {
        return date ? dayjs(date).format('YYYY-MM-DD') : '--'
      }
    },
    {
      title: t('version.table.language'),
      dataIndex: 'languageId',
      render: (languageId: number) => {
        const language = languageList.find((l) => l.id === languageId)
        return language?.name || '--'
      }
    },
    {
      title: t('version.table.characterCount'),
      render: (_, record) => {
        return record.characters?.length || 0
      }
    },
    {
      title: t('version.table.action'),
      key: 'operation',
      width: 200,
      render: (_, record, index) => {
        return (
          <Space>
            <Button
              type="link"
              onClick={() => {
                setVersionModal({
                  show: true,
                  type: 'edit',
                  data: record,
                  index
                })
              }}
            >
              {t('version.button.edit')}
            </Button>
            <Button
              type="link"
              danger
              onClick={() => {
                const newVersions = versions.filter((_, i) => i !== index)
                setVersions(newVersions)
              }}
            >
              {t('version.button.remove')}
            </Button>
          </Space>
        )
      }
    }
  ]

  // 生成角色表格列（需要传入版本索引）
  const getCharacterColumns = (
    versionIndex: number
  ): TableColumnsType<character> => [
    {
      title: t('character.table.cover'),
      dataIndex: 'cover',
      render(cover) {
        return (
          <CustomAntImage
            width={80}
            src={cover}
            fallback={notFoundImage}
            placeholder={true}
            style={{
              borderRadius: ' 4px'
            }}
          />
        )
      }
    },
    {
      title: t('character.table.name'),
      dataIndex: 'name'
    },
    {
      title: t('character.table.staff'),
      dataIndex: 'staff',
      render(staffList: staff[], record, charIndex) {
        return (
          <Space wrap>
            {staffList?.map((item) => <Tag key={item.id}>{item.name}</Tag>)}
            <Button
              type="link"
              size="small"
              onClick={() => {
                setStaffModal({
                  show: true,
                  versionIndex,
                  characterIndex: charIndex,
                  selectedStaff: staffList || []
                })
              }}
            >
              {t('character.button.selectStaff')}
            </Button>
          </Space>
        )
      }
    },
    {
      title: t('character.table.action'),
      key: 'operation',
      width: 100,
      render: (_, row, charIndex) => {
        return (
          <Button
            type="link"
            danger
            onClick={() => {
              const newVersions = [...versions]
              newVersions[versionIndex].characters = newVersions[
                versionIndex
              ].characters.filter((_, i) => i !== charIndex)
              setVersions(newVersions)
            }}
          >
            {t('version.button.remove')}
          </Button>
        )
      }
    }
  ]

  // 获取版本列表
  const getVersionList = async () => {
    if (movieStore.movie.id) {
      try {
        const res = await getMovieVersions(movieStore.movie.id)
        if (res?.data) {
          setVersions(res.data as unknown as MovieVersion[])
        }
      } catch (error) {
        console.error('Failed to get version list:', error)
      }
    }
  }

  // 获取语言列表
  const getLanguageList = async () => {
    try {
      const res = await http({
        url: '/language/list',
        method: 'post',
        data: {
          page: 1,
          pageSize: 100
        }
      })
      if (res?.data?.list) {
        setLanguageList(res.data.list)
      }
    } catch (error) {
      console.error('Failed to get language list:', error)
    }
  }

  // 处理版本确认
  const handleVersionConfirm = (values: any) => {
    if (versionModal.type === 'create') {
      // 检查是否已存在该版本
      const exists = versions.some(
        (v) => v.dubbingVersionId === values.dubbingVersionId
      )
      if (exists) {
        message.warning(t('version.message.versionExists'))
        return
      }

      // 如果是配音版，同步原版角色
      let characters: character[] = []
      if (values.dubbingVersionId !== DubbingVersionEnum.ORIGINAL) {
        const originalVersion = versions.find(
          (v) => v.dubbingVersionId === DubbingVersionEnum.ORIGINAL
        )
        if (originalVersion) {
          // 复制原版角色，但清除配音演员信息
          characters = originalVersion.characters.map((char) => ({
            ...char,
            staff: [] // Clear dubbing actors, let user re-select
          }))
        }
      }

      const newVersion: MovieVersion = {
        movieId: movieStore.movie.id!,
        dubbingVersionId: values.dubbingVersionId,
        startDate: values.startDate?.format('YYYY-MM-DD'),
        endDate: values.endDate?.format('YYYY-MM-DD'),
        languageId: values.language,
        characters
      }
      setVersions([...versions, newVersion])
    } else {
      // 编辑
      const newVersions = [...versions]
      if (versionModal.index !== undefined) {
        newVersions[versionModal.index] = {
          ...newVersions[versionModal.index],
          startDate: values.startDate?.format('YYYY-MM-DD'),
          endDate: values.endDate?.format('YYYY-MM-DD'),
          languageId: values.language
        }
        setVersions(newVersions)
      }
    }
    setVersionModal({
      show: false,
      type: 'create'
    })
  }

  // 处理角色确认
  const handleCharacterConfirm = (data: character) => {
    const versionIndex = characterModal.versionIndex
    if (versionIndex >= 0) {
      const newVersions = [...versions]
      const version = newVersions[versionIndex]

      // 检查角色是否已存在
      const exists = version.characters.some((char) => char.id === data.id)
      if (exists) {
        message.warning(t('character.message.notRepeat'))
        return
      }

      version.characters.push(data)
      setVersions(newVersions)
      setCharacterModal({
        show: false,
        versionIndex: -1
      })
    }
  }

  useEffect(() => {
    getVersionList()
    getLanguageList()
  }, [])

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
        name="versionDetail"
      >
        <Form.Item label={t('version.label')}>
          <Space
            direction="vertical"
            style={{
              display: 'flex'
            }}
            size={20}
          >
            <Button
              type="primary"
              onClick={() => {
                setVersionModal({
                  show: true,
                  type: 'create'
                })
              }}
            >
              {t('version.button.add')}
            </Button>
            {/* 版本信息表格 */}
            <Table
              columns={versionColumns}
              dataSource={versions}
              bordered={true}
              pagination={false}
              rowKey={(record, index) => `version-${index}`}
            />

            {/* 版本筛选 */}
            <Space>
              <span>{t('version.filter.label')}:</span>
              <Select
                allowClear
                style={{ width: 200 }}
                placeholder={t('version.filter.placeholder')}
                value={selectedVersionFilter}
                onChange={(val) => setSelectedVersionFilter(val)}
              >
                {allVersions.map((v) => (
                  <Select.Option value={v.code} key={v.code}>
                    {v.name}
                  </Select.Option>
                ))}
              </Select>
            </Space>

            {/* 按版本分组显示角色 */}
            {versions.length > 0 && (
              <>
                {versions
                  .filter((v) =>
                    selectedVersionFilter === undefined ||
                    selectedVersionFilter === null
                      ? true
                      : v.dubbingVersionId === selectedVersionFilter
                  )
                  .map((version, idx) => {
                    const versionName =
                      allVersions.find(
                        (v) => v.code === version.dubbingVersionId
                      )?.name || '--'
                    const realIndex = versions.indexOf(version)
                    return (
                      <div
                        key={`version-char-${realIndex}`}
                        style={{
                          marginTop: idx === 0 ? 0 : 24,
                          padding: 16,
                          background: '#fafafa',
                          borderRadius: 8
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 16
                          }}
                        >
                          <Title level={4} style={{ margin: 0 }}>
                            {versionName} - {t('version.table.characters')}
                          </Title>
                          <Button
                            type="primary"
                            onClick={() => {
                              setCharacterModal({
                                show: true,
                                versionIndex: realIndex
                              })
                            }}
                          >
                            {t('version.button.addCharacter')}
                          </Button>
                        </div>
                        <Table
                          columns={getCharacterColumns(realIndex)}
                          dataSource={version.characters || []}
                          bordered={true}
                          pagination={false}
                          rowKey="id"
                          locale={{
                            emptyText: t('version.table.noCharacters')
                          }}
                        />
                      </div>
                    )
                  })}
              </>
            )}
          </Space>
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 2 }}>
          <Space>
            <Button onClick={props.onPrev}>{t('button.prev')}</Button>
            <CheckPermission code="movie.save">
              <Button
                type="primary"
                htmlType="submit"
                onClick={async () => {
                  try {
                    await form.validateFields()

                    // Call save API
                    await http({
                      url: 'admin/movie/save',
                      method: 'post',
                      data: {
                        ...movieStore.movie,
                        versions: versions.map((v) => ({
                          id: v.id,
                          dubbingVersionId: v.dubbingVersionId,
                          startDate: v.startDate,
                          endDate: v.endDate,
                          languageId: v.languageId,
                          characters: v.characters.map((c) => ({
                            id: c.id,
                            staffIds: c.staff?.map((s) => s.id) || []
                          }))
                        }))
                      }
                    })
                    message.success(
                      t('button.saveSuccess') || 'Save successful'
                    )

                    // 跳转到电影列表页
                    router.push(
                      processPath('movieList')
                    )
                    props.onNext?.()
                  } catch (error) {
                    console.error('Save failed:', error)
                  }
                }}
              >
                {t('button.save')}
              </Button>
            </CheckPermission>
          </Space>
        </Form.Item>
      </Form>

      {/* 版本编辑模态框 */}
      <Modal
        title={
          versionModal.type === 'create'
            ? t('version.modal.addTitle')
            : t('version.modal.editTitle')
        }
        open={versionModal.show}
        onOk={() => {
          modalForm.validateFields().then((values) => {
            handleVersionConfirm(values)
          })
        }}
        onCancel={() => {
          setVersionModal({
            show: false,
            type: 'create'
          })
          modalForm.resetFields()
        }}
        afterOpenChange={(open) => {
          if (open) {
            if (versionModal.data) {
              modalForm.setFieldsValue({
                dubbingVersionId: versionModal.data.dubbingVersionId,
                startDate: versionModal.data.startDate
                  ? dayjs(versionModal.data.startDate)
                  : undefined,
                endDate: versionModal.data.endDate
                  ? dayjs(versionModal.data.endDate)
                  : undefined,
                language: versionModal.data.languageId
              })
              setCurrentVersionId(versionModal.data.dubbingVersionId)
            } else {
              modalForm.resetFields()
              modalForm.setFieldsValue({
                dubbingVersionId: DubbingVersionEnum.ORIGINAL
              })
              setCurrentVersionId(DubbingVersionEnum.ORIGINAL)
            }
          } else {
            setCurrentVersionId(DubbingVersionEnum.ORIGINAL)
          }
        }}
      >
        <Form form={modalForm} layout="vertical">
          <Form.Item
            label={t('version.modal.version')}
            name="dubbingVersionId"
            rules={[
              { required: true, message: t('version.modal.versionRequired') }
            ]}
          >
            <DictSelect
              code={DictCode.DUBBING_VERSION}
              value={versionModal.data?.dubbingVersionId}
              style={{ width: '100%' }}
              onChange={(val) => {
                modalForm.setFieldsValue({ dubbingVersionId: val })
                setCurrentVersionId(val)
              }}
            />
          </Form.Item>
          {currentVersionId !== DubbingVersionEnum.ORIGINAL && (
            <>
              <Form.Item label={t('version.modal.startDate')} name="startDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label={t('version.modal.endDate')} name="endDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label={t('version.modal.language')} name="language">
                <Select
                  style={{ width: '100%' }}
                  placeholder={t('version.modal.languagePlaceholder')}
                  value={modalForm.getFieldValue('language')}
                  onChange={(val) =>
                    modalForm.setFieldsValue({ language: val })
                  }
                  showSearch
                  filterOption={(input, option) => {
                    return ((option?.label as string) ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }}
                  options={languageList.map((lang) => ({
                    label: lang.name,
                    value: lang.id
                  }))}
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* 角色选择模态框 */}
      <SelectCharacterModal
        show={characterModal.show}
        selectedIds={
          characterModal.versionIndex >= 0
            ? versions[characterModal.versionIndex]?.characters?.map(
                (c) => c.id
              ) || []
            : []
        }
        onCancel={() => {
          setCharacterModal({
            show: false,
            versionIndex: -1
          })
        }}
        onConfirm={handleCharacterConfirm}
      />

      {/* 演员选择模态框 */}
      <SelectActorModal
        show={staffModal.show}
        selectedStaff={staffModal.selectedStaff}
        onCancel={() => {
          setStaffModal({
            show: false,
            versionIndex: -1,
            characterIndex: -1,
            selectedStaff: []
          })
        }}
        onConfirm={(selectedStaff) => {
          // Save selected actors to corresponding character
          const { versionIndex, characterIndex } = staffModal
          if (versionIndex >= 0 && characterIndex >= 0) {
            const newVersions = [...versions]
            newVersions[versionIndex].characters[characterIndex].staff =
              selectedStaff
            setVersions(newVersions)
          }
          setStaffModal({
            show: false,
            versionIndex: -1,
            characterIndex: -1,
            selectedStaff: []
          })
        }}
      />
    </>
  )
}
