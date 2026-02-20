import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { useAppContext } from './context/AppContext'
import { Toaster } from 'react-hot-toast'

// 일반 페이지
import Home from './pages/Home'
import Cars from './pages/Cars'
import CarDetails from './pages/CarDetails'
import MyBookings from './pages/MyBookings'
import OurStory from './pages/OurStory' // 🌟 Our Story 컴포넌트 불러오기

// 공통 컴포넌트
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Login from './components/Login'

// 오너 레이아웃 및 페이지
import Layout from './pages/owner/Layout'
import AddCar from './pages/owner/AddCar'
import ManageCars from './pages/owner/ManageCars'
import Dashboard from './pages/owner/Dashboard'
import ManageBookings from './pages/owner/ManageBookings'

const App = () => {
  const { showLogin } = useAppContext()

  return (
    <div className='bg-black min-h-screen font-sans'>
      <Toaster position="bottom-right" />
      {showLogin && <Login />}
      
      <Routes>
        {/* --- 1. 일반 사용자 영역 --- */}
        <Route 
          path="/*" 
          element={
            <>
              <Navbar />
              <div className='min-h-[80vh]'>
                <Routes>
                  <Route path='/' element={<Home />} />
                  <Route path='/fleet' element={<Cars />} /> 
                  <Route path='/car-details/:id' element={<CarDetails />} />
                  <Route path='/my-bookings' element={<MyBookings />} />
                  <Route path='/our-story' element={<OurStory />} /> {/* 🌟 경로 연결! */}
                </Routes>
              </div>
              <Footer />
            </>
          } 
        />

        {/* --- 2. 오너 관리자 영역 --- */}
        <Route path='/owner' element={<Layout />}>
          <Route path='dashboard' element={<Dashboard />} />
          <Route path='add-car' element={<AddCar />} />
          <Route path='manage-cars' element={<ManageCars />} />
          <Route path='manage-bookings' element={<ManageBookings />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
