import React, { useEffect, useState } from 'react'
import eye_icon from '../../assets/eye_icon.svg'
import eye_close_icon from '../../assets/eye_close_icon.svg'
import delete_icon from '../../assets/delete_icon.svg'
import upload_icon from '../../assets/upload_icon.svg' 

import { useAppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

// Weekly 메인: DB는 pricePerDay, 화면에는 주간 가격 표시. weekly = (pricePerDay*7)/1.2
const weeklyFromDaily = (pricePerDay) => Math.round(((pricePerDay || 0) * 7) / 1.2 * 100) / 100

const ManageCars = () => {
  const { axios, currency, fetchCars } = useAppContext()
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCar, setEditingCar] = useState(null) // { _id, weeklyPrice }
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
        if (typeof fetchCars === 'function') fetchCars()
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
        if (typeof fetchCars === 'function') fetchCars()
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const openEditPrice = (car) => {
    setEditingCar({ _id: car._id, model: car.model, weeklyPrice: car.pricePerWeek ?? weeklyFromDaily(car.pricePerDay) })
  }

  const saveCarPrice = async () => {
    if (!editingCar || !editingCar.weeklyPrice || editingCar.weeklyPrice <= 0) {
      toast.error('Enter a valid weekly price')
      return
    }
    try {
      const { data } = await axios.post('/api/owner/update-car-price', { carId: editingCar._id, weeklyPrice: editingCar.weeklyPrice })
      if (data.success) {
        toast.success(data.message)
        setEditingCar(null)
        fetchOwnerCars()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  useEffect(() => {
    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 10000)
    fetchOwnerCars().finally(() => {
      if (!cancelled) {
        clearTimeout(timeout)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [])

  const getCarImage = (car) => {
    // Tesla fleet: use a consistent server image instead of uploaded photos.
    if ((car.brand && car.brand.toLowerCase() === 'tesla') || car.teslaVehicleId) {
      return assets.main_car
    }
    return Array.isArray(car.image) ? car.image[0] : (car.image || upload_icon)
  }

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
                                <th className="px-6 py-6 font-bold">Price / Week</th>
                                <th className="px-6 py-6 font-bold hidden lg:table-cell">Status</th>
                                <th className="px-8 py-6 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-zinc-800/50'>
                            {cars.map((car, index) => (
                                <tr key={index} className='hover:bg-zinc-800/20 transition-colors group'>
                                    <td className='px-8 py-6'>
                                        <div className='flex items-center gap-5'>
                                            <div className='w-20 md:w-28 aspect-video rounded-2xl bg-white flex items-center justify-center overflow-hidden'>
                                                <img src={getCarImage(car)} alt={car.model} className="h-full w-full object-contain p-2 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <div>
                                                <p className='font-bold text-base md:text-lg tracking-tight'>{car.brand} {car.model}</p>
                                                <p className='text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-semibold mt-1'>{car.year || '2026'} • {car.battery_range || 'N/A'} mi Range</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className='px-6 py-6 hidden md:table-cell'><span className='text-gray-300 font-medium'>{car.category || 'N/A'}</span></td>
                                    <td className='px-6 py-6'>
                                        <span className='text-lg font-black'>{currency}{car.pricePerWeek ?? weeklyFromDaily(car.pricePerDay)}</span>
                                        <span className='text-[10px] text-gray-500 ml-1'>/ week</span>
                                        <button type='button' onClick={() => openEditPrice(car)} className='ml-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white border border-zinc-600 hover:border-zinc-500 px-2 py-1 rounded-lg transition-colors'>Edit</button>
                                    </td>
                                    <td className='px-6 py-6 hidden lg:table-cell'>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold border ${car.isAvaliable ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-amber-900/30 text-amber-400 border-amber-800'}`}>
                                            {car.isAvaliable ? "Available" : "Hidden"}
                                        </span>
                                    </td>
                                    <td className='px-8 py-6'>
                                        <div className='flex justify-end gap-2 flex-wrap'>
                                            <button onClick={() => toggleAvailability(car._id)} className='flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white' title={car.isAvaliable ? 'Hide from fleet' : 'Show on fleet'}>
                                                <img src={car.isAvaliable ? eye_close_icon : eye_icon} className={`w-4 h-4 ${car.isAvaliable ? '' : 'invert'}`} alt="" />
                                                <span>{car.isAvaliable ? 'Hide' : 'Show'}</span>
                                            </button>
                                            <button onClick={() => deleteCar(car._id)} className='flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-900/20 hover:bg-red-900/50 border border-red-800/50 text-red-400 hover:text-red-300 transition-colors text-xs font-bold uppercase tracking-wider' title='Remove from fleet'>
                                                <img src={delete_icon} className='w-4 h-4 invert' alt="" />
                                                <span>Remove</span>
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

        {/* Edit Price Modal (Weekly 메인) */}
        {editingCar && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm' onClick={() => setEditingCar(null)}>
            <div className='bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-md w-full shadow-2xl' onClick={e => e.stopPropagation()}>
              <h3 className='text-lg font-bold text-white mb-2'>Edit price · {editingCar.model}</h3>
              <p className='text-[10px] text-gray-500 uppercase tracking-widest mb-4'>Weekly price (daily is auto-calculated with 20% premium)</p>
              <div className='flex items-center gap-2 mb-6'>
                <span className='text-gray-400'>{currency}</span>
                <input
                  type='number'
                  min='1'
                  step='1'
                  value={editingCar.weeklyPrice}
                  onChange={e => setEditingCar({ ...editingCar, weeklyPrice: parseFloat(e.target.value) || 0 })}
                  className='flex-1 bg-zinc-800 border border-zinc-600 text-white px-4 py-3 rounded-xl outline-none focus:border-white'
                />
                <span className='text-gray-500 text-sm'>/ week</span>
              </div>
              <div className='flex gap-3'>
                <button type='button' onClick={() => setEditingCar(null)} className='flex-1 py-3 rounded-xl border border-zinc-600 text-gray-300 hover:bg-zinc-800 transition-colors font-bold text-xs uppercase tracking-widest'>Cancel</button>
                <button type='button' onClick={saveCarPrice} className='flex-1 py-3 rounded-xl bg-white text-black hover:bg-gray-200 font-bold text-xs uppercase tracking-widest transition-colors'>Save</button>
              </div>
            </div>
          </div>
        )}
    </motion.div>
  )
}

export default ManageCars
