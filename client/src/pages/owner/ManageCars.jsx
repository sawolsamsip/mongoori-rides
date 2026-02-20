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
        // 데이터가 빈 배열 [] 이어도 success이므로 정상 세팅
        setCars(data.cars || [])
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error("Failed to fetch fleet data")
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='w-full text-white'>
        <div className='mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6'>
            <div>
                <h2 className='text-[10px] font-bold tracking-[0.3em] text-gray-500 uppercase mb-2'>Fleet Control</h2>
                <h1 className='text-3xl md:text-4xl font-black tracking-tight'>Manage Cars.</h1>
                <p className='text-gray-400 text-sm mt-3 font-light max-w-xl'>
                    Manage your Tesla fleet and their availability on the platform.
                </p>
            </div>
            {/* 상단 버튼은 항상 유지 */}
            <button onClick={() => navigate('/owner/add-car')} className='px-8 py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-full hover:bg-gray-200 transition-all'>
                Add New Car
            </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className='w-full bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-3xl overflow-hidden'>
            
            {cars && cars.length > 0 ? (
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
                            {cars.map((car, index) => (
                                <tr key={index} className='hover:bg-zinc-800/20 transition-colors group'>
                                    <td className='px-8 py-6'>
                                        <div className='flex items-center gap-5'>
                                            <div className='w-20 md:w-28 aspect-video rounded-xl bg-zinc-800/40 flex items-center justify-center overflow-hidden border border-zinc-800/50'>
                                                <img src={Array.isArray(car.image) ? car.image[0] : (car.image || upload_icon)} alt={car.model} className="h-full w-full object-contain p-2 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <div>
                                                <p className='font-bold text-base md:text-lg tracking-tight'>{car.brand} {car.model}</p>
                                                <p className='text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-semibold mt-1'>{car.year || '2026'} • {car.battery_range || 'N/A'} mi Range</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className='px-6 py-6 hidden md:table-cell'><span className='text-gray-300 font-medium'>{car.category || 'N/A'}</span></td>
                                    <td className='px-6 py-6'><span className='text-lg font-black'>{currency}{car.pricePerDay}</span></td>
                                    <td className='px-6 py-6 hidden lg:table-cell'>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold border ${car.isAvaliable ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-amber-900/30 text-amber-400 border-amber-800'}`}>
                                            {car.isAvaliable ? "Available" : "Hidden"}
                                        </span>
                                    </td>
                                    <td className='px-8 py-6'>
                                        <div className='flex justify-end gap-2'>
                                            <button onClick={() => toggleAvailability(car._id)} className='p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors group/btn'>
                                                <img src={car.isAvaliable ? eye_close_icon : eye_icon} className={`w-4 h-4 opacity-70 group-hover/btn:opacity-100 ${car.isAvaliable ? '' : 'invert'}`} alt="toggle" />
                                            </button>
                                            <button onClick={() => deleteCar(car._id)} className='p-3 rounded-xl bg-red-900/20 hover:bg-red-900/50 border border-transparent hover:border-red-800 transition-colors group/btn'>
                                                <img src={delete_icon} className='w-4 h-4 opacity-70 group-hover/btn:opacity-100 invert' alt="delete" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* 🚨 차량이 0개일 때의 화면 처리 */
                <div className='py-32 text-center flex flex-col items-center justify-center gap-6'>
                    <div className='w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center border border-zinc-700'>
                        <img src={assets.carIcon} alt="" className='w-8 opacity-20 invert' />
                    </div>
                    <div>
                        <p className='text-xl font-bold'>Your fleet is empty.</p>
                        <p className='text-gray-500 text-sm mt-2'>Start by adding your first Tesla to the platform.</p>
                    </div>
                    <button onClick={() => navigate('/owner/add-car')} className='mt-4 px-10 py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-xl'>
                        Add Your First Tesla
                    </button>
                </div>
            )}
        </motion.div>
    </motion.div>
  )
}

export default ManageCars
