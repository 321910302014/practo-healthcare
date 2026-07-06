import axios from 'axios'
import React, { useContext, useState } from 'react'
import { DoctorContext } from '../context/DoctorContext'
import { AdminContext } from '../context/AdminContext'
import { toast } from 'react-toastify'
import { useNavigate } from "react-router-dom";

const Login = () => {

  const navigate = useNavigate();
  const [state, setState] = useState('Admin')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const backendUrl = import.meta.env.VITE_BACKEND_URL

  const { setDToken } = useContext(DoctorContext)
  const { setAToken } = useContext(AdminContext)

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    // Guard: without a backend URL the request would silently go nowhere.
    if (!backendUrl) {
      toast.error("VITE_BACKEND_URL is not set for this site. Add it in Render → Environment and redeploy.")
      return
    }

    setLoading(true)
    try {
      const endpoint = state === 'Admin' ? '/api/admin/login' : '/api/doctor/login'
      const { data } = await axios.post(backendUrl + endpoint, { email, password })

      if (data.success) {
        if (state === 'Admin') {
          setAToken(data.token)
          localStorage.setItem('aToken', data.token)
          navigate('/admin-dashboard')
        } else {
          setDToken(data.token)
          localStorage.setItem('dToken', data.token)
          navigate('/doctor-dashboard')
        }
        toast.success(`${state} login successful`)
      } else {
        toast.error(data.message || 'Login failed')
      }
    } catch (err) {
      // Surface the real reason instead of the button doing nothing.
      console.error('Login error:', err)
      const msg =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? `Cannot reach the server at ${backendUrl}. Check the backend is awake and VITE_BACKEND_URL is correct.`
          : err.message || 'Login failed')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
        <p className='text-2xl font-semibold m-auto'><span className='text-primary'>{state}</span> Login</p>
        <div className='w-full '>
          <p>Email</p>
          <input onChange={(e) => setEmail(e.target.value)} value={email} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="email" required />
        </div>
        <div className='w-full '>
          <p>Password</p>
          <input onChange={(e) => setPassword(e.target.value)} value={password} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="password" required />
        </div>
        <button disabled={loading} className='bg-primary text-white w-full py-2 rounded-md text-base disabled:opacity-60'>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {
          state === 'Admin'
            ? <p>Doctor Login? <span onClick={() => setState('Doctor')} className='text-primary underline cursor-pointer'>Click here</span></p>
            : <p>Admin Login? <span onClick={() => setState('Admin')} className='text-primary underline cursor-pointer'>Click here</span></p>
        }
      </div>
    </form>
  )
}

export default Login
