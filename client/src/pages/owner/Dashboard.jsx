import React, { useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import { useAppContext } from '../../context/AppContext'
import { motion } from 'framer-motion'

const Dashboard = () => {
    const { axios, isOwner } = useAppContext()
    const currency = import.meta.env.VITE_CURRENCY || '$'
    
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState({
        totalCars: 0, 
        totalBookings: 0, 
        pendingBookings: 0, 
        completedBookings: 0, 
        recentBookings: [], 
        monthlyRevenue: 0
    })

    const fetchDashboardData = async () => {
        try {
            const { data: resData } = await axios.get('/api/owner/dashboard')
            if (resData.success) {
                // 데이터가 비어있어도 resData.dashboardData가 success라면 그 값을 그대로 사용
                setData(resData.dashboardData)
            } else {
                // API는 성공했으나 데이터 구조가 없을 때 초기값 유지
                console.log("No data returned from server")
            }
        } catch (error) { 
            console.log("Dashboard fetch error:", error) 
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        let cancelled = false
        const timeout = setTimeout(() => { if (!cancelled) setLoading(false) }, 10000)
        fetchDashboardData().finally(() => {
            if (!cancelled) {
                clearTimeout(timeout)
                setLoading(false)
            }
        })
        return () => { cancelled = true; clearTimeout(timeout) }
    }, [])

    const dashboardCards = [
        { title: "Monthly Revenue", value: `${currency}${data.monthlyRevenue?.toLocaleString() || 0}`, icon: assets.dashboardIconColored },
        { title: "Active Fleet", value: data.totalCars || 0, icon: assets.carIconColored },
        { title: "Pending Requests", value: data.pendingBookings || 0, icon: assets.cautionIconColored || assets.carIcon },
        { title: "Total Bookings", value: data.totalBookings || 0, icon: assets.listIconColored },
    ]

    if (loading) {
        return <div className='flex-1 flex justify-center items-center min-h-[50vh]'><div className='w-8 h-8 border-4 border-zinc-700 border-t-white rounded-full animate-spin'></div></div>
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='text-white w-full'>
            <div className='mb-10'>
                <h2 className='text-[10px] font-bold tracking-[0.3em] text-gray-500 uppercase mb-2'>Overview</h2>
                <h1 className='text-3xl md:text-4xl font-black tracking-tight'>Platform Performance.</h1>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12'>
                {dashboardCards.map((card, index) => (
                    <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                        className='flex gap-4 items-center justify-between p-6 rounded-3xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm hover:border-gray-600 transition-colors'>
                        <div>
                            <p className='text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1'>{card.title}</p>
                            <p className='text-2xl md:text-3xl font-black tracking-tighter'>{card.value}</p>
                        </div>
                        <div className='flex items-center justify-center w-12 h-12 rounded-full bg-zinc-800/50 border border-zinc-700'>
                            <img src={card.icon} alt="" className='h-5 w-5 object-contain opacity-80' />
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className='bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-3xl p-6 md:p-10'>
                <div className='flex justify-between items-end mb-8'>
                    <h3 className='text-xl font-bold tracking-tight'>Recent Activity</h3>
                </div>

                <div className='overflow-x-auto'>
                    <table className='w-full text-left border-collapse'>
                        <thead>
                            <tr className='border-b border-zinc-800 text-[10px] uppercase tracking-widest text-gray-500'>
                                <th className='pb-4 font-bold'>Vehicle</th>
                                <th className='pb-4 font-bold'>Date</th>
                                <th className='pb-4 font-bold'>Amount</th>
                                <th className='pb-4 font-bold text-right'>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.recentBookings && data.recentBookings.length > 0 ? (
                                data.recentBookings.map((booking, index) => (
                                    <tr key={index} className='border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors'>
                                        <td className='py-5 pr-4'>
                                            <p className='font-bold text-sm text-white'>{booking.car?.brand} {booking.car?.model}</p>
                                        </td>
                                        <td className='py-5 pr-4'>
                                            <p className='text-sm text-gray-400'>{booking.createdAt?.split('T')[0]}</p>
                                        </td>
                                        <td className='py-5 pr-4'>
                                            <p className='text-sm font-medium'>{currency}{booking.price?.toLocaleString()}</p>
                                        </td>
                                        <td className='py-5 text-right'>
                                            <span className={`inline-block px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full border ${
                                                booking.status === 'Confirmed' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 
                                                booking.status === 'Pending' ? 'bg-amber-900/30 text-amber-400 border-amber-800' : 
                                                'bg-red-900/30 text-red-400 border-red-800'
                                            }`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className='py-16 text-center'>
                                        <p className='text-gray-500 text-sm font-light'>No recent booking activity found.</p>
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

export default Dashboard
