import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'

const MyReports = () => {
    const { getUserReports, token } = useContext(AppContext)
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchReports = async () => {
        setLoading(true)
        const data = await getUserReports()
        setReports(data)
        setLoading(false)
    }

    useEffect(() => {
        if (token) {
            fetchReports()
        }
    }, [token])

    return (
        <div className='pb-20'>
            <p className='pb-3 mt-12 font-medium text-zinc-700 border-b'>My Medical Reports</p>

            <div className='mt-5'>
                {loading ? (
                    <div className='flex justify-center items-center h-40'>
                        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                    </div>
                ) : reports.length > 0 ? (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {reports.map((item, index) => (
                            <div key={index} className='flex items-center gap-4 p-4 border rounded-xl hover:shadow-md transition-all bg-white'>
                                <div className='bg-blue-50 p-4 rounded-lg'>
                                    <img
                                        src={item.type === 'prescription' ? assets.appointment_icon : assets.group_profiles}
                                        className='w-10 h-10 object-contain'
                                        alt=""
                                    />
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <p className='text-gray-800 font-bold truncate'>{item.reportName}</p>
                                    <p className='text-xs text-zinc-500 uppercase tracking-wider font-semibold mt-1'>{item.type}</p>
                                    <p className='text-xs text-zinc-400 mt-1'>Uploaded: {new Date(item.uploadedAt).toLocaleDateString()}</p>
                                </div>
                                <a
                                    href={item.fileUrl}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='bg-primary text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-sm'
                                    title='View/Download'
                                >
                                    <img className='w-5' src={assets.upload_icon} alt="" style={{ transform: 'rotate(180deg)' }} />
                                </a>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className='text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200'>
                        <img className='w-20 mx-auto opacity-20 mb-4' src={assets.logo} alt="" />
                        <p className='text-zinc-500 font-medium'>No medical reports found.</p>
                        <p className='text-xs text-zinc-400 mt-2'>Your doctors will upload your reports here after your appointments.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default MyReports
