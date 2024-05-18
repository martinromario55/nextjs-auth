'use server'

import { getPasswordResetTokenByToken } from '@/data/password-reset-token'
import { getUserByEmail } from '@/data/user'
import { NewPasswordSchema } from '@/schemas'
import * as z from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export const newPassword = async (
  values: z.infer<typeof NewPasswordSchema>,
  token?: string | null
) => {
  if (!token) {
    return { error: 'Missing token' }
  }

  const validatedFields = NewPasswordSchema.safeParse(values)

  if (!validatedFields.success) {
    return { error: 'Invalid fields' }
  }
  const { password } = validatedFields.data

  // Check if token is valid
  const existingToken = await getPasswordResetTokenByToken(token)

  if (!existingToken) {
    return { error: 'Invalid token' }
  }

  // Check if token has expired
  const hasExpired = new Date(existingToken.expires) < new Date()

  if (hasExpired) {
    return { error: 'Token has expired' }
  }

  // Get existing user
  const existingUser = await getUserByEmail(existingToken.email)

  if (!existingUser) {
    return { error: 'Email does not exist' }
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Update user's password
  await db.user.update({
    where: { id: existingUser.id },
    data: { password: hashedPassword },
  })

  // Delete token
  await db.passwordResetToken.delete({
    where: { id: existingToken.id },
  })

  return { success: 'Password updated successfully' }
}
