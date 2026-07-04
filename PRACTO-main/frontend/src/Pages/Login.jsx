import axios from 'axios'
import { useContext, useState } from 'react'
import { toast } from 'react-toastify'
import { AppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

export const Login = () => {

  const { backendUrl, setToken } = useContext(AppContext)
  const navigate = useNavigate()

  // 'login' | 'signup' | 'otp'
  const [mode, setMode] = useState('login')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  // ---- LOGIN ----
  const handleLogin = async () => {
    const { data } = await axios.post(`${backendUrl}/api/user/login`, { email, password })

    if (data.success) {
      localStorage.setItem('token', data.token)
      setToken(data.token)
      toast.success('Login Successful')
      navigate('/', { replace: true })
      return
    }

    // Account exists but email isn't verified yet -> send a fresh OTP and go to verify step
    if (data.message && data.message.toLowerCase().includes('verif')) {
      toast.info('Your email is not verified yet. We just sent you a new OTP.')
      await sendFreshOtp()
      setOtp('')
      setMode('otp')
      return
    }

    toast.error(data.message)
  }

  // ---- SIGNUP ----
  const handleSignup = async () => {
    const { data } = await axios.post(`${backendUrl}/api/user/register`, { name, email, password })

    if (data.success) {
      toast.success('OTP sent to your email. Enter it below to verify your account.')
      setOtp('')
      setMode('otp')
    } else {
      toast.error(data.message)
    }
  }

  // ---- VERIFY OTP ----
  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      toast.warning('Please enter the OTP from your email.')
      return
    }

    const { data } = await axios.post(`${backendUrl}/api/user/verify-otp`, {
      email,
      otp: otp.trim(),
    })

    if (data.success) {
      toast.success('Email verified! Please log in.')
      setOtp('')
      setPassword('')
      setMode('login')
    } else {
      toast.error(data.message)
    }
  }

  // ---- RESEND OTP ----
  const sendFreshOtp = async () => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/send-otp`, { email })
      if (!data.success) toast.error(data.message)
      return data.success
    } catch (e) {
      console.log(e)
      toast.error('Could not send OTP')
      return false
    }
  }

  const handleResendOtp = async () => {
    setLoading(true)
    const ok = await sendFreshOtp()
    if (ok) toast.success('A new OTP has been sent to your email.')
    setLoading(false)
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') await handleLogin()
      else if (mode === 'signup') await handleSignup()
      else if (mode === 'otp') await handleVerifyOtp()
    } catch (error) {
      console.log(error)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const title = mode === 'login' ? 'Login' : mode === 'signup' ? 'Create Account' : 'Verify Your Email'
  const submitLabel = mode === 'login' ? 'Login' : mode === 'signup' ? 'Create Account' : 'Verify & Continue'

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>

      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl shadow-lg'>

        <p className='text-2xl font-semibold'>{title}</p>

        <p>
          {mode === 'login' && 'Please log in to book appointment'}
          {mode === 'signup' && 'Create a new account'}
          {mode === 'otp' && (
            <>We sent a 6-digit code to <span className='font-medium text-primary'>{email}</span>. Enter it below to activate your account.</>
          )}
        </p>

        {/* Name — signup only */}
        {mode === 'signup' && (
          <div className='w-full'>
            <p>Name</p>
            <input
              onChange={(e) => setName(e.target.value)}
              value={name}
              className='border rounded w-full p-2 mt-1'
              type='text'
              required
            />
          </div>
        )}

        {/* Email + Password — login & signup */}
        {mode !== 'otp' && (
          <>
            <div className='w-full'>
              <p>Email</p>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className='border rounded w-full p-2 mt-1'
                type='email'
                required
              />
            </div>

            <div className='w-full'>
              <p>Password</p>
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className='border rounded w-full p-2 mt-1'
                type='password'
                required
              />
            </div>
          </>
        )}

        {/* OTP entry — otp step only */}
        {mode === 'otp' && (
          <div className='w-full'>
            <p>Enter OTP</p>
            <input
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              value={otp}
              className='border rounded w-full p-2 mt-1 tracking-[0.5em] text-center text-lg'
              type='text'
              inputMode='numeric'
              maxLength={6}
              placeholder='______'
              autoFocus
              required
            />
            <div className='flex items-center justify-between w-full mt-2 text-sm'>
              <span
                onClick={() => !loading && handleResendOtp()}
                className='underline cursor-pointer text-primary'
              >
                Resend OTP
              </span>
              <span
                onClick={() => { setMode('signup'); setOtp('') }}
                className='underline cursor-pointer text-gray-500'
              >
                Change email
              </span>
            </div>
          </div>
        )}

        <button
          type='submit'
          disabled={loading}
          className='w-full py-2 my-2 text-white rounded bg-primary disabled:opacity-60'
        >
          {loading ? 'Please wait...' : submitLabel}
        </button>

        {/* Footer toggle */}
        {mode === 'login' && (
          <p>
            Create a new account?
            <span
              onClick={() => { setMode('signup'); setPassword('') }}
              className='ml-1 underline cursor-pointer text-primary'
            >
              Click here
            </span>
          </p>
        )}

        {mode === 'signup' && (
          <p>
            Already have an account?
            <span
              onClick={() => setMode('login')}
              className='ml-1 underline cursor-pointer text-primary'
            >
              Login
            </span>
          </p>
        )}

        {mode === 'otp' && (
          <p>
            Already verified?
            <span
              onClick={() => { setMode('login'); setOtp('') }}
              className='ml-1 underline cursor-pointer text-primary'
            >
              Back to Login
            </span>
          </p>
        )}

      </div>
    </form>
  )
}

export default Login
