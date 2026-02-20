import React, { useState, useMemo } from 'react' // useMemo 추가
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import { motion } from 'framer-motion'

const Hero = () => {
    const [pickupLocation] = useState('Irvine')
    const { pickupDate, setPickupDate, returnDate, setReturnDate, navigate } = useAppContext()

    const handleSearch = (e) => {
        e.preventDefault()
        navigate('/cars?pickupLocation=' + pickupLocation + '&pickupDate=' + pickupDate + '&returnDate=' + returnDate)
    }

    // 비디오 태그가 리렌더링될 때마다 소스가 깜빡이는 것을 방지하기 위해 useMemo 사용 가능하지만, 
    // 여기서는 key와 속성 최적화에 집중합니다.
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className='relative h-screen w-full flex flex-col items-center justify-center gap-10 overflow-hidden text-center bg-black'>
            
            {/* --- 배경 비디오 섹션 --- */}
            <div className="absolute top-0 left-0 w-full h-full z-0"> {/* z-index를 0으로 설정 */}
                <video
                    key="hero-video-fixed" // 고정 키값 (중요!)
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto" // 미리 로딩 강제
                    className="w-full h-full object-cover"
                >
                    <source src={assets.tesla_video} type="video/mp4" />
                </video>

                {/* 비디오 위 오버레이: z-index를 비디오보다 높게 설정 */}
                <div className="absolute top-0 left-0 w-full h-full bg-black/40 z-10"></div>
            </div>

            {/* --- 텍스트 및 폼 섹션: z-index를 20 이상으로 설정 --- */}
            <div className='z-20 px-4'>
                <motion.h1
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className='text-4xl md:text-6xl font-bold text-white tracking-tight'>
                    The Future is Electric
                </motion.h1>

                <motion.p 
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="text-gray-200 mt-4 text-lg md:text-xl font-light">
                    Premium Tesla Model 3 & Model Y Rental Specialists
                </motion.p>
            </div>

            <motion.form
                initial={{ scale: 0.95, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                onSubmit={handleSearch}
                className='z-20 flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-2 pl-6 rounded-2xl md:rounded-full w-[90%] max-w-4xl bg-white shadow-2xl'
            >
                {/* ... 검색 폼 내부 코드는 동일 ... */}
                <div className='flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10 w-full md:w-auto py-4 md:py-0'>
                    <div className='flex flex-col items-start gap-1'>
                        <label className='text-[10px] uppercase tracking-wider font-bold text-gray-400 px-1'>Location</label>
                        <div className='bg-transparent outline-none font-semibold text-black px-1'>Irvine, CA</div>
                    </div>
                    <div className='flex flex-col items-start gap-1 border-l-0 md:border-l border-gray-200 md:pl-8'>
                        <label htmlFor='pickup-date' className='text-[10px] uppercase tracking-wider font-bold text-gray-400'>Pick-up</label>
                        <input value={pickupDate} onChange={e => setPickupDate(e.target.value)} type="date" id="pickup-date" min={new Date().toISOString().split('T')[0]} className='outline-none font-medium text-black bg-transparent w-full [color-scheme:light]' style={{ color: 'black' }} required />
                    </div>
                    <div className='flex flex-col items-start gap-1 border-l-0 md:border-l border-gray-200 md:pl-8'>
                        <label htmlFor='return-date' className='text-[10px] uppercase tracking-wider font-bold text-gray-400'>Return</label>
                        <input value={returnDate} onChange={e => setReturnDate(e.target.value)} type="date" id="return-date" className='outline-none font-medium text-black bg-transparent w-full [color-scheme:light]' style={{ color: 'black' }} required />
                    </div>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className='flex items-center justify-center gap-2 px-10 py-4 w-full md:w-auto bg-black text-white rounded-xl md:rounded-full font-semibold cursor-pointer transition-all'>
                    <img src={assets.search_icon} alt="search" className='w-4 brightness-200' />
                    Search
                </motion.button>
            </motion.form>
        </motion.div>
    )
}

export default Hero
