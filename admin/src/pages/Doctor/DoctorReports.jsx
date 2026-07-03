import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const DoctorReports = () => {
  const { dToken, backendUrl } = useContext(DoctorContext)
  const { slotDateFormat } = useContext(AppContext)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [uploadModal, setUploadModal] = useState(false)
  const [uploadData, setUploadData] = useState({
    patientId: '',
    type: 'prescription',
    file: null
  })
  const [patients, setPatients] = useState([])

  const reportTypes = ['all', 'prescription', 'lab_report', 'imaging', 'other']

  const getReports = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(
        backendUrl + '/api/doctor/reports',
        {
          headers: {
            Authorization: `Bearer ${dToken}`
          }
        }
      )
      if (data.success) {
        setReports(data.reports)
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

  const getPatients = async () => {
    try {
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
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (dToken) {
      getReports()
      getPatients()
    }
  }, [dToken])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadData.file || !uploadData.patientId) {
      toast.error('Please select a patient and file')
      return
    }

    const formData = new FormData()
    formData.append('report', uploadData.file)
    formData.append('userId', uploadData.patientId)
    formData.append('type', uploadData.type)

    try {
      const { data } = await axios.post(
        backendUrl + '/api/reports/upload',
        formData,
        {
          headers: {
            Authorization: `Bearer ${dToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      if (data.success) {
        toast.success('Report uploaded successfully')
        setUploadModal(false)
        setUploadData({ patientId: '', type: 'prescription', file: null })
        getReports()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const filteredReports = reports.filter(report => {
    const matchesType = filterType === 'all' || report.type === filterType
    const matchesSearch = report.userData?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  const getTypeColor = (type) => {
    const colors = {
      prescription: 'bg-blue-100 text-blue-600',
      lab_report: 'bg-green-100 text-green-600',
      imaging: 'bg-purple-100 text-purple-600',
      other: 'bg-gray-100 text-gray-600'
    }
    return colors[type] || colors.other
  }

  return (
    <div className='w-full max-w-6xl m-5'>
      <div className='flex justify-between items-center mb-5'>
        <div>
          <p className='text-lg font-medium'>Medical Reports</p>
          <p className='text-sm text-gray-500'>View and manage patient reports</p>
        </div>
        <button
          onClick={() => setUploadModal(true)}
          className='px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2'
        >
          <img className='w-4 invert' src={assets.add_icon} alt="" />
          Upload Report
        </button>
      </div>

      {/* Stats */}
      <div className='flex flex-wrap gap-3 mb-5'>
        <div className='flex items-center gap-2 bg-white p-4 min-w-40 rounded border-2 border-gray-100'>
          <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
            <span className='text-blue-600 font-bold'>{reports.length}</span>
          </div>
          <p className='text-gray-500 text-sm'>Total Reports</p>
        </div>
        <div className='flex items-center gap-2 bg-white p-4 min-w-40 rounded border-2 border-gray-100'>
          <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
            <span className='text-green-600 font-bold'>
              {reports.filter(r => r.type === 'prescription').length}
            </span>
          </div>
          <p className='text-gray-500 text-sm'>Prescriptions</p>
        </div>
        <div className='flex items-center gap-2 bg-white p-4 min-w-40 rounded border-2 border-gray-100'>
          <div className='w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center'>
            <span className='text-purple-600 font-bold'>
              {reports.filter(r => r.type === 'lab_report').length}
            </span>
          </div>
          <p className='text-gray-500 text-sm'>Lab Reports</p>
        </div>
      </div>

      {/* Filters */}
      <div className='bg-white p-4 rounded border mb-5'>
        <div className='flex flex-wrap gap-4 items-center'>
          <input
            type="text"
            placeholder="Search by patient name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='px-4 py-2 border rounded-lg focus:outline-none focus:border-primary flex-1 min-w-[200px]'
          />
          <div className='flex gap-2'>
            {reportTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-full text-sm capitalize ${
                  filterType === type
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className='bg-white border rounded text-sm max-h-[60vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_1.5fr_1fr_1fr_1fr] gap-1 py-3 px-6 border-b font-medium bg-gray-50'>
          <p>#</p>
          <p>Patient</p>
          <p>Report Type</p>
          <p>Date</p>
          <p>Status</p>
          <p>Action</p>
        </div>

        {loading ? (
          <div className='flex justify-center items-center py-10'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className='text-center py-10 text-gray-500'>
            No reports found
          </div>
        ) : (
          filteredReports.map((report, index) => (
            <div
              key={report._id}
              className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1.5fr_1fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'
            >
              <p className='max-sm:hidden'>{index + 1}</p>
              <div className='flex items-center gap-2'>
                <img
                  src={report.userData?.image || assets.patients_icon}
                  className='w-8 h-8 rounded-full object-cover'
                  alt=""
                />
                <p className='font-medium text-gray-800'>{report.userData?.name || 'Unknown'}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs capitalize w-fit ${getTypeColor(report.type)}`}>
                {report.type?.replace('_', ' ') || 'Other'}
              </span>
              <p>{report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'}</p>
              <span className={`px-2 py-1 rounded text-xs ${
                report.validated ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
              }`}>
                {report.validated ? 'Validated' : 'Pending'}
              </span>
              <div className='flex gap-2'>
                <a
                  href={report.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className='px-3 py-1 bg-primary text-white rounded text-xs hover:bg-blue-700 transition-colors'
                >
                  View
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-semibold'>Upload Medical Report</h3>
              <button
                onClick={() => setUploadModal(false)}
                className='text-gray-500 hover:text-gray-700 text-2xl'
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUpload}>
              <div className='mb-4'>
                <label className='block text-sm font-medium mb-2'>Select Patient</label>
                <select
                  value={uploadData.patientId}
                  onChange={(e) => setUploadData({...uploadData, patientId: e.target.value})}
                  className='w-full px-3 py-2 border rounded focus:outline-none focus:border-primary'
                  required
                >
                  <option value="">Choose a patient...</option>
                  {patients.map(patient => (
                    <option key={patient._id} value={patient._id}>{patient.name}</option>
                  ))}
                </select>
              </div>
              <div className='mb-4'>
                <label className='block text-sm font-medium mb-2'>Report Type</label>
                <select
                  value={uploadData.type}
                  onChange={(e) => setUploadData({...uploadData, type: e.target.value})}
                  className='w-full px-3 py-2 border rounded focus:outline-none focus:border-primary'
                >
                  <option value="prescription">Prescription</option>
                  <option value="lab_report">Lab Report</option>
                  <option value="imaging">Imaging</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className='mb-4'>
                <label className='block text-sm font-medium mb-2'>Upload File</label>
                <input
                  type="file"
                  onChange={(e) => setUploadData({...uploadData, file: e.target.files[0]})}
                  className='w-full px-3 py-2 border rounded focus:outline-none focus:border-primary'
                  accept='.pdf,.jpg,.jpeg,.png'
                  required
                />
              </div>
              <div className='flex gap-3'>
                <button
                  type='button'
                  onClick={() => setUploadModal(false)}
                  className='flex-1 px-4 py-2 border rounded hover:bg-gray-50'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-blue-700'
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorReports
