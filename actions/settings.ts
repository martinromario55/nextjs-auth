'use server'

import { getUserByEmail, getUserById } from '@/data/user'
import { currentuser } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/mail'
import { generateVerificationToken } from '@/lib/tokens'
import { SettingsSchema } from '@/schemas'
import * as z from 'zod'
import bcrypt from 'bcryptjs'

export const settings = async (values: z.infer<typeof SettingsSchema>) => {
  const user = await currentuser()

  //   Find user
  if (!user) {
    return { error: 'Unauthorized!' }
  }

  //   find database user
  const dbUser = await getUserById(user.id)

  if (!dbUser) {
    return { error: 'Unauthorized!' }
  }

  // If User is OAuth User
  if (user.isOAuth) {
    values.email = undefined
    values.password = undefined
    values.newPassword = undefined
    values.isTwoFactorEnabled = undefined
  }

  // Change email
  if (values.email && values.email !== user.email) {
    // Check if email is already in use
    const existingUser = await getUserByEmail(values.email)

    if (existingUser && existingUser.id !== user.id) {
      return { error: 'User with same email already exists' }
    }

    // Verify new email
    const verificationToken = await generateVerificationToken(values.email)
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    )

    return { success: 'Verification email sent!' }
  }

  // Update Password
  if (values.password && values.newPassword && dbUser.password) {
    const passwordsMatch = await bcrypt.compare(
      values.password,
      dbUser.password
    )

    if (!passwordsMatch) {
      return { error: 'Incorrect password' }
    }

    const hashedPassword = await bcrypt.hash(values.newPassword, 10)

    values.password = hashedPassword
    values.newPassword = undefined
  }

  //   Update database
  await db.user.update({
    where: { id: dbUser.id },
    data: { ...values },
  })

  return { success: 'Settings updated successfully!' }
}
