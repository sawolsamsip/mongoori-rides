import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const ManageBookings = () => {
  const { currency, axios } = useAppContext()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOwnerBookings = async () => {
    try {
      const { data } = await axios.get('/api/bookings/owner')
      if (data.success) {
        setBookings(data.bookings)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const changeBookingStatus = async (bookingId, status) => {
    try {
      const { data } = await axios.post('/api/bookings/change-status', { bookingId, status })
      if (data.success) {
        toast.success(data.message)
        fetchOwnerBookings()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const deleteBookingRecord = async (bookingId) => {
    if (!window.confirm('Delete this booking record permanently? This cannot be undone.')) return
    try {
      const { data } = await axios.post('/api/bookings/delete', { bookingId })
      if (data.success) {
        toast.success(data.message)
        fetchOwnerBookings()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  useEffect(() => {
    fetchOwnerBookings()
  }, [])

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
        <div className='mb-10'>
            <h2 className='text-[10px] font-bold tracking-[0.3em] text-gray-500 uppercase mb-2'>Reservation Center</h2>
            <h1 className='text-3xl md:text-4xl font-black tracking-tight'>Manage Bookings.</h1>
            <p className='text-gray-400 text-sm mt-3 font-light max-w-xl'>
                Track and manage all customer rental requests. Approve or decline pending reservations.
            </p>
        </div>

        {/* 예약 리스트 테이블 */}
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
                        <th className="px-8 py-6 font-bold">Booking Details</th>
                        <th className="px-6 py-6 font-bold hidden md:table-cell">Duration</th>
                        <th className="px-6 py-6 font-bold">Total Revenue</th>
                        <th className="px-6 py-6 font-bold hidden lg:table-cell">Status</th>
                        <th className="px-8 py-6 font-bold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className='divide-y divide-zinc-800/50'>
                    {bookings && bookings.length > 0 ? (
                        bookings.map((booking, index) => (
                        <tr key={index} className='hover:bg-zinc-800/20 transition-colors group'>
                            
                            {/* 1. 차량 정보 및 예약 ID */}
                            <td className='px-8 py-6'>
                                <div className='flex items-center gap-5'>
                                    <div className='w-20 md:w-28 aspect-video rounded-xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0'>
                                        <img 
                                            src={Array.isArray(booking.car?.image) ? booking.car.image[0] : (booking.car?.image || assets.main_car)} 
                                            alt={booking.car?.model || "Car"} 
                                            className="h-full w-full object-contain p-2 group-hover:scale-110 transition-transform"
                                        />
                                    </div>
                                    <div>
                                        <p className='font-bold text-base md:text-lg tracking-tight'>{booking.car?.brand} {booking.car?.model}</p>
                                        <p className='text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-semibold mt-1'>
                                            ID: {booking._id?.toString().slice(-6).toUpperCase() || 'UNKNOWN'}
                                        </p>
                                    </div>
                                </div>
                            </td>
                            
                            {/* 2. 대여 기간 */}
                            <td className='px-6 py-6 hidden md:table-cell'>
                                <p className='text-gray-300 font-medium'>{new Date(booking.pickupDate).toLocaleDateString()}</p>
                                <div className='flex items-center gap-2 mt-1'>
                                    <div className='w-1 h-1 bg-zinc-600 rounded-full'></div>
                                    <p className='text-gray-500 text-xs'>{new Date(booking.returnDate).toLocaleDateString()}</p>
                                </div>
                            </td>

                            {/* 3. 가격 */}
                            <td className='px-6 py-6'>
                                <span className='text-lg font-black'>{currency}{booking.price?.toLocaleString()}</span>
                            </td>

                            {/* 4. 현재 상태 */}
                            <td className='px-6 py-6 hidden lg:table-cell'>
                                <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold border ${
                                    booking.status === 'confirmed' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 
                                    booking.status === 'pending' ? 'bg-amber-900/30 text-amber-400 border-amber-800' : 
                                    'bg-red-900/30 text-red-400 border-red-800'
                                }`}>
                                    {booking.status}
                                </span>
                            </td>

                            {/* 5. 액션 (승인/거절 Select + 삭제) */}
                            <td className='px-8 py-6 text-right'>
                                <div className='flex flex-col sm:flex-row items-end gap-2 justify-end'>
                                    {booking.status === 'pending' ? (
                                        <select 
                                            onChange={e => changeBookingStatus(booking._id, e.target.value)} 
                                            value={booking.status} 
                                            className='appearance-none bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-bold uppercase tracking-widest px-6 py-3 rounded-full border border-zinc-700 outline-none cursor-pointer transition-colors text-center w-36 shadow-lg'
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirm ✓</option>
                                            <option value="cancelled">Decline ✕</option>
                                        </select>
                                    ) : (
                                        <span className='text-xs text-gray-500 font-bold uppercase tracking-widest'>
                                            {booking.status === 'confirmed' ? 'Resolved ✓' : 'Closed ✕'}
                                        </span>
                                    )}
                                    <button
                                        type='button'
                                        onClick={() => deleteBookingRecord(booking._id)}
                                        className='text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 border border-red-500/50 hover:border-red-500 px-4 py-2 rounded-full transition-colors'
                                    >
                                        Delete
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
                                        <img src={assets.listIcon} alt="" className='w-6 opacity-40 invert' />
                                    </div>
                                    <p className='text-gray-400 font-light text-lg'>No customer bookings found yet.</p>
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

export default ManageBookings
