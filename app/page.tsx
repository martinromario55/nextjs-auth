import { Button } from '@/components/ui/button'
import React from 'react'

const Home = () => {
  return (
    <div>
      <h1 className="font-bold text-green-500">Hello World!</h1>
      <Button size={'lg'} variant={'custom'}>
        Click
      </Button>
    </div>
  )
}

export default Home
