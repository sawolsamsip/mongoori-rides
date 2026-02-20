import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { assets } from '../assets/assets'
import Loader from '../components/Loader'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const CarDetails = () => {
  const { id } = useParams()
  const { cars, axios, pickupDate, setPickupDate, returnDate, setReturnDate, token, setShowLogin } = useAppContext()
  const navigate = useNavigate()
  const [car, setCar] = useState(null)
  
  const currency = import.meta.env.VITE_CURRENCY || '$' 

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
       toast.error("Please sign in to reserve a car.");
       if(setShowLogin) setShowLogin(true);
       return;
    }

    if (!pickupDate || !returnDate) {
      toast.error("Please select both pickup and return dates.");
      return;
    }

    if (new Date(pickupDate) > new Date(returnDate)) {
      toast.error("Return date cannot be earlier than pickup date.");
      return;
    }

    try {
      const { data } = await axios.post('/api/bookings/create', { car: id, pickupDate, returnDate })
      if (data.success) {
        toast.success(data.message || "Reservation confirmed!")
        navigate('/my-bookings')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0); 
    if (cars && cars.length > 0) {
      setCar(cars.find(car => car._id === id))
    }
  }, [cars, id])

  return car ? (
    <div className='bg-black min-h-screen pt-32 pb-24 px-6 md:px-16 lg:px-24 xl:px-32 text-white'>
      
      <button onClick={() => navigate(-1)} className='flex items-center gap-2 mb-10 text-gray-500 hover:text-white transition-colors cursor-pointer group uppercase tracking-widest text-xs font-bold'>
        <img src={assets.arrow_icon} alt="Back" className='rotate-180 opacity-50 group-hover:opacity-100 transition-opacity w-4'/>
        <span>Back to Fleet</span>
      </button>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-16'>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className='lg:col-span-2'>
          
          <div className='w-full aspect-video bg-gradient-to-b from-zinc-800/40 to-black rounded-[2rem] md:rounded-[3rem] mb-10 border border-zinc-800 flex items-center justify-center overflow-hidden p-8'>
              <motion.img 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ delay: 0.2, duration: 0.8 }} 
                src={car.image || assets.main_car} 
                alt={car.model} 
                className='w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(255,255,255,0.05)]' 
              />
          </div>
          
          <div className='space-y-10'>
            <div>
              <h1 className='text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-2'>{car.brand || 'Tesla'} {car.model}</h1>
              <p className='text-gray-400 text-lg uppercase tracking-widest font-light'>
                {car.category || 'Luxury'} • <span className='text-white font-medium'>{car.year || '2026'}</span>
              </p>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
              {[
                { icon: assets.users_icon, text: `${car.seats || car.seating_capacity || '5'} Seats` },
                { icon: assets.fuel_icon, text: `${car.battery_range || 'Long'} Range` },
                { icon: assets.carIcon, text: car.autopilot || 'Autopilot' }, 
                { icon: assets.location_icon, text: car.location || 'Irvine, CA' },
              ].map(({ icon, text }, index) => (
                <div key={index} className='flex flex-col items-center justify-center bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl hover:border-gray-500 transition-all'>
                  <img src={icon} alt="" className='h-6 mb-4 opacity-70'/> 
                  <span className='text-xs font-medium tracking-wider uppercase text-gray-300 text-center'>{text}</span>
                </div>
              ))}
            </div>

            {/* 🚨 설명 영역 보완: 기본 마케팅 카피 + 차량 스펙 박스 분리 */}
            <div className='border-t border-zinc-900 pt-10'>
              <h2 className='text-2xl font-bold mb-6 tracking-tight'>Experience the Future</h2>
              
              {/* 고정 마케팅 카피 (항상 노출되어 풍성해 보이게 함) */}
              <p className='text-gray-400 leading-relaxed text-lg font-light mb-8'>
                Elevate your Orange County lifestyle with this premium {car.brand || 'Tesla'} {car.model}. 
                Whether you're cruising down PCH or heading to a business meeting in Irvine, 
                experience the perfect blend of sustainable energy, cutting-edge technology, and minimalist luxury.
              </p>

              {/* DB에서 불러온 실제 짧은 설명(White/Black 등)을 예쁜 박스에 담음 */}
              {car.description && (
                <div className='bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 lg:p-8'>
                  <h3 className='text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-3'>Vehicle Notes / Trim</h3>
                  <p className='text-white font-medium whitespace-pre-line text-lg'>
                    {car.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <div className='relative'>
          <motion.form 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.8, delay: 0.2 }}
            onSubmit={handleSubmit} 
            className='sticky top-32 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-[2.5rem] p-8 md:p-10 space-y-8 shadow-2xl'
          >
            <div className='flex items-end gap-2 border-b border-zinc-800 pb-8'>
              <span className='text-5xl font-black tracking-tighter'>{currency}{car.pricePerDay || car.price || '150'}</span>
              <span className='text-gray-500 uppercase tracking-widest text-xs font-bold mb-2'>/ day</span>
            </div>
            
            <div className='space-y-6'>
              <div className='flex flex-col gap-3'>
                <label className='text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]'>Pickup Date</label>
                <input 
                  value={pickupDate} 
                  onChange={(e) => setPickupDate(e.target.value)} 
                  type="date" 
                  className='bg-black/50 border border-zinc-800 p-4 rounded-2xl text-white w-full outline-none focus:border-gray-400 transition-colors text-sm' 
                  style={{ colorScheme: 'dark' }} 
                  required 
                />
              </div>
              <div className='flex flex-col gap-3'>
                <label className='text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]'>Return Date</label>
                <input 
                  value={returnDate} 
                  onChange={(e) => setReturnDate(e.target.value)} 
                  type="date" 
                  className='bg-black/50 border border-zinc-800 p-4 rounded-2xl text-white w-full outline-none focus:border-gray-400 transition-colors text-sm' 
                  style={{ colorScheme: 'dark' }} 
                  required 
                />
              </div>
            </div>
            
            <button 
              type="submit"
              className='w-full bg-white text-black hover:bg-gray-200 transition-all py-5 font-bold rounded-full text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.2)]'
            >
              Reserve This Tesla
            </button>
            
            <p className='text-center text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-6'>
              Includes Supercharging access in Irvine.
            </p>
          </motion.form>
        </div>
        
      </div>
    </div>
  ) : (
    <div className='bg-black min-h-screen flex items-center justify-center'><Loader /></div>
  )
}

export default CarDetails
