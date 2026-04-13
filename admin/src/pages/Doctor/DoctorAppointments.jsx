import { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import DoctorChat from '../../components/DoctorChat'

const DoctorAppointments = () => {

  const { dToken, appointments, getAppointments, cancelAppointment, completeAppointment, uploadReport } = useContext(DoctorContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  const [openChatId, setOpenChatId] = useState(null)

  const handleUploadReport = async (item, file) => {
    if (!file) return

    const formData = new FormData()
    formData.append('report', file)
    formData.append('userId', item.userId)
    formData.append('type', 'prescription') // Default type

    const success = await uploadReport(formData)
    if (success) {
      getAppointments()
    }
  }

  useEffect(() => {
    if (dToken) {
      console.log("Doctor token:", dToken)
      getAppointments()
    }
  }, [dToken])

  return (
    <div className='w-full max-w-6xl m-5 '>

      <p className='mb-3 text-lg font-medium'>All Appointments</p>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr_1fr] gap-1 py-3 px-6 border-b font-medium'>
          <p>#</p>
          <p>Patient</p>
          <p>Payment</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Fees</p>
          <p>Report</p>
          <p>Action</p>
        </div>
        {appointments.map((item, index) => (
          <React.Fragment key={index}>
            <div className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'>
              <p className='max-sm:hidden'>{index + 1}</p>
              <div className='flex items-center gap-2'>
                <img src={item.userData.image} className='w-8 h-8 rounded-full object-cover' alt="" /> <p>{item.userData.name}</p>
              </div>
              <div>
                <p className='text-xs inline border border-primary px-2 rounded-full'>
                  {item.payment ? 'Online' : 'CASH'}
                </p>
              </div>
              <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>
              <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
              <p>{currency}{item.amount}</p>

              <div className='flex items-center'>
                <label className='cursor-pointer flex items-center gap-1 text-primary hover:text-blue-700 font-medium'>
                  <input
                    type="file"
                    className='hidden'
                    onChange={(e) => handleUploadReport(item, e.target.files[0])}
                    disabled={item.cancelled}
                  />
                  <img className='w-5' src={assets.upload_icon} alt="" />
                  <span className='max-sm:hidden'>Upload</span>
                </label>
              </div>

              {item.cancelled
                ? <p className='text-red-400 text-xs font-medium'>Cancelled</p>
                : item.isCompleted
                  ? <p className='text-green-500 text-xs font-medium'>Completed</p>
                  : <div className='flex items-center gap-2'>
                    <img onClick={() => cancelAppointment(item._id)} className='w-8 cursor-pointer hover:scale-110 transition-transform' src={assets.cancel_icon} alt="" />
                    <img onClick={() => completeAppointment(item._id)} className='w-8 cursor-pointer hover:scale-110 transition-transform' src={assets.tick_icon} alt="" />
                    <button
                      onClick={() => setOpenChatId(openChatId === item._id ? null : item._id)}
                      className="px-2 py-1 bg-blue-500 text-white text-[10px] rounded"
                    >
                      {openChatId === item._id ? 'Close' : 'Chat'}
                    </button>
                  </div>
              }
            </div>
            {openChatId === item._id && (
              <div className="col-span-full bg-gray-50 p-4 border-b">
                <DoctorChat appointmentId={item._id} doctorId={item.docId} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

    </div>
  )
}

export default DoctorAppointments