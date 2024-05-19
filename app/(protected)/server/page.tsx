import { UserInfo } from '@/components/user-info'
import { currentuser } from '@/lib/auth'
import React from 'react'

const ServerPage = async () => {
  const user = await currentuser()
  return <UserInfo label="💻 Server Component" user={user} />
}

export default ServerPage
