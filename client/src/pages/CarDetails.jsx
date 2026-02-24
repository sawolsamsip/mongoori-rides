import React, { useEffect, useMemo, useState } from 'react'
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
  const [billingMode, setBillingMode] = useState('weekly')
  const [numberOfWeeks, setNumberOfWeeks] = useState(1) // Weekly 모드일 때만 사용 (1, 2, 3…)
  const [availableForSelectedDates, setAvailableForSelectedDates] = useState(null)
  
  const currency = import.meta.env.VITE_CURRENCY || '$' 

  // Irvine (PST/PDT) 기준 오늘 날짜
  const today = useMemo(() => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
  }, [])

  // Add days in UTC so weekly is exactly 7/14/21 days (no timezone off-by-one)
  const addDaysUTC = (dateStr, days) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const utc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
    utc.setUTCDate(utc.getUTCDate() + days)
    return utc.toISOString().slice(0, 10)
  }

  const pricing = useMemo(() => {
    if (!car) {
      return { baseDaily: 0, weeklyPerWeek: 0, dailyFromWeekly: 0, dailyEquivalentOfWeekly: 0 }
    }
    const baseDaily = Number(car.pricePerDay || car.price || 0)
    const weeklyPerWeek = car.pricePerWeek != null
      ? Number(car.pricePerWeek)
      : baseDaily ? Math.round(((baseDaily * 7) / 1.2) * 100) / 100 : 0
    const dailyFromWeeklyRaw = weeklyPerWeek ? (weeklyPerWeek * 1.2) / 7 : 0
    const dailyFromWeekly = Math.round(dailyFromWeeklyRaw * 100) / 100
    // 주간 예약 시 일당 환산 (메인/카드에 표시할 가격): weekly/7 = $71.43
    const dailyEquivalentOfWeekly = weeklyPerWeek ? Math.round((weeklyPerWeek / 7) * 100) / 100 : 0

    return { baseDaily, weeklyPerWeek, dailyFromWeekly, dailyEquivalentOfWeekly }
  }, [car])

  const weeksForSelection = useMemo(() => {
    if (!pickupDate || !returnDate) return null
    const picked = new Date(pickupDate)
    const returned = new Date(returnDate)
    const diff = returned - picked
    if (Number.isNaN(diff) || diff <= 0) return null
    const noOfDays = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (noOfDays % 7 !== 0) return null
    return noOfDays / 7
  }, [pickupDate, returnDate])

  const totalForPeriod = useMemo(() => {
    if (!car) return null
    if (billingMode === 'weekly') {
      const weeklyRate = car.pricePerWeek ?? pricing.weeklyPerWeek ?? 0
      return (weeklyRate || 0) * (numberOfWeeks || 1)
    }
    if (!pickupDate || !returnDate) return null
    const picked = new Date(pickupDate)
    const returned = new Date(returnDate)
    const noOfDays = Math.ceil((returned - picked) / (1000 * 60 * 60 * 24))
    if (noOfDays <= 0) return null
    return (pricing.baseDaily || 0) * noOfDays
  }, [pickupDate, returnDate, car, billingMode, pricing, numberOfWeeks])

  const daysForPeriod = useMemo(() => {
    if (billingMode !== 'daily') return null
    if (!pickupDate || !returnDate) return null
    const picked = new Date(pickupDate)
    const returned = new Date(returnDate)
    const noOfDays = Math.ceil((returned - picked) / (1000 * 60 * 60 * 24))
    if (noOfDays <= 0) return null
    return noOfDays
  }, [billingMode, pickupDate, returnDate])

  // Weekly 모드: 주 수 선택 시 반납일 자동 설정 (UTC 기준으로 정확히 7*n일)
  useEffect(() => {
    if (billingMode !== 'weekly' || !pickupDate || numberOfWeeks < 1) return
    setReturnDate(addDaysUTC(pickupDate, numberOfWeeks * 7))
  }, [billingMode, pickupDate, numberOfWeeks])

  const returnDateMinForDaily = pickupDate || today
  const handleReturnDateChange = (val) => setReturnDate(val)

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
       toast.error("Please sign in to reserve a car.");
       if(setShowLogin) setShowLogin(true);
       return;
    }

    // Pickup is fixed to today
    const effectivePickupDate = today;

    // Weekly: derive return date from pickup + numberOfWeeks (UTC so exactly 7*n days)
    let effectiveReturnDate = returnDate;
    if (billingMode === 'weekly' && numberOfWeeks >= 1) {
      effectiveReturnDate = addDaysUTC(effectivePickupDate, numberOfWeeks * 7);
    }

    if (!effectiveReturnDate) {
      toast.error("Please select return date or number of weeks.");
      return;
    }

    if (new Date(effectivePickupDate) > new Date(effectiveReturnDate)) {
      toast.error("Return date cannot be earlier than pickup date.");
      return;
    }

    const noOfDays = billingMode === 'weekly' && numberOfWeeks >= 1
      ? numberOfWeeks * 7
      : Math.ceil((new Date(effectiveReturnDate) - new Date(effectivePickupDate)) / (1000 * 60 * 60 * 24));
    if (noOfDays <= 0) {
      toast.error("Please choose at least 1 day.");
      return;
    }

    if (billingMode === 'weekly' && noOfDays % 7 !== 0) {
      toast.error("Weekly plan is only available for 7, 14, 21 days, etc.");
      return;
    }

    if (availableForSelectedDates === false) {
      toast.error("This vehicle is not available for the selected dates. Please choose different dates.");
      return;
    }

    try {
      const { data } = await axios.post('/api/payment/create-checkout-session', {
        car: id,
        pickupDate: effectivePickupDate,
        returnDate: effectiveReturnDate,
        billingMode,
      })
      if (data.success && data.url) {
        toast.success('Redirecting to secure payment…')
        window.location.href = data.url
      } else {
        toast.error(data.message || 'Could not start payment')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0); 
    if (cars && cars.length > 0) {
      setCar(cars.find(c => c._id === id))
    }
  }, [cars, id])

  // 픽업일을 오늘로 고정 (내일/다음주 예약으로 인한 블로킹 방지)
  useEffect(() => {
    setPickupDate(today)
  }, [today, setPickupDate])

  // Daily → Weekly 전환 시 주 수 1로 리셋
  useEffect(() => {
    if (billingMode === 'weekly') setNumberOfWeeks(prev => (prev < 1 ? 1 : prev))
  }, [billingMode])

  // 선택한 날짜에 예약 가능한지 체크 (Booked 구간과 겹치면 결제 불가)
  useEffect(() => {
    let effectiveReturn = returnDate
    if (billingMode === 'weekly' && pickupDate && numberOfWeeks >= 1) {
      effectiveReturn = addDaysUTC(pickupDate, numberOfWeeks * 7)
    }
    if (!id || !pickupDate || !effectiveReturn || new Date(pickupDate) > new Date(effectiveReturn)) {
      setAvailableForSelectedDates(null)
      return
    }
    let cancelled = false
    setAvailableForSelectedDates(null)
    axios.get('/api/bookings/check-dates', { params: { carId: id, pickup: pickupDate, return: effectiveReturn } })
      .then(({ data }) => { if (!cancelled) setAvailableForSelectedDates(!!data.available) })
      .catch(() => { if (!cancelled) setAvailableForSelectedDates(false) })
    return () => { cancelled = true }
  }, [id, pickupDate, returnDate, billingMode, numberOfWeeks, axios])

  return car ? (
    <div className='bg-black min-h-screen pt-32 pb-24 px-6 md:px-16 lg:px-24 xl:px-32 text-white'>
      
      <button onClick={() => navigate(-1)} className='flex items-center gap-2 mb-10 text-gray-500 hover:text-white transition-colors cursor-pointer group uppercase tracking-widest text-xs font-bold'>
        <img src={assets.arrow_icon} alt="Back" className='rotate-180 opacity-50 group-hover:opacity-100 transition-opacity w-4'/>
        <span>Back to Fleet</span>
      </button>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-16'>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className='lg:col-span-2'>
          
          <div className='w-full aspect-video bg-white rounded-[2rem] md:rounded-[3rem] mb-10 flex items-center justify-center overflow-hidden p-8'>
              <motion.img 
                initial={{ scale: 0.95, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ delay: 0.2, duration: 0.8 }} 
                src={car.image || assets.main_car} 
                alt={car.model} 
                className='w-full h-full object-contain' 
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
            <div className='border-b border-zinc-800 pb-8 space-y-4'>
              <div className='flex items-end gap-2'>
                <span className='text-5xl font-black tracking-tighter text-white'>
                  {currency}
                  {billingMode === 'daily'
                    ? (pricing.baseDaily || car.pricePerDay || car.price || 0)
                    : (pricing.weeklyPerWeek ?? car.pricePerWeek ?? 0)}
                </span>
                <span className='text-gray-500 uppercase tracking-widest text-xs font-bold mb-2'>
                  / {billingMode === 'daily' ? 'day' : 'week'}
                </span>
              </div>
              {billingMode === 'weekly' && (
                <p className='text-[11px] text-gray-400'>
                  i.e. {currency}{pricing.dailyEquivalentOfWeekly || 0}/day when booking weekly
                </p>
              )}
              <div className='flex gap-2'>
                <button
                  type="button"
                  onClick={() => setBillingMode('weekly')}
                  className={`flex-1 px-4 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border ${
                    billingMode === 'weekly'
                      ? 'bg-white text-black border-white'
                      : 'bg-black/40 text-gray-300 border-zinc-700 hover:border-gray-500'
                  }`}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingMode('daily')}
                  className={`flex-1 px-4 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border ${
                    billingMode === 'daily'
                      ? 'bg-white text-black border-white'
                      : 'bg-black/40 text-gray-300 border-zinc-700 hover:border-gray-500'
                  }`}
                >
                  Daily
                </button>
              </div>
              {totalForPeriod != null && totalForPeriod > 0 && (
                <p className='text-sm text-gray-300'>
                  Total: {currency}{totalForPeriod.toLocaleString()}
                  {billingMode === 'weekly'
                    ? ' (billed per week)'
                    : ' (billed per day)'}
                  {billingMode === 'daily' && daysForPeriod != null && (
                    <> · 총 {daysForPeriod}일 합계</>
                  )}
                </p>
              )}
            </div>
            
            <div className='space-y-6'>
              <div className='flex flex-col gap-3'>
                <label className='text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]'>Pickup Date</label>
                <input 
                  value={today} 
                  readOnly 
                  type="date" 
                  className='bg-black/50 border border-zinc-800 p-4 rounded-2xl text-white w-full outline-none cursor-default opacity-90 text-sm' 
                  style={{ colorScheme: 'dark' }} 
                  min={today}
                />
                <p className='text-[10px] text-gray-500'>Pickup is fixed to today. Return date or number of weeks determines your rental period.</p>
              </div>
              {billingMode === 'weekly' ? (
                <div className='flex flex-col gap-3'>
                  <label className='text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]'>Number of weeks</label>
                  <select
                    value={numberOfWeeks}
                    onChange={(e) => setNumberOfWeeks(Number(e.target.value))}
                    className='bg-black/50 border border-zinc-800 p-4 rounded-2xl text-white w-full outline-none focus:border-gray-400 transition-colors text-sm'
                  >
                    {Array.from({ length: 52 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n} week{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                  {returnDate && pickupDate && (
                    <p className='text-[11px] text-gray-400'>
                      Return: {returnDate}
                    </p>
                  )}
                </div>
              ) : (
                <div className='flex flex-col gap-3'>
                  <label className='text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]'>Return Date</label>
                  <input 
                    value={returnDate} 
                    onChange={(e) => handleReturnDateChange(e.target.value)} 
                    type="date" 
                    className='bg-black/50 border border-zinc-800 p-4 rounded-2xl text-white w-full outline-none focus:border-gray-400 transition-colors text-sm' 
                    style={{ colorScheme: 'dark' }} 
                    min={returnDateMinForDaily}
                    required 
                  />
                </div>
              )}
            </div>

            {billingMode === 'weekly' && weeksForSelection != null && (
              <p className='text-[11px] text-gray-400'>
                {weeksForSelection} week{weeksForSelection > 1 ? 's' : ''} · Total below
              </p>
            )}
            
            {availableForSelectedDates === false && (
              <p className='text-red-400 text-sm font-medium mb-2'>
                This vehicle is booked for part of this period. Please select different dates.
              </p>
            )}
            <button 
              type="submit"
              disabled={availableForSelectedDates === false}
              className='w-full py-5 font-bold rounded-full text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none bg-white text-black hover:bg-gray-200 transition-all'
            >
              Proceed to Payment
            </button>
            {import.meta.env.DEV && (
              <p className='text-center text-[10px] text-gray-500 mt-3'>
                Stripe test: use card <span className='text-gray-400 font-mono'>4242 4242 4242 4242</span>, any future expiry, any CVC.
              </p>
            )}
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
