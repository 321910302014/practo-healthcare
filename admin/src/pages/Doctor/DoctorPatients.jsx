import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const DoctorPatients = () => {
  const { dToken, backendUrl } = useContext(DoctorContext)
  const { calculateAge } = useContext(AppContext)
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)

  const getPatients = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(
        backendUrl + '/api/doctor/patients',
        {
          headers: {
            Authorization: `Bearer ${dToken}`
          }
        }
      )
      if (data.success) {
        setPatients(data.patients)
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

  useEffect(() => {
    if (dToken) {
      getPatients()
    }
  }, [dToken])

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className='w-full max-w-6xl m-5'>
      <div className='flex justify-between items-center mb-5'>
        <p className='text-lg font-medium'>My Patients</p>
        <div className='flex items-center gap-2'>
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='px-4 py-2 border rounded-lg focus:outline-none focus:border-primary'
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className='flex flex-wrap gap-3 mb-5'>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100'>
          <img className='w-14' src={assets.patients_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{patients.length}</p>
            <p className='text-gray-400'>Total Patients</p>
          </div>
        </div>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100'>
          <img className='w-14' src={assets.appointments_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>
              {patients.filter(p => p.appointmentCount > 1).length}
            </p>
            <p className='text-gray-400'>Returning Patients</p>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className='bg-white border rounded text-sm max-h-[70vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_1.5fr_1fr_1fr_1fr_1fr] gap-1 py-3 px-6 border-b font-medium bg-gray-50'>
          <p>#</p>
          <p>Patient</p>
          <p>Email</p>
          <p>Phone</p>
          <p>Age</p>
          <p>Visits</p>
          <p>Action</p>
        </div>

        {loading ? (
          <div className='flex justify-center items-center py-10'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className='text-center py-10 text-gray-500'>
            No patients found
          </div>
        ) : (
          filteredPatients.map((patient, index) => (
            <div
              key={patient._id}
              className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1.5fr_1fr_1fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'
            >
              <p className='max-sm:hidden'>{index + 1}</p>
              <div className='flex items-center gap-2'>
                <img
                  src={patient.image || assets.patients_icon}
                  className='w-10 h-10 rounded-full object-cover border'
                  alt=""
                />
                <div>
                  <p className='font-medium text-gray-800'>{patient.name}</p>
                  <p className='text-xs text-gray-400'>{patient.gender || 'N/A'}</p>
                </div>
              </div>
              <p className='text-xs'>{patient.email}</p>
              <p>{patient.phone || 'N/A'}</p>
              <p>{patient.dob ? calculateAge(patient.dob) : 'N/A'}</p>
              <p className='text-center'>
                <span className='bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs'>
                  {patient.appointmentCount || 0}
                </span>
              </p>
              <button
                onClick={() => setSelectedPatient(patient)}
                className='px-3 py-1 bg-primary text-white rounded text-xs hover:bg-blue-700 transition-colors'
              >
                View Details
              </button>
            </div>
          ))
        )}
      </div>

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-semibold'>Patient Details</h3>
              <button
                onClick={() => setSelectedPatient(null)}
                className='text-gray-500 hover:text-gray-700 text-2xl'
              >
                &times;
              </button>
            </div>
            <div className='flex items-center gap-4 mb-4'>
              <img
                src={selectedPatient.image || assets.patients_icon}
                className='w-20 h-20 rounded-full object-cover border'
                alt=""
              />
              <div>
                <p className='text-xl font-medium'>{selectedPatient.name}</p>
                <p className='text-gray-500'>{selectedPatient.email}</p>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div className='bg-gray-50 p-3 rounded'>
                <p className='text-gray-400'>Phone</p>
                <p className='font-medium'>{selectedPatient.phone || 'N/A'}</p>
              </div>
              <div className='bg-gray-50 p-3 rounded'>
                <p className='text-gray-400'>Gender</p>
                <p className='font-medium'>{selectedPatient.gender || 'N/A'}</p>
              </div>
              <div className='bg-gray-50 p-3 rounded'>
                <p className='text-gray-400'>Date of Birth</p>
                <p className='font-medium'>{selectedPatient.dob || 'N/A'}</p>
              </div>
              <div className='bg-gray-50 p-3 rounded'>
                <p className='text-gray-400'>Total Visits</p>
                <p className='font-medium'>{selectedPatient.appointmentCount || 0}</p>
              </div>
              <div className='bg-gray-50 p-3 rounded col-span-2'>
                <p className='text-gray-400'>Address</p>
                <p className='font-medium'>
                  {selectedPatient.address?.line1 || ''} {selectedPatient.address?.line2 || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorPatients
