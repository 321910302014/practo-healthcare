import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const DoctorSettings = () => {
  const { dToken, setDToken, backendUrl, profileData, getProfileData } = useContext(DoctorContext)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('account')

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    appointmentReminders: true,
    patientMessages: true,
    marketingEmails: false
  })

  const [privacySettings, setPrivacySettings] = useState({
    showProfile: true,
    showReviews: true,
    allowVideoConsultation: true
  })

  useEffect(() => {
    if (dToken) {
      getProfileData()
    }
  }, [dToken])

  const handlePasswordChange = async (e) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    try {
      setLoading(true)
      const { data } = await axios.post(
        backendUrl + '/api/doctor/change-password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${dToken}`
          }
        }
      )
      if (data.success) {
        toast.success('Password changed successfully')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
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

  const handleNotificationSave = async () => {
    try {
      setLoading(true)
      const { data } = await axios.post(
        backendUrl + '/api/doctor/update-notifications',
        notificationSettings,
        {
          headers: {
            Authorization: `Bearer ${dToken}`
          }
        }
      )
      if (data.success) {
        toast.success('Notification settings saved')
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

  const handlePrivacySave = async () => {
    try {
      setLoading(true)
      const { data } = await axios.post(
        backendUrl + '/api/doctor/update-privacy',
        privacySettings,
        {
          headers: {
            Authorization: `Bearer ${dToken}`
          }
        }
      )
      if (data.success) {
        toast.success('Privacy settings saved')
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

  const handleLogout = () => {
    localStorage.removeItem('dToken')
    setDToken('')
    toast.success('Logged out successfully')
  }

  const tabs = [
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'password', label: 'Password', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy', icon: '🛡️' }
  ]

  return (
    <div className='w-full max-w-4xl m-5'>
      <div className='mb-5'>
        <p className='text-lg font-medium'>Settings</p>
        <p className='text-sm text-gray-500'>Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className='flex gap-2 mb-5 border-b'>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className='mr-2'>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className='bg-white rounded border p-6'>
          <h3 className='font-medium mb-4'>Account Information</h3>

          {profileData && (
            <div className='space-y-4'>
              <div className='flex items-center gap-4 mb-6'>
                <img
                  src={profileData.image || assets.doctor_icon}
                  className='w-20 h-20 rounded-full object-cover border'
                  alt=""
                />
                <div>
                  <p className='font-medium text-lg'>{profileData.name}</p>
                  <p className='text-gray-500'>{profileData.speciality}</p>
                  <p className='text-sm text-gray-400'>{profileData.email}</p>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='bg-gray-50 p-4 rounded'>
                  <p className='text-sm text-gray-500'>Experience</p>
                  <p className='font-medium'>{profileData.experience}</p>
                </div>
                <div className='bg-gray-50 p-4 rounded'>
                  <p className='text-sm text-gray-500'>Consultation Fee</p>
                  <p className='font-medium'>${profileData.fees}</p>
                </div>
                <div className='bg-gray-50 p-4 rounded'>
                  <p className='text-sm text-gray-500'>Degree</p>
                  <p className='font-medium'>{profileData.degree}</p>
                </div>
                <div className='bg-gray-50 p-4 rounded'>
                  <p className='text-sm text-gray-500'>Status</p>
                  <p className={`font-medium ${profileData.available ? 'text-green-600' : 'text-red-600'}`}>
                    {profileData.available ? 'Available' : 'Not Available'}
                  </p>
                </div>
              </div>

              <div className='pt-4 border-t'>
                <button
                  onClick={handleLogout}
                  className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors'
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className='bg-white rounded border p-6'>
          <h3 className='font-medium mb-4'>Change Password</h3>

          <form onSubmit={handlePasswordChange} className='max-w-md space-y-4'>
            <div>
              <label className='block text-sm font-medium mb-2'>Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                className='w-full px-3 py-2 border rounded focus:outline-none focus:border-primary'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-2'>New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                className='w-full px-3 py-2 border rounded focus:outline-none focus:border-primary'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-2'>Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                className='w-full px-3 py-2 border rounded focus:outline-none focus:border-primary'
                required
              />
            </div>
            <button
              type='submit'
              disabled={loading}
              className='px-6 py-2 bg-primary text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50'
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className='bg-white rounded border p-6'>
          <h3 className='font-medium mb-4'>Notification Preferences</h3>

          <div className='space-y-4'>
            {Object.entries({
              emailNotifications: 'Email Notifications',
              appointmentReminders: 'Appointment Reminders',
              patientMessages: 'Patient Messages',
              marketingEmails: 'Marketing Emails'
            }).map(([key, label]) => (
              <div key={key} className='flex items-center justify-between py-3 border-b'>
                <div>
                  <p className='font-medium'>{label}</p>
                  <p className='text-sm text-gray-500'>
                    {key === 'emailNotifications' && 'Receive important updates via email'}
                    {key === 'appointmentReminders' && 'Get reminders before appointments'}
                    {key === 'patientMessages' && 'Notifications for new patient messages'}
                    {key === 'marketingEmails' && 'Receive promotional content and news'}
                  </p>
                </div>
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input
                    type="checkbox"
                    checked={notificationSettings[key]}
                    onChange={() => setNotificationSettings(prev => ({
                      ...prev,
                      [key]: !prev[key]
                    }))}
                    className='sr-only peer'
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            ))}

            <button
              onClick={handleNotificationSave}
              disabled={loading}
              className='px-6 py-2 bg-primary text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50'
            >
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      )}

      {/* Privacy Tab */}
      {activeTab === 'privacy' && (
        <div className='bg-white rounded border p-6'>
          <h3 className='font-medium mb-4'>Privacy Settings</h3>

          <div className='space-y-4'>
            {Object.entries({
              showProfile: 'Public Profile',
              showReviews: 'Show Reviews',
              allowVideoConsultation: 'Allow Video Consultations'
            }).map(([key, label]) => (
              <div key={key} className='flex items-center justify-between py-3 border-b'>
                <div>
                  <p className='font-medium'>{label}</p>
                  <p className='text-sm text-gray-500'>
                    {key === 'showProfile' && 'Allow patients to view your profile'}
                    {key === 'showReviews' && 'Display patient reviews on your profile'}
                    {key === 'allowVideoConsultation' && 'Enable video consultation bookings'}
                  </p>
                </div>
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input
                    type="checkbox"
                    checked={privacySettings[key]}
                    onChange={() => setPrivacySettings(prev => ({
                      ...prev,
                      [key]: !prev[key]
                    }))}
                    className='sr-only peer'
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            ))}

            <button
              onClick={handlePrivacySave}
              disabled={loading}
              className='px-6 py-2 bg-primary text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50'
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorSettings
