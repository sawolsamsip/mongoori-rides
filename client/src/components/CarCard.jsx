import React from 'react'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'

const CarCard = ({ car }) => {
  const navigate = useNavigate()

  return (
    <div className='bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden hover:border-gray-500 transition-all duration-300 flex flex-col group shadow-lg'>
      
      {/* 1. 이미지 및 뱃지 영역 */}
      <div className='relative w-full h-48 sm:h-56 bg-gradient-to-b from-white to-gray-300 flex justify-center items-center overflow-hidden'>
        
        {/* Available / Booked 뱃지 */}
        <div className={`absolute top-4 left-4 backdrop-blur-md text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest z-10 ${
          car.hasActiveBooking
            ? 'bg-red-900/80 border border-red-500/50 text-red-200'
            : 'bg-black/80 border border-white/20 text-white'
        }`}>
          {car.hasActiveBooking ? 'Booked' : 'Available'}
        </div>
        
        {/* 자동차 이미지 */}
        <img 
          src={car.image || assets.main_car} 
          alt={car.model} 
          className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-700' 
        />
      </div>

      {/* 2. 하단 정보 영역 */}
      <div className='p-6 flex flex-col flex-1 bg-zinc-900/30'>
        <div className='flex justify-between items-start mb-4'>
          <div>
            <h3 className='text-xl md:text-2xl font-bold text-white mb-1'>{car.model || 'Tesla Model'}</h3>
            <p className='text-xs text-gray-400 uppercase tracking-wider'>
              {car.category || 'SUV'} • {car.year || '2026'}
            </p>
          </div>
          <div className='text-right'>
            <p className='text-xl md:text-2xl font-bold text-white'>
              ${car.pricePerWeek != null ? (Math.round((car.pricePerWeek / 7) * 100) / 100).toFixed(2) : (car.pricePerDay || car.price || '150')}
            </p>
            <p className='text-[10px] text-gray-500 uppercase tracking-wider'>per day (weekly rate)</p>
          </div>
        </div>

        {/* 아이콘 정보 */}
        <div className='flex items-center gap-6 mb-6 text-sm text-gray-400'>
          <div className='flex items-center gap-2'>
            <img src={assets.users_icon} alt="Seats" className='w-4 h-4 opacity-70' />
            <span>{car.seats || '5'} Seats</span>
          </div>
          <div className='flex items-center gap-2'>
            <img src={assets.fuel_icon} alt="Fuel" className='w-4 h-4 opacity-70' />
            <span>{car.fuelType || 'Electric'}</span>
          </div>
        </div>

        {/* 버튼 */}
        <button 
          onClick={() => navigate(`/car-details/${car._id}`)}
          className='w-full bg-white text-black py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors mt-auto shadow-[0_4px_14px_0_rgba(255,255,255,0.1)]'
        >
          View Details
        </button>
      </div>
    </div>
  )
}

export default CarCard
