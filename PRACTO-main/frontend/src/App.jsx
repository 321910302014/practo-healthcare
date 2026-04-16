import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';        // ✅ add this
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';

// Pages
import Home from './Pages/Home';
import Doctors from './Pages/Doctors';
import Login from './Pages/Login';
import About from './Pages/About';
import Contact from './Pages/Contact';
import MyProfile from './Pages/MyProfile';
import MyAppointments from './Pages/MyAppointments';
import Appointment from './Pages/Appointment';
import MyReports from './Pages/MyReports';
import SymptomChecker from './Pages/SymptomChecker';
import VideoCall from './Pages/VideoCall';
import Verify from './Pages/Verify';
import Footer from './components/Footer';
import RequireAuth from './components/RequireAuth';

const App = () => {
  return (
    <div className='mx-4 sm:mx-[10%]'>
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/doctors' element={<Doctors />} />
        <Route path='/doctors/:speciality' element={<Doctors />} />
        <Route path='/login' element={<Login />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/my-profile' element={<RequireAuth><MyProfile /></RequireAuth>} />
        <Route path='/my-appointments' element={<RequireAuth><MyAppointments /></RequireAuth>} />
        <Route path='/my-reports' element={<RequireAuth><MyReports /></RequireAuth>} />
        <Route path='/symptom-checker' element={<SymptomChecker />} />
        <Route path='/video-call/:appointmentId' element={<RequireAuth><VideoCall /></RequireAuth>} />
        <Route path='/appointment/:docId' element={<Appointment />} />
        <Route path='/verify' element={<RequireAuth><Verify /></RequireAuth>} />
      </Routes>
      <Footer />
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default App;
