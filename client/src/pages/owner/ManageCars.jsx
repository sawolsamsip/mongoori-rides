import React, { useEffect, useState } from 'react'
import eye_icon from '../../assets/eye_icon.svg'
import eye_close_icon from '../../assets/eye_close_icon.svg'
import delete_icon from '../../assets/delete_icon.svg'
import upload_icon from '../../assets/upload_icon.svg' 

import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const ManageCars = () => {
  const { isOwner, axios, currency } = useAppContext()
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchOwnerCars = async () => {
    try {
      const { data } = await axios.get('/api/owner/cars')
      if (data.success) {
        setCars(data.cars)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleAvailability = async (carId) => {
    try {
      const { data } = await axios.post('/api/owner/toggle-car', { carId })
      if (data.success) {
        toast.success(data.message)
        fetchOwnerCars()
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const deleteCar = async (carId) => {
    try {
      if (!window.confirm('Are you sure you want to remove this Tesla from the fleet?')) return
      const { data } = await axios.post('/api/owner/delete-car', { carId })
      if (data.success) {
        toast.success(data.message)
        fetchOwnerCars()
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (isOwner) fetchOwnerCars()
  }, [isOwner])

  if (loading) {
    return <div className='flex-1 flex justify-center items-center min-h-[50vh]'><div className='w-8 h-8 border-4 border-zinc-700 border-t-white rounded-full animate-spin'></div></div>
  }

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='w-full text-white'
    >
        {/* 헤더 타이틀 */}
        <div className='mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6'>
            <div>
                <h2 className='text-[10px] font-bold tracking-[0.3em] text-gray-500 uppercase mb-2'>Fleet Control</h2>
                <h1 className='text-3xl md:text-4xl font-black tracking-tight'>Manage Cars.</h1>
                <p className='text-gray-400 text-sm mt-3 font-light max-w-xl'>
                    View all your listed vehicles, manage their availability, or remove them from the platform.
                </p>
            </div>
            <button 
                onClick={() => navigate('/owner/add-car')}
                className='px-8 py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-full hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] flex-shrink-0'
            >
                Add New Car
            </button>
        </div>

        {/* 차량 리스트 테이블 */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='w-full bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl'
        >
            <div className='overflow-x-auto'>
                <table className='w-full border-collapse text-left text-sm'>
                <thead>
                    <tr className='bg-black/40 border-b border-zinc-800 text-[10px] uppercase tracking-[0.2em] text-gray-500'>
                        <th className="px-8 py-6 font-bold">Vehicle Info</th>
                        <th className="px-6 py-6 font-bold hidden md:table-cell">Category</th>
                        <th className="px-6 py-6 font-bold">Price / Day</th>
                        <th className="px-6 py-6 font-bold hidden lg:table-cell">Status</th>
                        <th className="px-8 py-6 font-bold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className='divide-y divide-zinc-800/50'>
                    {cars && cars.length > 0 ? (
                        cars.map((car, index) => (
                        <tr key={index} className='hover:bg-zinc-800/20 transition-colors group'>
                            {/* 1. 차량 정보 */}
                            <td className='px-8 py-6'>
                                <div className='flex items-center gap-5'>
                                    <div className='w-20 md:w-28 aspect-video rounded-xl bg-gradient-to-b from-zinc-800/40 to-black flex items-center justify-center overflow-hidden border border-zinc-800/50 flex-shrink-0'>
                                        <img 
                                            src={Array.isArray(car.image) ? car.image[0] : (car.image || upload_icon)} 
                                            alt={car.model} 
                                            className="h-full w-full object-contain p-2 group-hover:scale-110 transition-transform"
                                        />
                                    </div>
                                    <div>
                                        <p className='font-bold text-base md:text-lg tracking-tight'>{car.brand} {car.model}</p>
                                        <p className='text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-semibold mt-1'>
                                            {car.year || '2026'} • {car.battery_range || 'N/A'} mi Range
                                        </p>
                                    </div>
                                </div>
                            </td>
                            
                            {/* 2. 카테고리 */}
                            <td className='px-6 py-6 hidden md:table-cell'>
                                <span className='text-gray-300 font-medium'>{car.category || 'N/A'}</span>
                            </td>

                            {/* 3. 가격 */}
                            <td className='px-6 py-6'>
                                <span className='text-lg font-black'>{currency}{car.pricePerDay}</span>
                            </td>

                            {/* 4. 상태 */}
                            <td className='px-6 py-6 hidden lg:table-cell'>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold border ${
                                    car.isAvaliable 
                                    ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' 
                                    : 'bg-amber-900/30 text-amber-400 border-amber-800'
                                }`}>
                                    {car.isAvaliable ? "Available" : "Hidden"}
                                </span>
                            </td>

                            {/* 5. 액션 버튼 */}
                            <td className='px-8 py-6'>
                                <div className='flex justify-end gap-2'>
                                    <button 
                                        onClick={() => toggleAvailability(car._id)} 
                                        className='p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors group/btn'
                                        title={car.isAvaliable ? "Hide Car" : "Show Car"}
                                    >
                                        <img 
                                        src={car.isAvaliable ? eye_close_icon : eye_icon} 
                                        className={`w-4 h-4 opacity-70 group-hover/btn:opacity-100 ${car.isAvaliable ? '' : 'invert'}`} 
                                        alt="toggle"
                                        />
                                    </button>
                                    <button 
                                        onClick={() => deleteCar(car._id)} 
                                        className='p-3 rounded-xl bg-red-900/20 hover:bg-red-900/50 border border-transparent hover:border-red-800 transition-colors group/btn'
                                        title="Delete Car"
                                    >
                                        <img 
                                        src={delete_icon} 
                                        className='w-4 h-4 opacity-70 group-hover/btn:opacity-100 invert' 
                                        alt="delete"
                                        />
                                    </button>
                                </div>
                            </td>
                        </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className='px-8 py-24 text-center'>
                                <div className='flex flex-col items-center justify-center gap-4'>
                                    <div className='w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center'>
                                        <img src={eye_close_icon} alt="" className='w-6 opacity-40 invert' />
                                    </div>
                                    <p className='text-gray-400 font-light text-lg'>No vehicles listed in your fleet yet.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
                </table>
            </div>
        </motion.div>
    </motion.div>
  )
}

export default ManageCars
