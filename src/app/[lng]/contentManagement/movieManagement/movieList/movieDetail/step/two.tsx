'use client'
import React, { useState, useEffect } from 'react'
import {
  Button,
  Space,
  message,
  Form,
  Table,
  TableColumnsType,
  Select
} from 'antd'
import { useTranslation } from '@/app/i18n/client'
import { Props } from './one'
import { CheckPermission } from '@/components/checkPermission'
import { SelectStaffModal } from '@/dialog/selectStaffModal'
import { PositionModal } from '@/dialog/positionModal'
import http from '@/api'
import { staff, position } from '@/type/api'
import { useMovieStore } from '@/store/useMovieStore'
import { notFoundImage } from '@/config'
import { CustomAntImage } from '@/components/CustomAntImage'
import { useCommonStore } from '@/store/useCommonStore'

// 工作人员带职位信息
interface StaffWithPositions extends staff {
  positions: position[]
}

export function Two(props: Readonly<Props>) {
  const movieStore = useMovieStore()
  const commonStore = useCommonStore()
  const { t } = useTranslation(props.language, 'movieDetail')
  const [form] = Form.useForm()

  // 工作人员列表（带职位）
  const [staffList, setStaffList] = useState<StaffWithPositions[]>([])
  const [staffModalShow, setStaffModalShow] = useState(false)
  const [positionModal, setPositionModal] = useState({
    type: 'create' as 'create' | 'edit',
    show: false,
    data: {}
  })

  // 工作人员表格列
  const staffColumns: TableColumnsType<StaffWithPositions> = [
    {
      title: t('staff.table.cover'),
      dataIndex: 'cover',
      width: 80,
      render(cover) {
        return (
          <CustomAntImage
            width={50}
            src={cover}
            fallback={notFoundImage}
            placeholder={true}
            style={{ borderRadius: '4px' }}
          />
        )
      }
    },
    {
      title: t('staff.table.name'),
      dataIndex: 'name',
      width: 150
    },
    {
      title: (
        <Space>
          {t('staff.table.position')}
          <Button
            type="link"
            size="small"
            onClick={() => setPositionModal({ ...positionModal, show: true })}
          >
            + {t('staff.modal.button.addPosition')}
          </Button>
        </Space>
      ),
      dataIndex: 'positions',
      render: (positions: position[], record, index) => (
        <Select
          mode="multiple"
          style={{ width: '100%', minWidth: 200 }}
          placeholder={t('staff.modal.form.position.placeholder')}
          value={positions.map((p) => p.id)}
          onChange={(values) => {
            const newPositions = values
              .map((id) => commonStore.positionList.find((p) => p.id === id))
              .filter(Boolean) as position[]
            setStaffList((prev) =>
              prev.map((s, i) =>
                i === index ? { ...s, positions: newPositions } : s
              )
            )
          }}
          optionFilterProp="children"
          showSearch
        >
          {commonStore.positionList.map((item) => (
            <Select.Option value={item.id} key={item.id}>
              {item.name}
            </Select.Option>
          ))}
        </Select>
      )
    },
    {
      title: t('staff.table.action'),
      width: 80,
      render: (_, record, index) => (
        <Button
          type="link"
          danger
          onClick={() => {
            setStaffList((prev) => prev.filter((_, i) => i !== index))
          }}
        >
          {t('staff.button.remove')}
        </Button>
      )
    }
  ]

  const getStaffList = () => {
    if (movieStore.movie.id) {
      http({
        url: 'movie/staff',
        method: 'get',
        params: {
          id: movieStore.movie.id
        }
      }).then((res) => {
        // 将返回的按职位分组的数据转换为按人员分组
        const staffMap = new Map<number, StaffWithPositions>()
        res.data.forEach(
          (posGroup: { id: number; name: string; staff: staff[] }) => {
            posGroup.staff.forEach((s) => {
              if (staffMap.has(s.id)) {
                const existing = staffMap.get(s.id)!
                existing.positions.push({
                  id: posGroup.id,
                  name: posGroup.name
                })
              } else {
                staffMap.set(s.id, {
                  ...s,
                  positions: [{ id: posGroup.id, name: posGroup.name }]
                })
              }
            })
          }
        )
        setStaffList(Array.from(staffMap.values()))
      })
    }
  }

  useEffect(() => {
    getStaffList()
    commonStore.getPositionList()
  }, [])

  // 处理选择工作人员
  const handleStaffSelect = (selectedStaff: staff[]) => {
    // 添加新选择的工作人员（初始无职位）
    const newStaff: StaffWithPositions[] = selectedStaff.map((s) => ({
      ...s,
      positions: []
    }))
    setStaffList((prev) => [...prev, ...newStaff])
    setStaffModalShow(false)
  }

  // 保存数据
  const handleSave = () => {
    props.onNext?.()
    // 检查是否有工作人员未分配职位
    // const staffWithoutPosition = staffList.filter(
    //   (s) => s.positions.length === 0
    // )
    // if (staffWithoutPosition.length > 0) {
    //   message.warning(
    //     t('staff.modal.message.staffWithoutPosition', {
    //       count: staffWithoutPosition.length
    //     })
    //   )
    //   return
    // }

    // // 构建保存数据
    // const staffData: {
    //   positionId: number
    //   staffId: number
    //   movieId: number
    // }[] = []
    // staffList.forEach((s) => {
    //   s.positions.forEach((pos) => {
    //     staffData.push({
    //       positionId: pos.id,
    //       staffId: s.id,
    //       movieId: movieStore.movie.id!
    //     })
    //   })
    // })

    // http({
    //   url: 'admin/movie/save',
    //   method: 'post',
    //   data: {
    //     ...movieStore.movie,
    //     staffList: staffData
    //   }
    // }).then(() => {
    //   message.success('保存成功')
    //   props.onNext?.()
    // })
  }

  return (
    <>
      <Form
        labelCol={{ span: 2 }}
        wrapperCol={{ span: 20 }}
        form={form}
        name="movieDetail"
      >
        <Form.Item label={t('form.staff.label')}>
          <Space direction="vertical" style={{ display: 'flex' }} size={20}>
            <Button type="primary" onClick={() => setStaffModalShow(true)}>
              {t('staff.select')}
            </Button>
            <Table
              columns={staffColumns}
              dataSource={staffList}
              rowKey="id"
              bordered={true}
              pagination={false}
            />
          </Space>
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 2 }}>
          <Space>
            <Button onClick={props.onPrev}>{t('button.prev')}</Button>
            <CheckPermission code="movie.save">
              <Button type="primary" onClick={handleSave}>
                {t('button.next')}
              </Button>
            </CheckPermission>
          </Space>
        </Form.Item>
      </Form>

      <SelectStaffModal
        show={staffModalShow}
        selectedIds={staffList.map((s) => s.id)}
        onCancel={() => setStaffModalShow(false)}
        onConfirm={handleStaffSelect}
      />

      <PositionModal
        type={positionModal.type}
        show={positionModal.show}
        data={positionModal.data}
        onCancel={() => setPositionModal({ ...positionModal, show: false })}
        onConfirm={() => {
          setPositionModal({ ...positionModal, show: false })
          commonStore.getPositionList()
        }}
      />
    </>
  )
}
