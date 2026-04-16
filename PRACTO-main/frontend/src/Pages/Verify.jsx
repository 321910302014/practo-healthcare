import React, { useContext, useEffect, useRef } from 'react'
import axios from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { AppContext } from '../context/AppContext'

const Verify = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { backendUrl, token } = useContext(AppContext)

  const hasRunRef = useRef(false)

  const success = searchParams.get('success')
  const appointmentId = searchParams.get('appointmentId')

  useEffect(() => {
    if (hasRunRef.current) return
    hasRunRef.current = true

    const verify = async () => {
      if (!token) {
        toast.warn('Please log in to verify your payment')
        navigate('/login', { replace: true })
        return
      }

      if (!appointmentId || !success) {
        navigate('/my-appointments', { replace: true })
        return
      }

      try {
        const { data } = await axios.post(
          backendUrl + '/api/user/verify-stripe',
          { success, appointmentId },
          { headers: { token } }
        )

        if (data.success) {
          toast.success(data.message || 'Payment successful')
        } else {
          toast.error(data.message || 'Payment verification failed')
        }
      } catch (error) {
        console.error(error)
        toast.error(error.response?.data?.message || 'Payment verification failed')
      } finally {
        navigate('/my-appointments', { replace: true })
      }
    }

    verify()
  }, [appointmentId, success, token, backendUrl, navigate])

  return (
    <div className='flex flex-col items-center justify-center min-h-[60vh]'>
      <div className='w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4'></div>
      <p className='text-gray-600 font-medium'>Verifying your payment…</p>
    </div>
  )
}

export default Verify
