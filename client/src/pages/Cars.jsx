import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom' 
import { useAppContext } from '../context/AppContext'
import { motion } from 'framer-motion'
import CarCard from '../components/CarCard'
import Loader from '../components/Loader'

const Cars = () => {
    const { cars } = useAppContext()
    const [filterCars, setFilterCars] = useState([])
    const [loading, setLoading] = useState(true)
    const location = useLocation()
    const navigate = useNavigate()

    const searchModel = location.state?.model;

    // 페이지 진입 시 스크롤 맨 위로
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (cars && cars.length > 0) {
            if (searchModel && searchModel !== "") {
                const filtered = cars.filter(car => car.model === searchModel);
                setFilterCars(filtered);
            } else {
                setFilterCars(cars);
            }
            setLoading(false);
        } else if (cars && cars.length === 0) {
             setLoading(false); // 차량 데이터가 아예 없을 경우 무한 로딩 방지
        }
    }, [cars, searchModel]);

    // 필터 초기화 함수
    const clearFilter = () => {
        navigate('/fleet', { state: {} }); // state를 비워서 다시 라우팅
        setFilterCars(cars);
    }

    if (loading) {
        return (
            <div className='bg-black min-h-screen flex items-center justify-center'>
                <Loader />
            </div>
        )
    }

    return (
        <div className='flex flex-col items-center pt-32 px-6 md:px-16 lg:px-24 bg-black min-h-screen text-white relative overflow-hidden'>
            
            {/* 배경 은은한 빛 효과 */}
            <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none"></div>

            {/* 헤더 섹션 */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className='text-center mb-16 relative z-10 w-full max-w-4xl'
            >
                <h2 className='text-[10px] md:text-xs font-bold tracking-[0.5em] text-gray-500 uppercase mb-4'>
                    The mongoori Collection
                </h2>
                <h1 className='text-4xl md:text-6xl font-black tracking-tighter leading-tight'>
                    {searchModel ? (
                        <>
                            <span className='text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400'>
                                {searchModel}
                            </span> 
                            <br className='md:hidden' /> Listings
                        </>
                    ) : (
                        'Available Fleet'
                    )}
                </h1>
                <p className='text-gray-400 mt-6 text-sm md:text-base font-light max-w-xl mx-auto'>
                    Select the perfect Tesla for your journey. Experience uncompromised performance and luxury right here in Irvine, CA.
                </p>

                {/* 검색 필터가 적용된 경우 '필터 해제' 버튼 노출 */}
                {searchModel && (
                     <button 
                        onClick={clearFilter}
                        className='mt-8 px-6 py-2 bg-zinc-900 border border-zinc-700 text-xs text-white uppercase tracking-widest rounded-full hover:bg-zinc-800 transition-colors'
                     >
                         Clear Filter: {searchModel} ✕
                     </button>
                )}
            </motion.div>

            {/* 차량 리스트 (그리드) */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
                className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10 w-full max-w-7xl mb-32 relative z-10'
            >
                {filterCars.length > 0 ? (
                    filterCars.map((car, index) => (
                        <CarCard key={car._id || index} car={car} />
                    ))
                ) : (
                    /* 검색 결과가 없을 때의 UI 개선 */
                    <div className='col-span-full text-center py-32 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-[3rem]'>
                        <p className='text-gray-400 text-lg font-light mb-6'>No models currently available matching your criteria.</p>
                        <button 
                            onClick={clearFilter} 
                            className='px-8 py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-full hover:bg-gray-200 transition-all'
                        >
                            View Entire Fleet
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

export default Cars
