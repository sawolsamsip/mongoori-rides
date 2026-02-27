import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'
import { motion } from 'framer-motion'

const Admin = () => {
  const { token, user, axios } = useAppContext()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      navigate('/')
      return
    }
    axios.get('/api/admin/dashboard')
      .then(({ data: res }) => setData(res))
      .catch(() => setData({ success: false }))
      .finally(() => setLoading(false))
  }, [token, user, axios, navigate])

  if (user?.role !== 'admin') return null
  if (loading) {
    return (
      <div className='min-h-screen bg-black flex items-center justify-center'>
        <div className='w-10 h-10 border-4 border-zinc-700 border-t-white rounded-full animate-spin' />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-black text-white pt-28 pb-20 px-6 md:px-16'>
      <div className='max-w-3xl mx-auto'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-12'
        >
          <h1 className='text-3xl md:text-4xl font-black tracking-tight'>Operator Dashboard</h1>
          <p className='text-gray-400 mt-2 text-sm'>
            Platform overview and Tesla Fleet integration status.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className='mb-10 p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800'
        >
          <h2 className='text-sm font-bold text-gray-300 uppercase tracking-widest mb-3'>What you can do as Operator</h2>
          <ul className='text-gray-400 text-sm space-y-2'>
            <li>• <strong className='text-white'>This dashboard</strong> — View user count, owner count, registered cars, and bookings.</li>
            <li>• <strong className='text-white'>Tesla Fleet Partner</strong> — With token in server .env, owners and drivers get charging/telemetry without connecting Tesla per account.</li>
            <li>• <strong className='text-white'>Owner portal</strong> — If this account is also an owner, you can use Manage Cars, Bookings, etc. as usual.</li>
          </ul>
          <p className='text-gray-500 text-xs mt-4'>
            Request additional features (e.g. booking list, user list, hide car) from development if needed.
          </p>
        </motion.div>

        {data?.success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='space-y-6'
          >
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {[
                { label: 'Users', value: data.stats?.userCount ?? '—' },
                { label: 'Owners', value: data.stats?.ownerCount ?? '—' },
                { label: 'Cars', value: data.stats?.carCount ?? '—' },
                { label: 'Bookings', value: data.stats?.bookingCount ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className='bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6'>
                  <p className='text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1'>{label}</p>
                  <p className='text-2xl font-black text-white'>{value}</p>
                </div>
              ))}
            </div>

            <div className='bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6'>
              <h2 className='text-xs font-bold text-gray-500 uppercase tracking-widest mb-3'>Tesla Fleet Partner</h2>
              <p className={`text-sm font-medium ${data.teslaPartnerConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
                {data.teslaPartnerConfigured ? 'Configured' : 'Not configured'}
              </p>
              <p className='text-gray-400 text-sm mt-2'>{data.message}</p>
              <p className='text-gray-500 text-xs mt-3'>
                Set <code className='bg-zinc-800 px-1 rounded'>TESLA_PARTNER_ACCESS_TOKEN</code> or <code className='bg-zinc-800 px-1 rounded'>TESLA_ACCESS_TOKEN</code> in server .env so owners and drivers can see charging and telemetry without connecting Tesla.
              </p>
            </div>
          </motion.div>
        )}

        {data && !data.success && (
          <p className='text-red-400 text-sm'>Could not load admin dashboard.</p>
        )}
      </div>
    </div>
  )
}

export default Admin
