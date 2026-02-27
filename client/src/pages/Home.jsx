import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'

import FeaturedSection from '../components/FeaturedSection'
import Banner from '../components/Banner'
import Newsletter from '../components/Newsletter'

const Home = () => {
  const navigate = useNavigate()
  const { cars, fetchCars, pickupDate, setPickupDate, returnDate, setReturnDate } = useAppContext()
  const [selectedModel, setSelectedModel] = useState('')

  // 메인 진입 시에도 서버에서 최신 차량 목록 로드 (Fleet과 동일한 목록 유지, 캐시 방지)
  React.useEffect(() => {
    if (typeof fetchCars === 'function') fetchCars()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const availableCars = Array.isArray(cars) ? cars.filter(car => car.isAvaliable !== false) : []
  const carModels = Array.from(new Set(availableCars.map(car => car.model)))

  const handleSearch = () => {
    if (!pickupDate || !returnDate) {
      toast.error("Please select both pickup and return dates.");
      return;
    }
    if (new Date(pickupDate) > new Date(returnDate)) {
      toast.error("Return date cannot be earlier than pickup date.");
      return;
    }
    navigate('/fleet', { state: { model: selectedModel } });
    window.scrollTo(0, 0);
  }

  return (
    <div className='text-white bg-black'>
      {/* 1. Hero Section */}
      <div className='relative w-full h-screen flex items-center justify-center overflow-hidden'>
        <video 
          src={assets.tesla_video} 
          autoPlay loop muted playsInline
          className='absolute top-0 left-0 w-full h-full object-cover z-0'
        />
        <div className='absolute top-0 left-0 w-full h-full bg-black/40 z-10'></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='relative z-20 text-center px-4 sm:px-6 w-full max-w-7xl mt-16 md:mt-0'
        >
          <h1 className='text-5xl md:text-8xl font-bold tracking-tighter mb-4 text-white'>Drive the Future</h1>
          <p className='text-base md:text-xl text-gray-300 mb-10 md:mb-12 font-light tracking-wide'>Premium Tesla Sharing in Irvine, CA</p>

          {/* 🚨 모바일 반응형 검색바 개선 */}
          <div className='bg-black/60 md:bg-black/30 backdrop-blur-3xl p-4 md:p-3 rounded-3xl md:rounded-[3rem] border border-white/10 grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-2 shadow-2xl max-w-6xl mx-auto'>
            
            <div className='flex flex-col text-left py-2 md:py-3 px-4 md:px-6'>
              <label className='text-[10px] uppercase font-bold tracking-[0.2em] text-gray-500 mb-1'>Location</label>
              <input type="text" value="Irvine, CA" readOnly className='bg-transparent text-white outline-none text-sm font-medium' />
            </div>
            
            <div className='flex flex-col text-left py-2 md:py-3 px-4 md:px-6 border-t md:border-t-0 md:border-l border-white/10 md:border-white/5'>
              <label className='text-[10px] uppercase font-bold tracking-[0.2em] text-gray-500 mb-1'>Model</label>
              <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className='bg-transparent text-white outline-none text-sm cursor-pointer appearance-none'>
                <option value="" className='bg-zinc-900 text-white'>All Models</option>
                {carModels.map(m => <option key={m} value={m} className='bg-zinc-900 text-white'>{m}</option>)}
              </select>
            </div>
            
            <div className='flex flex-col text-left py-2 md:py-3 px-4 md:px-6 border-t md:border-t-0 md:border-l border-white/10 md:border-white/5'>
              <label className='text-[10px] uppercase font-bold tracking-[0.2em] text-gray-500 mb-1'>Pickup</label>
              <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className='bg-transparent text-white outline-none text-sm w-full' style={{ colorScheme: 'dark' }} />
            </div>
            
            <div className='flex flex-col text-left py-2 md:py-3 px-4 md:px-6 border-t md:border-t-0 md:border-l border-white/10 md:border-white/5'>
              <label className='text-[10px] uppercase font-bold tracking-[0.2em] text-gray-500 mb-1'>Return</label>
              <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className='bg-transparent text-white outline-none text-sm w-full' style={{ colorScheme: 'dark' }} />
            </div>
            
            <button onClick={handleSearch} className='bg-white text-black font-bold rounded-2xl md:rounded-[2.5rem] py-4 mt-2 md:mt-0 hover:bg-gray-200 transition-all text-sm uppercase tracking-widest'>
              Search Fleet
            </button>
          </div>
        </motion.div>
      </div>

      <FeaturedSection />
      <Banner />
      <Newsletter />
      
    </div>
  )
}

export default Home
