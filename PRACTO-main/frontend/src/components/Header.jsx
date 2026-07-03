import React from 'react'
import { assets } from '../assets/assets'

const Header = () => {
    return (
        <div className='flex flex-col md:flex-row flex-wrap bg-gradient-to-r from-primary to-[#2a52be] rounded-2xl px-6 md:px-10 lg:px-20 shadow-2xl overflow-hidden min-h-[500px]'>
            {/* --------- Header Left --------- */}
            <div className='md:w-1/2 flex flex-col items-start justify-center gap-6 py-10 m-auto md:py-[10vw] md:mb-[-30px] animate-fadeIn'>
                <p className='text-4xl md:text-5xl lg:text-6xl text-white font-bold leading-tight'>
                    Book Appointment <br />  With <span className='text-blue-200'>Trusted Doctors</span>
                </p>
                <div className='flex flex-col md:flex-row items-center gap-4 text-white text-base font-light'>
                    <img className='w-28 drop-shadow-lg' src={assets.group_profiles} alt="" />
                    <p className='opacity-90'>Simply browse through our extensive list of trusted doctors, <br className='hidden sm:block' /> schedule your appointment hassle-free.</p>
                </div>
                <a href='#speciality' className='group flex items-center gap-3 bg-white px-10 py-4 rounded-full text-primary text-base font-semibold m-auto md:m-0 hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95'>
                    Book appointment
                    <img className='w-3 group-hover:translate-x-1 transition-transform' src={assets.arrow_icon} alt="" />
                </a>
            </div>

            {/* --------- Header Right --------- */}
            <div className='md:w-1/2 relative flex justify-end items-end'>
                <img className='w-full md:absolute bottom-0 h-auto rounded-lg drop-shadow-2xl transform translate-y-4 hover:translate-y-0 transition-transform duration-700' src={assets.header_img} alt="" />
            </div>
        </div>
    )
}

export default Header