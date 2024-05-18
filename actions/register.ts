'use server'
import { RegisterSchema } from '@/schemas'
import * as z from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { getUserByEmail } from '@/data/user'
import { generateVerificationToken } from '@/lib/tokens'
import { sendVerificationEmail } from '@/lib/mail'

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  //   console.log(values)
  const validatedFields = RegisterSchema.safeParse(values)

  if (!validatedFields.success) {
    return { error: 'Invalid fields' }
  }

  const { email, password, name } = validatedFields.data

  // hash password with bcrypt
  const hashedPassword = await bcrypt.hash(password, 10)

  // Check if user already exists in the database
  // const existingUser = await db.user.findUnique({
  //   where: {
  //     email,
  //   },
  // })
  const existingUser = await getUserByEmail(email)

  if (existingUser) {
    return { error: 'User with same email already exists' }
  }

  // Create new user
  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  })

  // Create Verification token
  const verificationToken = await generateVerificationToken(email)

  // Send verification token email
  await sendVerificationEmail(verificationToken.email, verificationToken.token)

  return { success: 'Confirmation email sent!' }
}
