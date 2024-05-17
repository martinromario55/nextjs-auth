'use server'
import { RegisterSchema } from '@/schemas'
import * as z from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { getUserByEmail } from '@/data/user'

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

  // TODO: Send verification token email

  return { success: 'User created successfully!' }
}
