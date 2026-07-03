import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const DoctorSchedule = () => {
  const { dToken, backendUrl, profileData, getProfileData } = useContext(DoctorContext)
  const [schedule, setSchedule] = useState({
    monday: { enabled: true, slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'] },
    tuesday: { enabled: true, slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'] },
    wednesday: { enabled: true, slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'] },
    thursday: { enabled: true, slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'] },
    friday: { enabled: true, slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'] },
    saturday: { enabled: false, slots: [] },
    sunday: { enabled: false, slots: [] }
  })
  const [loading, setLoading] = useState(false)
  const [newSlot, setNewSlot] = useState('')
  const [selectedDay, setSelectedDay] = useState('monday')

  const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
    '06:00 PM', '07:00 PM', '08:00 PM'
  ]

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  useEffect(() => {
    if (dToken) {
      getProfileData()
    }
  }, [dToken])

  const toggleDay = (day) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
        slots: !prev[day].enabled ? prev[day].slots : []
      }
    }))
  }

  const addSlot = (day, slot) => {
    if (schedule[day].slots.includes(slot)) {
      toast.error('Slot already exists')
      return
    }
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, slot].sort((a, b) => {
          const timeA = new Date(`2000/01/01 ${a}`)
          const timeB = new Date(`2000/01/01 ${b}`)
          return timeA - timeB
        })
      }
    }))
  }

  const removeSlot = (day, slot) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter(s => s !== slot)
      }
    }))
  }

  const saveSchedule = async () => {
    try {
      setLoading(true)
      const { data } = await axios.post(
        backendUrl + '/api/doctor/update-schedule',
        { schedule },
        {
          headers: {
            Authorization: `Bearer ${dToken}`
          }
        }
      )
      if (data.success) {
        toast.success('Schedule updated successfully')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToAllDays = (sourceDay) => {
    const sourceSlots = schedule[sourceDay].slots
    setSchedule(prev => {
      const newSchedule = { ...prev }
      days.forEach(day => {
        if (day !== sourceDay && prev[day].enabled) {
          newSchedule[day] = {
            ...prev[day],
            slots: [...sourceSlots]
          }
        }
      })
      return newSchedule
    })
    toast.success(`Copied ${sourceDay} schedule to all enabled days`)
  }

  return (
    <div className='w-full max-w-6xl m-5'>
      <div className='flex justify-between items-center mb-5'>
        <div>
          <p className='text-lg font-medium'>Schedule Management</p>
          <p className='text-sm text-gray-500'>Manage your weekly availability</p>
        </div>
        <button
          onClick={saveSchedule}
          disabled={loading}
          className='px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50'
        >
          {loading ? 'Saving...' : 'Save Schedule'}
        </button>
      </div>

      {/* Availability Status */}
      {profileData && (
        <div className='bg-white p-4 rounded border mb-5'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className={`w-3 h-3 rounded-full ${profileData.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className='font-medium'>
                Status: {profileData.available ? 'Available for Appointments' : 'Not Available'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Schedule */}
      <div className='bg-white rounded border'>
        <div className='p-4 border-b'>
          <p className='font-medium'>Weekly Schedule</p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 p-4'>
          {days.map(day => (
            <div key={day} className={`border rounded-lg p-4 ${!schedule[day].enabled ? 'bg-gray-50' : ''}`}>
              <div className='flex justify-between items-center mb-3'>
                <div className='flex items-center gap-3'>
                  <label className='relative inline-flex items-center cursor-pointer'>
                    <input
                      type="checkbox"
                      checked={schedule[day].enabled}
                      onChange={() => toggleDay(day)}
                      className='sr-only peer'
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <span className='font-medium capitalize'>{day}</span>
                </div>
                {schedule[day].enabled && (
                  <button
                    onClick={() => copyToAllDays(day)}
                    className='text-xs text-primary hover:underline'
                  >
                    Copy to all days
                  </button>
                )}
              </div>

              {schedule[day].enabled && (
                <>
                  <div className='flex flex-wrap gap-2 mb-3'>
                    {schedule[day].slots.map(slot => (
                      <span
                        key={slot}
                        className='bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm flex items-center gap-2'
                      >
                        {slot}
                        <button
                          onClick={() => removeSlot(day, slot)}
                          className='text-blue-400 hover:text-red-500'
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className='flex gap-2'>
                    <select
                      className='flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:border-primary'
                      onChange={(e) => {
                        if (e.target.value) {
                          addSlot(day, e.target.value)
                          e.target.value = ''
                        }
                      }}
                    >
                      <option value="">Add time slot...</option>
                      {timeSlots.filter(slot => !schedule[day].slots.includes(slot)).map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className='bg-white rounded border mt-5 p-4'>
        <p className='font-medium mb-3'>Quick Actions</p>
        <div className='flex flex-wrap gap-3'>
          <button
            onClick={() => {
              days.forEach(day => {
                setSchedule(prev => ({
                  ...prev,
                  [day]: { ...prev[day], enabled: true }
                }))
              })
            }}
            className='px-4 py-2 border border-primary text-primary rounded hover:bg-primary hover:text-white transition-colors text-sm'
          >
            Enable All Days
          </button>
          <button
            onClick={() => {
              setSchedule(prev => {
                const newSchedule = { ...prev }
                days.forEach(day => {
                  newSchedule[day] = { ...prev[day], enabled: day !== 'saturday' && day !== 'sunday' }
                })
                return newSchedule
              })
            }}
            className='px-4 py-2 border border-primary text-primary rounded hover:bg-primary hover:text-white transition-colors text-sm'
          >
            Weekdays Only
          </button>
          <button
            onClick={() => {
              setSchedule(prev => {
                const newSchedule = { ...prev }
                days.forEach(day => {
                  if (prev[day].enabled) {
                    newSchedule[day] = {
                      ...prev[day],
                      slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM']
                    }
                  }
                })
                return newSchedule
              })
            }}
            className='px-4 py-2 border border-green-500 text-green-500 rounded hover:bg-green-500 hover:text-white transition-colors text-sm'
          >
            Set Default Slots
          </button>
        </div>
      </div>
    </div>
  )
}

export default DoctorSchedule
