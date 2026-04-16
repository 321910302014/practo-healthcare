import React from 'react'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets';

const Footer = () => {
  const navigate = useNavigate()

  const goTo = (path) => { navigate(path); scrollTo(0, 0) }

  return (
    <div className='md:mx-10'>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>

        <div>
          <img className='mb-5 w-48' src={assets.logo} alt="" />
          <p className='w-full md:w-2/3 text-gray-600 leading-6'>
            Prescripto is your trusted partner in health management. We bridge the gap between patients and top-tier healthcare professionals, ensuring seamless booking and quality care at your fingertips.
          </p>
        </div>

        <div>
          <p className='text-xl font-bold mb-5 text-gray-900'>COMPANY</p>
          <ul className='flex flex-col gap-2 text-gray-600'>
            <li onClick={() => goTo('/')} className='hover:text-primary cursor-pointer transition-colors'>Home</li>
            <li onClick={() => goTo('/about')} className='hover:text-primary cursor-pointer transition-colors'>About us</li>
            <li onClick={() => goTo('/contact')} className='hover:text-primary cursor-pointer transition-colors'>Contact us</li>
          </ul>
        </div>

        <div>
          <p className='text-xl font-bold mb-5 text-gray-900'>GET IN TOUCH</p>
          <ul className='flex flex-col gap-2 text-gray-600'>
            <li><a href='tel:+12124567890' className='hover:text-primary transition-colors'>+1-212-456-7890</a></li>
            <li><a href='mailto:contact@prescripto.com' className='hover:text-primary transition-colors'>contact@prescripto.com</a></li>
          </ul>
        </div>

      </div>

      <div>
        <hr className='border-gray-200' />
        <p className='py-8 text-sm text-center text-gray-500 font-medium'>
          Copyright {new Date().getFullYear()} @ Prescripto.com - All Rights Reserved.
        </p>
      </div>
    </div>
  )
}

export default Footer;
