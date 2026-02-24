import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const Tesla = () => {
  const { axios } = useAppContext()
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCarId, setSelectedCarId] = useState(null)
  const [chargingSessions, setChargingSessions] = useState(null)
  const [telemetry, setTelemetry] = useState(null)
  const [loadingData, setLoadingData] = useState(false)

  const fetchOwnerCars = async () => {
    try {
      const { data } = await axios.get('/api/owner/cars')
      if (data.success && data.cars?.length) {
        setCars(data.cars)
        if (!selectedCarId && data.cars[0]) setSelectedCarId(data.cars[0]._id)
      }
    } catch (e) {
      toast.error(e.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOwnerCars()
  }, [])

  useEffect(() => {
    if (!selectedCarId) return
    setChargingSessions(null)
    setTelemetry(null)
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const end = new Date().toISOString().slice(0, 10)
    setLoadingData(true)
    Promise.all([
      axios.get(`/api/tesla/charging-sessions/${selectedCarId}?start=${start}&end=${end}`),
      axios.get(`/api/tesla/vehicle-telemetry/${selectedCarId}`)
    ]).then(([sessRes, telRes]) => {
      setChargingSessions(sessRes.data)
      setTelemetry(telRes.data)
    }).catch(() => {
      setChargingSessions({ ok: false, message: 'Tesla API not configured or unavailable' })
      setTelemetry({ ok: false })
    }).finally(() => setLoadingData(false))
  }, [selectedCarId, axios])

  if (loading) {
    return (
      <div className='flex-1 flex justify-center items-center min-h-[50vh]'>
        <div className='w-8 h-8 border-4 border-zinc-700 border-t-white rounded-full animate-spin' />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className='w-full text-white'
    >
      <div className='mb-10'>
        <h2 className='text-[10px] font-bold tracking-[0.3em] text-gray-500 uppercase mb-2'>Fleet API</h2>
        <h1 className='text-3xl md:text-4xl font-black tracking-tight'>Tesla.</h1>
        <p className='text-gray-400 text-sm mt-3 font-light max-w-xl'>
          Charging sessions and vehicle telemetry for your fleet (Tesla Fleet API).
        </p>
      </div>

      {cars.length === 0 ? (
        <div className='rounded-3xl border border-zinc-800 bg-zinc-900/40 p-12 text-center text-gray-400'>
          <p>No cars in your fleet. Add a car first to see Tesla data.</p>
        </div>
      ) : (
        <>
          <div className='mb-6'>
            <label className='text-[10px] font-bold tracking-widest text-gray-500 uppercase block mb-2'>Select vehicle</label>
            <select
              value={selectedCarId || ''}
              onChange={e => setSelectedCarId(e.target.value)}
              className='bg-zinc-900 border border-zinc-700 text-white px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/30'
            >
              {cars.map(c => (
                <option key={c._id} value={c._id}>{c.brand || 'Tesla'} {c.model}</option>
              ))}
            </select>
          </div>

          {loadingData ? (
            <div className='flex justify-center py-12'><div className='w-8 h-8 border-4 border-zinc-700 border-t-white rounded-full animate-spin' /></div>
          ) : (
            <div className='grid md:grid-cols-2 gap-6'>
              <div className='rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6'>
                <h3 className='text-xs font-bold tracking-widest text-gray-500 uppercase mb-4'>Charging sessions</h3>
                {chargingSessions?.ok && chargingSessions.sessions?.length > 0 ? (
                  <ul className='space-y-2 text-sm text-gray-300'>
                    {chargingSessions.sessions.slice(0, 10).map((s, i) => (
                      <li key={i}>{s.startTime || s.start_time || '—'} – {s.endTime || s.end_time || '—'}</li>
                    ))}
                  </ul>
                ) : (
                  <p className='text-gray-500 text-sm'>{chargingSessions?.message || 'No sessions or API not configured.'}</p>
                )}
              </div>
              <div className='rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6'>
                <h3 className='text-xs font-bold tracking-widest text-gray-500 uppercase mb-4'>Vehicle telemetry</h3>
                {telemetry?.ok && telemetry.data ? (
                  <pre className='text-xs text-gray-400 overflow-auto max-h-48'>{JSON.stringify(telemetry.data, null, 2)}</pre>
                ) : (
                  <p className='text-gray-500 text-sm'>Telemetry unavailable or API not configured.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

export default Tesla
