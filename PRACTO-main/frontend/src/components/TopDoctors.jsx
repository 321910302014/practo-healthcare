import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
const TopDoctors = () => {

    const navigate = useNavigate()

    const { doctors } = useContext(AppContext)

    return (
        <div className='flex flex-col items-center gap-4 my-16 text-[#262626] md:mx-10'>
            <h1 className='text-3xl font-medium'>Top Doctors to Book</h1>
            <p className='sm:w-1/3 text-center text-sm'>Simply browse through our extensive list of trusted doctors.</p>
            <div className='w-full grid grid-cols-auto gap-6 pt-8 px-3 sm:px-0'>
                {doctors.slice(0, 10).map((item, index) => (
                    <div
                        onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0) }}
                        className='group border border-gray-100 rounded-2xl overflow-hidden cursor-pointer bg-white hover:shadow-2xl hover:-translate-y-3 transition-all duration-500'
                        key={index}
                    >
                        <div className='relative overflow-hidden'>
                            <img className='bg-blue-50 w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500' src={item.image} alt="" />
                            {item.available && (
                                <div className='absolute top-3 right-3 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm'>
                                    <p className='w-2 h-2 rounded-full bg-green-500 animate-pulse'></p>
                                    <p className='text-[10px] font-bold text-green-600 uppercase tracking-tighter'>Available</p>
                                </div>
                            )}
                        </div>
                        <div className='p-5'>
                            <div className='flex items-center justify-between mb-1'>
                                <p className='text-gray-900 text-lg font-bold group-hover:text-primary transition-colors'>{item.name}</p>
                                {item.verified && <img className='w-5' src={assets.verified_icon} alt="" />}
                            </div>
                            <p className='text-gray-500 text-sm font-medium mb-3'>{item.speciality}</p>
                            <div className='flex items-center gap-2'>
                                <span className='bg-blue-50 text-primary text-[10px] px-2 py-1 rounded font-bold uppercase'>{item.degree}</span>
                                <span className='bg-gray-50 text-gray-500 text-[10px] px-2 py-1 rounded font-bold uppercase'>{item.experience} EXP</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={() => { navigate('/doctors'); scrollTo(0, 0) }} className='bg-primary text-white px-12 py-3 rounded-full mt-10 font-bold hover:shadow-xl hover:bg-blue-700 transition-all active:scale-95'>Explore All Doctors</button>
        </div>

    )
}

export default TopDoctors