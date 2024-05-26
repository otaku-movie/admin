import React from 'react'
import { userStore } from '@/store/userStore'

export interface CheckPermissionProps {
  code: string
  children: React.ReactElement
}

export function CheckPermission (props: CheckPermissionProps) {
  const buttonPermission = userStore((state) => state.buttonPermission)


  if (buttonPermission.has(props.code)) {
    return props.children
  }
}