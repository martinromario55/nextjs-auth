'use client'
import React, { useCallback, useEffect, useState } from 'react'
import CardWrapper from './card-wrapper'
import { BeatLoader } from 'react-spinners'
import { useSearchParams } from 'next/navigation'
import { newVerification } from '@/actions/new-verification'
import FormError from '../form-error'
import FormSuccess from '../form-success'

const NewVerificationForm = () => {
  const [error, setError] = useState<string | undefined>()
  const [success, setSuccess] = useState<string | undefined>()
  const searchParams = useSearchParams()

  const token = searchParams.get('token')

  const onSubmit = useCallback(() => {
    // console.log(token)
    if (success || error) return

    if (!token) {
      setError('Missing Token')
      return
    }

    newVerification(token)
      .then(data => {
        setError(data.error)
        setSuccess(data.success)
      })
      .catch(() => {
        setError('Something went wrong')
      })
  }, [token, success, error])

  useEffect(() => {
    onSubmit()
  }, [onSubmit])
  return (
    <CardWrapper
      headerLabel="Confirming your verification"
      backButtonLabel="Back to login"
      backButtonHref="/auth/login"
    >
      <div className="flex items-center w-full justify-center">
        {!success && !error && <BeatLoader size={20} />}
        <FormSuccess message={success} />
        {!success && <FormError message={error} />}
      </div>
    </CardWrapper>
  )
}

export default NewVerificationForm
