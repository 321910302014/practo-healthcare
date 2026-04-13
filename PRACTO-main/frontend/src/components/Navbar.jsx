import { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import { AppContext } from '../context/AppContext';
//import { useLoading } from '../context/LoadingContext';

// import { ThemeContext } from '../context/ThemeContext'

const Navbar = () => {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const { token, setToken, userData } = useContext(AppContext)
  //const { setLoading } = useLoading();


  // const { darkMode, setDarkMode } = useContext(ThemeContext)

  const logout = async () => {
    //setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    localStorage.removeItem('token');
    setToken(false);
    //setLoading(false);
    document.location.href = '/';
  }

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-[#adadad] sticky top-0 bg-white z-50 px-2 sm:px-0'>
      <img onClick={() => navigate('/')} className='w-44 cursor-pointer transform hover:scale-105 transition-transform duration-300' src={assets.logo} alt="" />
      <ul className='md:flex items-start gap-5 font-medium hidden uppercase tracking-wider'>
        <NavLink to='/' className='hover:text-primary transition-colors'>
          <li className='py-1'>Home</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/doctors' className='hover:text-primary transition-colors'>
          <li className='py-1'>All Doctors</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/symptom-checker' className='hover:text-primary transition-colors'>
          <li className='py-1'>AI SYMPTOM CHECKER</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/about' className='hover:text-primary transition-colors'>
          <li className='py-1'>About</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/contact' className='hover:text-primary transition-colors'>
          <li className='py-1'>Contact</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
      </ul>

      <div className='flex items-center gap-4 '>
        {
          token && userData
            ? <div className='flex items-center gap-2 cursor-pointer group relative'>
              <img className='w-10 h-10 rounded-full object-cover border-2 border-primary' src={userData.image} alt="" />
              <img className='w-2.5 group-hover:rotate-180 transition-transform duration-300' src={assets.dropdown_icon} alt="" />
              <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
                <div className='min-w-48 bg-white border border-gray-100 shadow-xl rounded flex flex-col gap-1 p-2'>
                  <p onClick={() => navigate('/my-profile')} className='hover:bg-gray-50 p-2 rounded cursor-pointer'>My Profile</p>
                  <p onClick={() => navigate('/my-appointments')} className='hover:bg-gray-50 p-2 rounded cursor-pointer'>My Appointments</p>
                  <p onClick={() => navigate('/my-reports')} className='hover:bg-gray-50 p-2 rounded cursor-pointer'>My Reports</p>
                  <p onClick={logout} className='hover:bg-gray-50 p-2 rounded cursor-pointer text-red-500'>Logout</p>
                </div>
              </div>
            </div>
            : <button onClick={() => navigate('/login')} className='bg-primary text-white px-8 py-3 rounded-full font-semibold hidden md:block hover:bg-blue-700 hover:shadow-lg transition-all active:scale-95 duration-200'>Create account</button>
        }
        <img onClick={() => setShowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt="" />

        {/* ---- Mobile Menu ---- */}
        <div className={`md:hidden ${showMenu ? 'fixed w-full' : 'h-0 w-0'} right-0 top-0 bottom-0 z-50 overflow-hidden bg-white transition-all`}>
          <div className='flex items-center justify-between px-5 py-6 border-b'>
            <img src={assets.logo} className='w-36' alt="" />
            <img onClick={() => setShowMenu(false)} src={assets.cross_icon} className='w-7 cursor-pointer' alt="" />
          </div>
          <ul className='flex flex-col items-center gap-4 mt-10 px-5 text-lg font-medium'>
            <NavLink onClick={() => setShowMenu(false)} to='/' className='w-full text-center py-2 rounded-lg hover:bg-gray-50'>Home</NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/doctors' className='w-full text-center py-2 rounded-lg hover:bg-gray-50'>All Doctors</NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/about' className='w-full text-center py-2 rounded-lg hover:bg-gray-50'>About</NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/contact' className='w-full text-center py-2 rounded-lg hover:bg-gray-50'>Contact</NavLink>
            {!token && <button onClick={() => { setShowMenu(false); navigate('/login'); }} className='mt-4 w-full bg-primary text-white py-3 rounded-lg font-semibold'>Create account</button>}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Navbar