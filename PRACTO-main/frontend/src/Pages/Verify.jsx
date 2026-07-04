import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../context/AppContext'

const Verify = () => {
  const [searchParams] = useSearchParams()
  const success = searchParams.get('success')      // "true" | "false" (string)
  const appointmentId = searchParams.get('appointmentId')

  const { backendUrl, token } = useContext(AppContext)
  const navigate = useNavigate()

  const [status, setStatus] = useState('processing') // 'processing' | 'paid' | 'cancelled' | 'error'
  const ran = useRef(false)

  const verifyPayment = async () => {
    // User cancelled / pressed back on Stripe — nothing was charged.
    if (success !== 'true') {
      setStatus('cancelled')
      toast.info('Payment cancelled. You can complete it anytime from My Appointments.')
      return
    }

    if (!appointmentId) {
      setStatus('error')
      toast.error('Missing appointment reference.')
      return
    }

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/verify-stripe`,
        { appointmentId, success },
        { headers: { token } }
      )

      if (data.success) {
        setStatus('paid')
        toast.success('Payment successful! Your appointment is confirmed.')
      } else {
        setStatus('error')
        toast.error(data.message || 'Could not verify payment.')
      }
    } catch (error) {
      console.error('verify-stripe error:', error)
      setStatus('error')
      toast.error(error.response?.data?.message || 'Could not verify payment.')
    }
  }

  useEffect(() => {
    if (ran.current) return // guard against React StrictMode double-invoke
    ran.current = true
    verifyPayment().finally(() => {
      // Send the user back to their appointments shortly after.
      setTimeout(() => navigate('/my-appointments', { replace: true }), 1800)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const view = {
    processing: { icon: '⏳', title: 'Verifying your payment...', sub: 'Please wait a moment.' },
    paid: { icon: '✅', title: 'Payment Successful', sub: 'Your appointment is confirmed. Redirecting...' },
    cancelled: { icon: '↩️', title: 'Payment Cancelled', sub: 'No charge was made. Redirecting to your appointments...' },
    error: { icon: '⚠️', title: 'Payment Not Verified', sub: 'Something went wrong. Redirecting to your appointments...' },
  }[status]

  return (
    <div className='min-h-[70vh] flex items-center justify-center'>
      <div className='flex flex-col items-center gap-3 p-10 border rounded-2xl shadow-lg bg-white text-center max-w-md'>
        {status === 'processing' ? (
          <div className='w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2'></div>
        ) : (
          <div className='text-5xl mb-1'>{view.icon}</div>
        )}
        <h2 className='text-2xl font-semibold text-gray-800'>{view.title}</h2>
        <p className='text-gray-500'>{view.sub}</p>
        <button
          onClick={() => navigate('/my-appointments', { replace: true })}
          className='mt-3 px-6 py-2 bg-primary text-white rounded-md text-sm'
        >
          Go to My Appointments
        </button>
      </div>
    </div>
  )
}

export default Verify
