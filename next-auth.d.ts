import { UserRole } from '@prisma/client'
import { DefaultSession } from 'next-auth'

export type ExtendedUser = DefaultSession['user'] & {
  //   role: 'ADMIN' | 'USER'
  role: UserRole
  isTwoFactorEnabled: boolean
  isOAuth: boolean
}

declare module 'next-auth' {
  interface Session {
    user: ExtendedUser
  }
}

// import { JWT } from 'next-auth/jwt'

// declare module '@auth/core/jwt' {
//   interface JWT {
//     role?: 'ADMIN' | 'USER'
//   }
// }
