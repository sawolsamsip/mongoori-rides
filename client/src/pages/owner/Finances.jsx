import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { motion } from 'framer-motion'

const Finances = () => {
  const { axios } = useAppContext()
  const currency = import.meta.env.VITE_CURRENCY || '$'
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState([])
  const [dashboardData, setDashboardData] = useState({
    monthlyRevenue: 0,
    totalBookings: 0,
    pendingBookings: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, dashRes] = await Promise.all([
          axios.get('/api/invoices/owner/list'),
          axios.get('/api/owner/dashboard'),
        ])
        if (invRes.data?.success) setInvoices(invRes.data.invoices || [])
        if (dashRes.data?.success && dashRes.data.dashboardData) {
          setDashboardData(dashRes.data.dashboardData)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [axios])

  const paidInvoices = invoices.filter((i) => i.status === 'paid')
  const totalRevenue = paidInvoices.reduce((sum, i) => sum + (i.amount || 0), 0)
  const cancelledCount = invoices.filter((i) => i.status === 'cancelled').length

  if (loading) {
    return (
      <div className='flex-1 flex justify-center items-center min-h-[50vh]'>
        <div className='w-8 h-8 border-4 border-zinc-700 border-t-white rounded-full animate-spin' />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='text-white w-full'>
      <div className='mb-10'>
        <h2 className='text-[10px] font-bold tracking-[0.3em] text-gray-500 uppercase mb-2'>Finances</h2>
        <h1 className='text-3xl md:text-4xl font-black tracking-tight'>Revenue & Invoices.</h1>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12'>
        <div className='flex gap-4 items-center justify-between p-6 rounded-3xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm'>
          <div>
            <p className='text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1'>Total revenue (invoices)</p>
            <p className='text-2xl font-black tracking-tighter'>{currency}{totalRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className='flex gap-4 items-center justify-between p-6 rounded-3xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm'>
          <div>
            <p className='text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1'>Monthly revenue</p>
            <p className='text-2xl font-black tracking-tighter'>{currency}{(dashboardData.monthlyRevenue || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className='flex gap-4 items-center justify-between p-6 rounded-3xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm'>
          <div>
            <p className='text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1'>Invoices (paid / cancelled)</p>
            <p className='text-2xl font-black tracking-tighter'>{paidInvoices.length} / {cancelledCount}</p>
          </div>
        </div>
      </div>

      <div className='bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-3xl p-6 md:p-10'>
        <h3 className='text-xl font-bold tracking-tight mb-6'>All Invoices</h3>
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse'>
            <thead>
              <tr className='border-b border-zinc-800 text-[10px] uppercase tracking-widest text-gray-500'>
                <th className='pb-4 font-bold'>Invoice #</th>
                <th className='pb-4 font-bold'>Vehicle</th>
                <th className='pb-4 font-bold'>Guest</th>
                <th className='pb-4 font-bold'>Date</th>
                <th className='pb-4 font-bold'>Amount</th>
                <th className='pb-4 font-bold text-right'>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv._id} className='border-b border-zinc-800/50 hover:bg-zinc-800/20'>
                    <td className='py-5 pr-4 font-mono text-sm'>{inv.invoiceNumber}</td>
                    <td className='py-5 pr-4'>
                      {inv.booking?.car ? `${inv.booking.car.brand || 'Tesla'} ${inv.booking.car.model}` : '—'}
                    </td>
                    <td className='py-5 pr-4 text-gray-300'>{inv.booking?.user?.name || '—'}</td>
                    <td className='py-5 pr-4 text-gray-400 text-sm'>
                      {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className='py-5 pr-4 font-medium'>{currency}{Number(inv.amount).toLocaleString()}</td>
                    <td className='py-5 text-right'>
                      <span className={`inline-block px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full border ${
                        inv.status === 'paid' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' :
                        inv.status === 'cancelled' ? 'bg-red-900/30 text-red-400 border-red-800' :
                        'bg-zinc-700 text-gray-400 border-zinc-600'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className='py-16 text-center text-gray-500 text-sm'>No invoices yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className='mt-8 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/20'>
        <p className='text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2'>Coming soon</p>
        <p className='text-gray-400 text-sm'>Payouts, Supercharge/Tolls line items on invoices, and incident reports will appear here.</p>
      </div>
    </motion.div>
  )
}

export default Finances
