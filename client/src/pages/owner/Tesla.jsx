import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const Tesla = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { axios, token } = useAppContext()
  const [cars, setCars] = useState([])
  const [teslaVehicles, setTeslaVehicles] = useState([])
  const [teslaConnected, setTeslaConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingTeslaList, setLoadingTeslaList] = useState(false)
  const [selectedCarId, setSelectedCarId] = useState(null)
  const [chargingSessions, setChargingSessions] = useState(null)
  const [telemetry, setTelemetry] = useState(null)
  const [vehicleInfo, setVehicleInfo] = useState(null)
  const [loadingData, setLoadingData] = useState(false)
  const [linkPending, setLinkPending] = useState({})
  const [selectedTeslaIds, setSelectedTeslaIds] = useState(new Set())
  const [addingToFleet, setAddingToFleet] = useState(false)
  const [dailyUsage, setDailyUsage] = useState(null)
  const [vehicleFilter, setVehicleFilter] = useState('owner') // 'owner' | 'driver' | 'all'

  // Tesla OAuth redirect must go to the backend (not Vite dev server). In dev, backend is :3000.
  const apiOrigin = import.meta.env.DEV ? (import.meta.env.VITE_BASE_URL || 'http://localhost:3000') : (import.meta.env.VITE_BASE_URL || window.location.origin)
  const teslaAuthUrl = (apiOrigin.replace(/\/$/, '')) + '/api/tesla/auth?token=' + encodeURIComponent(token || '')

  const connectTesla = async () => {
    if (!token) {
      toast.error('Please sign in to connect Tesla.')
      return
    }
    try {
      const base = apiOrigin.replace(/\/$/, '')
      const res = await fetch(`${base}/api/tesla/status`, { method: 'GET', credentials: 'include', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok && res.status !== 401) throw new Error('Server not reachable')
    } catch (e) {
      toast.error(`Cannot reach the server at ${apiOrigin}. Make sure the backend is running (e.g. \`npm run dev\` in the server folder).`)
      return
    }
    window.location.href = teslaAuthUrl
  }

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

  const fetchTeslaVehicles = async () => {
    setLoadingTeslaList(true)
    try {
      const { data } = await axios.get('/api/tesla/vehicles')
      const list = Array.isArray(data.vehicles) ? data.vehicles : []
      setTeslaVehicles(list)
      if (!data.success && data.message) toast.error(data.message)
      if (data.success && list.length === 0) toast('No vehicles in your Tesla account.', { icon: 'ℹ️' })
    } catch (e) {
      setTeslaVehicles([])
      toast.error(e.response?.data?.message || 'Could not load Tesla vehicles')
    } finally {
      setLoadingTeslaList(false)
    }
  }

  const linkCarToTesla = async (carId, teslaVehicleId) => {
    setLinkPending(p => ({ ...p, [carId]: true }))
    try {
      const { data } = await axios.post('/api/owner/link-tesla', { carId, teslaVehicleId: teslaVehicleId || undefined })
      if (data.success) {
        toast.success(data.message)
        await fetchOwnerCars()
      } else toast.error(data.message || 'Link failed')
    } catch (e) {
      toast.error(e.response?.data?.message || e.message)
    } finally {
      setLinkPending(p => ({ ...p, [carId]: false }))
    }
  }

  const getTeslaVehicleId = (tv) => tv.id_s ?? String(tv.id ?? tv.vehicle_id ?? tv.vin ?? '')

  const toggleTeslaSelection = (id) => {
    setSelectedTeslaIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const addSelectedToFleet = async () => {
    if (selectedTeslaIds.size === 0) return
    setAddingToFleet(true)
    try {
      const { data } = await axios.post('/api/owner/add-cars-from-tesla', {
        teslaVehicleIds: Array.from(selectedTeslaIds),
      })
      if (data.success) {
        toast.success(data.message)
        setSelectedTeslaIds(new Set())
        await fetchOwnerCars()
        if (data.created?.length && !selectedCarId) setSelectedCarId(data.created[0]._id)
      } else toast.error(data.message || 'Failed to add vehicles')
    } catch (e) {
      toast.error(e.response?.data?.message || e.message)
    } finally {
      setAddingToFleet(false)
    }
  }

  const fetchDailyUsage = async (carId) => {
    try {
      const { data } = await axios.get(`/api/tesla/usage/${carId}/daily?days=7`)
      if (data.success) setDailyUsage(data.usage || [])
      else setDailyUsage(null)
    } catch {
      setDailyUsage(null)
    }
  }

  useEffect(() => {
    fetchOwnerCars()
  }, [])

  useEffect(() => {
    const q = searchParams.get('tesla')
    if (q === 'connected') {
      toast.success('Tesla account connected. You can now load your vehicles.')
      setTeslaConnected(true)
      fetchTeslaVehicles()
      setSearchParams({}, { replace: true })
    } else if (q === 'error') {
      toast.error(searchParams.get('message') || 'Tesla connection failed.')
      setSearchParams({}, { replace: true })
    }
  }, [searchParams])

  useEffect(() => {
    if (!token) return
    axios.get('/api/tesla/status').then(({ data }) => data.success && data.connected && setTeslaConnected(true)).catch(() => {})
  }, [token, axios])

  useEffect(() => {
    if (!selectedCarId) return
    setChargingSessions(null)
    setTelemetry(null)
    setVehicleInfo(null)
    setDailyUsage(null)
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const end = new Date().toISOString().slice(0, 10)
    const selectedCar = cars.find(c => c._id === selectedCarId)
    setLoadingData(true)
    const promises = [
      axios.get(`/api/tesla/charging-sessions/${selectedCarId}?start=${start}&end=${end}`),
      axios.get(`/api/tesla/vehicle-telemetry/${selectedCarId}`)
    ]
    if (selectedCar?.teslaVehicleId) {
      promises.push(axios.get(`/api/tesla/vehicles/${encodeURIComponent(selectedCar.teslaVehicleId)}`))
    }
    Promise.all(promises)
      .then(([sessRes, telRes, vehicleRes]) => {
        setChargingSessions(sessRes.data)
        setTelemetry(telRes.data)
        if (vehicleRes?.data?.ok && vehicleRes.data.data) setVehicleInfo(vehicleRes.data.data)
        else setVehicleInfo(null)
      })
      .catch(() => {
        setChargingSessions({ ok: false, message: 'Tesla API not configured or unavailable' })
        setTelemetry({ ok: false })
        setVehicleInfo(null)
      })
      .finally(() => setLoadingData(false))

    // Load recent daily usage (based on odometer snapshots).
    fetchDailyUsage(selectedCarId)
  }, [selectedCarId, axios, cars])

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

      {/* Tesla: Connect → Sync → list vehicles → select → Add to fleet */}
      <div className='rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 mb-6'>
        <h3 className='text-xs font-bold tracking-widest text-gray-500 uppercase mb-3'>Tesla – add vehicles to fleet</h3>
        <p className='text-gray-400 text-sm mb-4'>
          Connect Tesla to load your vehicles, then select which ones to add to your Mongoori fleet. You can set price and details in Manage Cars after adding.
        </p>
        <div className='flex flex-wrap items-center gap-3'>
          {!teslaConnected ? (
            <button
              type='button'
              onClick={connectTesla}
              className='bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-200'
            >
              Connect Tesla
            </button>
          ) : (
            <>
              <span className='text-emerald-400 text-sm font-medium'>Tesla connected</span>
              <button
                type='button'
                onClick={fetchTeslaVehicles}
                disabled={loadingTeslaList}
                className='bg-white text-black px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-200 disabled:opacity-50'
              >
                {loadingTeslaList ? 'Loading…' : 'Sync Tesla'}
              </button>
            </>
          )}
        </div>
        {teslaVehicles.length > 0 ? (
          <div className='mt-5'>
            <div className='flex items-center justify-between mb-3'>
              <p className='text-[10px] font-bold tracking-widest text-gray-500 uppercase'>Your Tesla vehicles – select to add to fleet</p>
              <div className='flex items-center gap-4'>
                <div className='hidden md:flex items-center gap-1 text-[10px]'>
                  <button
                    type='button'
                    onClick={() => setVehicleFilter('owner')}
                    className={`px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${
                      vehicleFilter === 'owner'
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900 text-gray-400 border-zinc-700 hover:border-gray-500'
                    }`}
                  >
                    Owner
                  </button>
                  <button
                    type='button'
                    onClick={() => setVehicleFilter('driver')}
                    className={`px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${
                      vehicleFilter === 'driver'
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900 text-gray-400 border-zinc-700 hover:border-gray-500'
                    }`}
                  >
                    Driver
                  </button>
                  <button
                    type='button'
                    onClick={() => setVehicleFilter('all')}
                    className={`px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${
                      vehicleFilter === 'all'
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900 text-gray-400 border-zinc-700 hover:border-gray-500'
                    }`}
                  >
                    All
                  </button>
                </div>
                {(() => {
                  const baseList = teslaVehicles.filter(tv =>
                    vehicleFilter === 'owner'
                      ? tv.isOwner !== false
                      : vehicleFilter === 'driver'
                        ? tv.isOwner === false
                        : true
                  )
                  const selectableIds = baseList
                    .filter(tv => tv.isOwner !== false)
                    .map(tv => getTeslaVehicleId(tv))
                    .filter(id => !cars.some(c => c.teslaVehicleId === id))
                  const allSelectableSelected = selectableIds.length > 0 && selectableIds.every(id => selectedTeslaIds.has(id))
                  return (
                    <label className='flex items-center gap-2 text-[11px] text-gray-300'>
                      <input
                        type='checkbox'
                        checked={allSelectableSelected}
                        onChange={() => {
                          setSelectedTeslaIds(() => {
                            if (allSelectableSelected) return new Set()
                            return new Set(selectableIds)
                          })
                        }}
                        className='rounded border-zinc-600 bg-zinc-800 text-white focus:ring-white/30'
                      />
                      <span>Select all</span>
                    </label>
                  )
                })()}
              </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4'>
              {teslaVehicles
                .filter(tv =>
                  vehicleFilter === 'owner'
                    ? tv.isOwner !== false
                    : vehicleFilter === 'driver'
                      ? tv.isOwner === false
                      : true
                )
                .map(tv => {
                  const id = getTeslaVehicleId(tv)
                  const alreadyInFleet = cars.some(c => c.teslaVehicleId === id)
                  const label = tv.display_name || tv.vin || id || 'Vehicle'
                  const state = tv.state || vehicleInfo?.state
                  const modelName = tv.vehicle_config?.car_type || tv.vehicle_config?.trim_badging || ''
                  const isOwner = tv.isOwner !== false
                  return (
                    <div
                      key={id}
                      className='flex flex-col bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden hover:border-gray-500 transition-all'
                    >
                      <div className='relative w-full aspect-[4/3] bg-black flex items-center justify-center'>
                        <img
                          src={assets.main_car}
                          alt={label}
                          className='w-full h-full object-contain opacity-90'
                        />
                        <span className={`absolute top-2 left-2 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest ${
                          isOwner
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        }`}>
                          {isOwner ? 'Owner' : 'Driver'}
                        </span>
                      </div>
                      <div className='p-4 space-y-2'>
                        <div className='flex items-center justify-between gap-2'>
                          <div>
                            <p className='text-sm font-semibold text-white truncate'>
                              {label}
                            </p>
                            <p className='text-[11px] text-gray-500 truncate'>
                              {modelName || 'Tesla'}{tv.vin ? ` · •${tv.vin.slice(-4)}` : ''}
                            </p>
                          </div>
                          {state && (
                            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-widest ${
                              state === 'online'
                                ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-500/40'
                                : 'bg-zinc-800 text-gray-400 border border-zinc-700'
                            }`}>
                              {state}
                            </span>
                          )}
                        </div>
                        <div className='flex items-center justify-between gap-2 pt-1'>
                          <label className='flex items-center gap-2 text-xs text-gray-300'>
                            <input
                              type='checkbox'
                              checked={selectedTeslaIds.has(id)}
                              onChange={() => isOwner && !alreadyInFleet && toggleTeslaSelection(id)}
                              disabled={alreadyInFleet || !isOwner}
                              className='rounded border-zinc-600 bg-zinc-800 text-white focus:ring-white/30 disabled:opacity-60'
                            />
                            <span>
                              {alreadyInFleet
                                ? 'Already in fleet'
                                : isOwner
                                  ? 'Add to fleet'
                                  : 'Driver vehicle – cannot list'}
                            </span>
                          </label>
                          {alreadyInFleet && (
                            <span className='text-[10px] text-emerald-400 font-semibold uppercase tracking-widest'>
                              Linked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
            <button
              type='button'
              onClick={addSelectedToFleet}
              disabled={selectedTeslaIds.size === 0 || addingToFleet}
              className='bg-white text-black px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-200 disabled:opacity-50'
            >
              {addingToFleet ? 'Adding…' : `Add selected to fleet (${selectedTeslaIds.size})`}
            </button>
          </div>
        ) : (
          loadingTeslaList ? null : (
            <p className='mt-4 text-gray-500 text-sm'>
              After syncing, all vehicles from your Tesla account will appear here. If the list is empty, your account may have no vehicles or the token may have expired.
            </p>
          )
        )}
      </div>

      {cars.length > 0 && (
        <>
          {/* Link existing Mongoori listings to Tesla (for charging/telemetry) */}
          <div className='rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 mb-6'>
            <h3 className='text-xs font-bold tracking-widest text-gray-500 uppercase mb-3'>Link listings to Tesla</h3>
            <p className='text-gray-400 text-sm mb-4'>Match each fleet listing to a Tesla vehicle for charging sessions and telemetry.</p>
            {teslaVehicles.length > 0 && (
              <div className='space-y-3'>
                {cars.map(c => (
                  <div key={c._id} className='flex flex-wrap items-center gap-3 text-sm'>
                    <span className='text-white font-medium'>{c.brand || 'Tesla'} {c.model}</span>
                    <span className='text-gray-500'>→</span>
                    <select
                      value={c.teslaVehicleId || ''}
                      onChange={e => linkCarToTesla(c._id, e.target.value || null)}
                      disabled={linkPending[c._id]}
                      className='bg-zinc-800 border border-zinc-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-white/30'
                    >
                      <option value=''>Not linked</option>
                      {teslaVehicles.map(tv => (
                        <option key={getTeslaVehicleId(tv)} value={getTeslaVehicleId(tv)}>
                          {tv.display_name || tv.vin || 'Vehicle'}
                          {tv.vin ? ` (${tv.vin})` : ''}
                        </option>
                      ))}
                    </select>
                    {linkPending[c._id] && <span className='text-gray-500 text-xs'>Saving…</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className='mb-6'>
            <label className='text-[10px] font-bold tracking-widest text-gray-500 uppercase block mb-2'>Select vehicle</label>
            <select
              value={selectedCarId || ''}
              onChange={e => setSelectedCarId(e.target.value)}
              className='bg-zinc-900 border border-zinc-700 text-white px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/30'
            >
              {cars.map(c => (
                <option key={c._id} value={c._id}>{c.brand || 'Tesla'} {c.model}{c.teslaVehicleId ? ' (linked)' : ''}</option>
              ))}
            </select>
          </div>

          {loadingData ? (
            <div className='flex justify-center py-12'><div className='w-8 h-8 border-4 border-zinc-700 border-t-white rounded-full animate-spin' /></div>
          ) : (
            <div className='grid md:grid-cols-2 gap-6'>
              {vehicleInfo && (
                <div className='md:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6'>
                  <h3 className='text-xs font-bold tracking-widest text-gray-500 uppercase mb-4'>Vehicle info (Tesla API)</h3>
                  <dl className='grid grid-cols-2 gap-2 text-sm'>
                    {vehicleInfo.display_name != null && <><dt className='text-gray-500'>Display name</dt><dd className='text-white'>{vehicleInfo.display_name}</dd></>}
                    {vehicleInfo.vin != null && <><dt className='text-gray-500'>VIN</dt><dd className='text-white font-mono'>{vehicleInfo.vin}</dd></>}
                    {vehicleInfo.state != null && <><dt className='text-gray-500'>State</dt><dd className='text-white'>{vehicleInfo.state}</dd></>}
                    {vehicleInfo.id != null && <><dt className='text-gray-500'>Vehicle ID</dt><dd className='text-white font-mono text-xs'>{vehicleInfo.id}</dd></>}
                  </dl>
                </div>
              )}
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
                  <p className='text-gray-500 text-sm'>{telemetry?.message || 'Telemetry unavailable or API not configured.'}</p>
                )}
              </div>
              <div className='rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6'>
                <h3 className='text-xs font-bold tracking-widest text-gray-500 uppercase mb-4'>Usage (last 7 days)</h3>
                {dailyUsage && dailyUsage.length > 0 ? (
                  <ul className='space-y-2 text-sm text-gray-300'>
                    {dailyUsage.slice().reverse().map((u, idx) => (
                      <li key={idx} className='flex items-center justify-between'>
                        <span className='text-gray-400'>{u.date}</span>
                        <span className='font-medium'>{u.distance.toFixed(1)} mi</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className='text-gray-500 text-sm'>Daily mileage will appear here after telemetry has been fetched over time.</p>
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
