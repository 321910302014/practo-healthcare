import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { AppContext } from '../context/AppContext'
import { toast } from 'react-toastify'

const MyAppointments = () => {

  const { backendUrl, token, getDoctorsData } = useContext(AppContext)

  const [appointments, setAppointments] = useState([])

  const getAppointments = async () => {
    try {

      const { data } = await axios.get(
        backendUrl + "/api/user/appointments",
        { headers: { token } }
      )

      if (data.success) {
        setAppointments(data.appointments.reverse())
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error("Error loading appointments")
    }
  }

  const cancelAppointment = async (appointmentId) => {
    try {

      const { data } = await axios.post(
        backendUrl + "/api/user/cancel-appointment",
        { appointmentId },
        { headers: { token } }
      )

      if (data.success) {
        toast.success(data.message)
        getAppointments()
        getDoctorsData()
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error("Error cancelling appointment")
    }
  }

  const appointmentStripe = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/user/payment-stripe',
        { appointmentId },
        { headers: { token } }
      )

      if (data.success) {
        const { session_url } = data
        window.location.replace(session_url)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error("Payment initiation failed")
    }
  }

  useEffect(() => {
    if (token) {
      getAppointments()
    }
  }, [token])

  return (
    <div>

      <p className='pb-3 mt-12 text-lg font-medium border-b'>
        My Appointments
      </p>

      <div className='mt-5 overflow-x-auto'>

        <table className='w-full text-sm text-left border-collapse'>
          <thead>
            <tr className='bg-gray-50 border-b'>
              <th className='px-4 py-3 font-semibold text-gray-700'>Doctor</th>
              <th className='px-4 py-3 font-semibold text-gray-700 hidden md:table-cell'>Speciality</th>
              <th className='px-4 py-3 font-semibold text-gray-700'>Address</th>
              <th className='px-4 py-3 font-semibold text-gray-700'>Date & Time</th>
              <th className='px-4 py-3 font-semibold text-gray-700 text-center'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-10 text-center text-gray-500">
                  No appointments found
                </td>
              </tr>
            ) : (
              appointments.map((item, index) => (
                <tr key={index} className='border-b hover:bg-gray-50 transition-all'>
                  <td className='px-4 py-4'>
                    <div className='flex items-center gap-3'>
                      <img
                        className='w-12 h-12 rounded-full bg-indigo-50 object-cover'
                        src={item.docData.image}
                        alt=""
                      />
                      <div>
                        <p className='font-medium text-gray-800 flex items-center gap-1'>
                          {item.docData.name}
                          {item.docData.verified && (
                            <img className='w-4' src={assets.verified_icon} alt="" />
                          )}
                        </p>
                        <p className='text-xs text-gray-500 md:hidden'>
                          {item.docData.speciality}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className='px-4 py-4 text-gray-600 hidden md:table-cell'>
                    {item.docData.speciality}
                  </td>
                  <td className='px-4 py-4 text-gray-600'>
                    <div className='text-xs'>
                      <p>{item.docData.address.line1}</p>
                      <p>{item.docData.address.line2}</p>
                    </div>
                  </td>
                  <td className='px-4 py-4 text-gray-600'>
                    <div className='flex flex-col'>
                      <span className='font-medium'>{item.slotDate.replace(/_/g, '/')}</span>
                      <span className='text-xs'>{item.slotTime}</span>
                    </div>
                  </td>
                  <td className='px-4 py-4 text-center'>
                    <div className='flex flex-col gap-2 min-w-32'>
                      {!item.cancelled && !item.isCompleted && !item.payment && (
                        <button
                          onClick={() => appointmentStripe(item._id)}
                          className='text-blue-600 hover:text-white border border-blue-600 hover:bg-blue-600 px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-300'
                        >
                          Pay Online
                        </button>
                      )}

                      {!item.cancelled && !item.isCompleted && (
                        <button
                          onClick={() => cancelAppointment(item._id)}
                          className='text-gray-500 hover:text-white border border-gray-300 hover:bg-red-500 hover:border-red-500 px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-300'
                        >
                          Cancel Appointment
                        </button>
                      )}

                      {item.cancelled && (
                        <span className='text-red-400 text-xs font-medium bg-red-50 px-3 py-1 rounded-md border border-red-100'>
                          Cancelled
                        </span>
                      )}

                      {item.payment && !item.isCompleted && (
                        <span className='text-green-600 text-xs font-medium bg-green-50 px-3 py-1 rounded-md border border-green-100'>
                          Paid
                        </span>
                      )}

                      {item.isCompleted && (
                        <span className='text-blue-500 text-xs font-medium bg-blue-50 px-3 py-1 rounded-md border border-blue-100'>
                          Completed
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

      </div>

    </div>
  )
}

export default MyAppointments