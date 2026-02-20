import React, { useEffect, useState } from 'react'
import { assets } from '../assets/assets'
// Title 컴포넌트가 불필요하게 느껴질 수 있어 제거하고 직접 디자인했습니다.
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion' 
import { Link, useNavigate } from 'react-router-dom' 

const MyBookings = () => {
  const { axios, user, token, setShowLogin } = useAppContext()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true) 
  const navigate = useNavigate()
  
  const currency = import.meta.env.VITE_CURRENCY || '$'

  const fetchMyBookings = async () => {
    try {
      const { data } = await axios.get('/api/bookings/user')
      if (data.success) {
        setBookings(data.bookings)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  // 페이지 로드 시 맨 위로, 로그인 확인
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // 로그인이 안 되어 있다면
    if (!token) {
        toast.error("Please sign in to view your bookings.");
        navigate('/');
        if(setShowLogin) setShowLogin(true);
        return;
    }

    if (user || token) {
      fetchMyBookings()
    }
  }, [user, token])

  if (loading) {
    return <div className='min-h-screen bg-black flex items-center justify-center text-white'>
        <div className='w-10 h-10 border-4 border-zinc-600 border-t-white rounded-full animate-spin'></div>
    </div>
  }

  return (
    <div className='bg-black min-h-screen text-white pt-32 pb-32 px-6 md:px-16 lg:px-24 xl:px-48 overflow-hidden relative'>
      
      {/* 배경 장식 */}
      <div className="absolute top-[10%] left-[-10%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className='max-w-6xl mx-auto relative z-10'>
          
        {/* 헤더 타이틀 */}
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-16'
        >
            <h2 className='text-[10px] md:text-xs font-bold tracking-[0.5em] text-gray-500 uppercase mb-4'>
                Dashboard
            </h2>
            <h1 className='text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter'>
                My Trips.
            </h1>
        </motion.div>

        {/* 예약 리스트 */}
        <div className='space-y-6'>
          {bookings && bookings.length > 0 ? (
            bookings.map((booking, index) => (
              <motion.div 
                key={booking._id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className='bg-zinc-900/30 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row gap-8 items-center hover:bg-zinc-900/50 transition-colors'
              >
                
                {/* 1. 차량 이미지 & 기본 정보 */}
                <div className='w-full lg:w-1/4 flex-shrink-0'>
                  <div className='w-full aspect-video bg-gradient-to-b from-zinc-800 to-black rounded-2xl flex items-center justify-center p-4 mb-4 border border-zinc-800/50'>
                    <img src={booking.car?.image || assets.main_car} alt="Tesla" className='w-full h-full object-contain drop-shadow-xl'/>
                  </div>
                  <p className='text-lg font-bold tracking-tight text-white mb-1'>
                    {booking.car?.brand || 'Tesla'} {booking.car?.model}
                  </p>
                  <p className='text-xs text-gray-500 uppercase tracking-widest font-semibold'>
                    {booking.car?.year || '2026'} • {booking.car?.category || 'Luxury'}
                  </p>
                </div>

                {/* 2. 예약 상세 정보 (날짜/위치/상태) */}
                <div className='w-full lg:w-2/4 flex flex-col gap-5 border-y lg:border-y-0 lg:border-l lg:border-r border-zinc-800 py-6 lg:py-0 lg:px-8'>
                  
                  {/* 상태 뱃지 */}
                  <div className='flex items-center gap-3'>
                    <span className='px-3 py-1 bg-zinc-800 border border-zinc-700 text-[10px] text-gray-400 font-bold uppercase tracking-widest rounded-full'>
                      ID: {booking._id?.slice(-6).toUpperCase() || `TRIP-${index + 1}`}
                    </span>
                    <span className={`px-4 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full border ${
                        booking.status === 'confirmed' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 
                        booking.status === 'pending' ? 'bg-amber-900/30 text-amber-400 border-amber-800' : 
                        'bg-red-900/30 text-red-400 border-red-800'
                    }`}>
                      {booking.status || 'Confirmed'}
                    </span>
                  </div>
                  
                  {/* 날짜/위치 정보 */}
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-300'>
                    <div className='bg-black/40 rounded-xl p-4 border border-zinc-800/50'>
                        <p className='text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1'>Dates</p>
                        <p className='font-medium'>{booking.pickupDate?.split('T')[0] || 'N/A'}</p>
                        <p className='text-gray-500 text-xs'>to {booking.returnDate?.split('T')[0] || 'N/A'}</p>
                    </div>
                    <div className='bg-black/40 rounded-xl p-4 border border-zinc-800/50'>
                        <p className='text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1'>Location</p>
                        <p className='font-medium break-words'>{booking.car?.location || 'Irvine, CA'}</p>
                    </div>
                  </div>
                </div>

                {/* 3. 가격 및 영수증 영역 */}
                <div className='w-full lg:w-1/4 flex flex-col justify-center items-start lg:items-end text-left lg:text-right'>
                  <p className='text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2'>Total Amount</p>
                  <h1 className='text-3xl md:text-4xl font-black text-white tracking-tighter mb-4'>
                    {currency}{booking.price?.toLocaleString() || '---'}
                  </h1>
                  <p className='text-[10px] text-gray-600 uppercase tracking-widest font-medium mb-6'>
                    Booked: {booking.createdAt?.split('T')[0] || 'Recent'}
                  </p>
                  {/* 디자인적 요소로 버튼 추가 (기능 연결은 추후 필요시) */}
                  <button className='w-full bg-white text-black py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]'>
                      View Receipt
                  </button>
                </div>

              </motion.div>
            ))
          ) : (
            /* 예약이 없을 때 (Empty State) */
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className='flex flex-col items-center justify-center py-32 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-[3rem] text-center'
            >
              <div className='w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800'>
                  <img src={assets.carIcon} alt="Car" className='w-10 opacity-50 grayscale'/>
              </div>
              <h3 className='text-2xl font-bold mb-4 tracking-tight'>No Trips Found</h3>
              <p className='text-gray-500 font-light mb-8 max-w-sm'>
                You haven't booked any vehicles yet. Your next adventure awaits in the heart of Orange County.
              </p>
              <Link to="/fleet" className='bg-white text-black px-10 py-4 rounded-full hover:bg-gray-200 hover:scale-105 transition-all text-xs uppercase font-bold tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.2)]'>
                Explore the Fleet
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyBookings
