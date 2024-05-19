'use server'
import { signIn } from '@/auth'
import { getTwoFactorConfirmationByUserId } from '@/data/two-factor-confirmation'
import { getTwoFactorTokenByEmail } from '@/data/two-factor-token'
import { getUserByEmail } from '@/data/user'
import { db } from '@/lib/db'
import { sendTwoFactorTokenEmail, sendVerificationEmail } from '@/lib/mail'
import { generateTwoFactorToken, generateVerificationToken } from '@/lib/tokens'
import { DEFAULT_LOGIN_REDIRECT } from '@/routes'
import { LoginSchema } from '@/schemas'
import { AuthError } from 'next-auth'
import * as z from 'zod'

export const login = async (values: z.infer<typeof LoginSchema>) => {
  //   console.log(values)
  const validatedFields = LoginSchema.safeParse(values)

  if (!validatedFields.success) {
    return { error: 'Invalid fields' }
  }

  const { email, password, code } = validatedFields.data

  // Get current user
  const existingUser = await getUserByEmail(email)

  // Check if user exists and password is correct
  if (!existingUser || !existingUser.email || !existingUser.password) {
    return { error: 'Invalid credentials!' }
  }

  // Check if user's email is verified
  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(
      existingUser.email
    )

    // Send verification email
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    )

    return { success: 'Confirmation email sent' }
  }

  // Check if 2FA is enabled
  if (existingUser.isTwoFactorEnabled && existingUser.email) {
    if (code) {
      // Verify code
      const twoFactorToken = await getTwoFactorTokenByEmail(existingUser.email)

      // Check if code exists
      if (!twoFactorToken) {
        return { error: 'Invalid code' }
      }

      // Check if code is correct
      if (twoFactorToken.token !== code) {
        return { error: 'Invalid code' }
      }

      // Check if code has expired
      const hasExpired = new Date(twoFactorToken.expires) < new Date()

      if (hasExpired) {
        return { error: 'Code expired' }
      }

      // Delete two factor token
      await db.twoFactorToken.delete({
        where: {
          id: twoFactorToken.id,
        },
      })

      // Delete two factor confirmation
      const existingConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id)

      if (existingConfirmation) {
        await db.twoFactorConfirmation.delete({
          where: {
            id: existingConfirmation.id,
          },
        })
      }

      // Create new 2FA
      await db.twoFactorConfirmation.create({
        data: {
          userId: existingUser.id,
        },
      })
    } else {
      const twoFactorToken = await generateTwoFactorToken(existingUser.email)
      await sendTwoFactorTokenEmail(twoFactorToken.email, twoFactorToken.token)

      return { twoFactor: true }
    }
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid credentials!' }
        default:
          return { error: 'Something went wrong!' }
      }
    }
    throw error
  }
}
