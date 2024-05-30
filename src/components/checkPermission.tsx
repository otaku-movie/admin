import React from 'react'
import { useUserStore } from '@/store/useUserStore'

export interface CheckPermissionProps {
  code: string
  children: React.ReactElement
}

export function CheckPermission(props: CheckPermissionProps) {
  const buttonPermission = useUserStore((state) => state.buttonPermission)

  if (buttonPermission.has(props.code) || props.code === '') {
    return props.children
  }
}
