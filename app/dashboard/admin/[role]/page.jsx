import React from 'react'
import { useAuth } from '../../../context/AuthContext'

const page = () => {
  const { user } = useAuth();
  return (
    <div>Dashboard user.role</div>
  )
}

export default page