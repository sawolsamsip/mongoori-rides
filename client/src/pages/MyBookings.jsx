import React, { useEffect, useState } from 'react'
import { assets } from '../assets/assets'
// Title 컴포넌트가 불필요하게 느껴질 수 있어 제거하고 직접 디자인했습니다.
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion' 
import { Link, useNavigate } from 'react-router-dom' 

const MyBookings = () => {
  const { axios, user, token, setShowLogin } = useAppContext()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [reportModal, setReportModal] = useState(null)
  const [reportForm, setReportForm] = useState({ type: 'accident', title: 'Incident report', description: '' })
  const navigate = useNavigate()
  
  const currency = import.meta.env.VITE_CURRENCY || '$'

  const handleDownloadInvoice = async (bookingId) => {
    setDownloadingId(bookingId)
    try {
      const auth = token || localStorage.getItem('token')
      const res = await fetch(`${import.meta.env.DEV ? '' : (import.meta.env.VITE_BASE_URL || '')}/api/invoices/booking/${bookingId}/download`, {
        method: 'GET',
        headers: { Authorization: auth || '' },
        credentials: 'include',
      })
      const contentType = res.headers.get('content-type') || ''
      if (!res.ok) {
        const msg = contentType.includes('application/json') ? (await res.json()).message : res.statusText
        throw new Error(msg || 'Invoice not found or unauthorized')
      }
      if (!contentType.includes('application/pdf')) {
        const text = await res.text()
        try {
          const j = JSON.parse(text)
          throw new Error(j.message || 'Download failed')
        } catch {
          throw new Error('Download failed')
        }
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disp = res.headers.get('Content-Disposition')
      let suggestedName = `mongoori-invoice-${bookingId}.pdf`
      if (disp) {
        const quoted = disp.match(/filename="([^"]+)"/)
        const unquoted = disp.match(/filename=([^;\s]+)/)
        if (quoted) suggestedName = quoted[1].trim()
        else if (unquoted) suggestedName = unquoted[1].trim()
      }
      a.download = suggestedName
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Invoice downloaded')
    } catch (err) {
      toast.error(err.message || 'Download failed')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleReportIncident = async () => {
    if (!reportModal) return
    try {
      const { data } = await axios.post('/api/incidentals/', {
        bookingId: reportModal._id,
        type: reportForm.type || 'accident',
        title: reportForm.title || 'Incident report',
        description: reportForm.description,
      })
      if (data.success) {
        toast.success('Report submitted. The owner will follow up.')
        setReportModal(null)
        setReportForm({ type: 'accident', title: 'Incident report', description: '' })
      } else toast.error(data.message)
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this reservation? This action cannot be undone.')) return
    setCancellingId(bookingId)
    try {
      const { data } = await axios.post('/api/bookings/cancel', { bookingId })
      if (data.success) {
        toast.success(data.message || 'Reservation cancelled')
        fetchMyBookings()
      } else toast.error(data.message)
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setCancellingId(null)
    }
  }

  const fetchMyBookings = async () => {
    try {
      const { data } = await axios.get('/api/bookings/user')
      if (data.success) {
        setBookings(data.bookings)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  // 페이지 로드 시 맨 위로, 로그인 확인
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // 로그인이 안 되어 있다면
    if (!token) {
        toast.error("Please sign in to view your bookings.");
        navigate('/');
        if(setShowLogin) setShowLogin(true);
        return;
    }

    if (user || token) {
      fetchMyBookings()
    }
  }, [user, token])

  if (loading) {
    return <div className='min-h-screen bg-black flex items-center justify-center text-white'>
        <div className='w-10 h-10 border-4 border-zinc-600 border-t-white rounded-full animate-spin'></div>
    </div>
  }

  return (
    <div className='bg-black min-h-screen text-white pt-32 pb-32 px-6 md:px-16 lg:px-24 xl:px-48 overflow-hidden relative'>
      
      {/* 배경 장식 */}
      <div className="absolute top-[10%] left-[-10%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className='max-w-6xl mx-auto relative z-10'>
          
        {/* 헤더 타이틀 */}
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-16'
        >
            <h2 className='text-[10px] md:text-xs font-bold tracking-[0.5em] text-gray-500 uppercase mb-4'>
                Dashboard
            </h2>
            <h1 className='text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter'>
                My Trips.
            </h1>
        </motion.div>

        {/* 예약 리스트 */}
        <div className='space-y-6'>
          {bookings && bookings.length > 0 ? (
            bookings.map((booking, index) => (
              <motion.div 
                key={booking._id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className='bg-zinc-900/30 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row gap-8 items-center hover:bg-zinc-900/50 transition-colors'
              >
                
                {/* 1. 차량 이미지 & 기본 정보 */}
                <div className='w-full lg:w-1/4 flex-shrink-0'>
                  <div className='w-full aspect-video bg-white rounded-2xl flex items-center justify-center p-4 mb-4 overflow-hidden'>
                    <img src={booking.car?.image || assets.main_car} alt="Tesla" className='w-full h-full object-contain'/>
                  </div>
                  <p className='text-lg font-bold tracking-tight text-white mb-1'>
                    {booking.car?.brand || 'Tesla'} {booking.car?.model}
                  </p>
                  <p className='text-xs text-gray-500 uppercase tracking-widest font-semibold'>
                    {booking.car?.year || '2026'} • {booking.car?.category || 'Luxury'}
                  </p>
                </div>

                {/* 2. 예약 상세 정보 (날짜/위치/상태) */}
                <div className='w-full lg:w-2/4 flex flex-col gap-5 border-y lg:border-y-0 lg:border-l lg:border-r border-zinc-800 py-6 lg:py-0 lg:px-8'>
                  
                  {/* 상태 뱃지 */}
                  <div className='flex items-center gap-3'>
                    <span className='px-3 py-1 bg-zinc-800 border border-zinc-700 text-[10px] text-gray-400 font-bold uppercase tracking-widest rounded-full'>
                      ID: {booking._id?.slice(-6).toUpperCase() || `TRIP-${index + 1}`}
                    </span>
                    <span className={`px-4 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full border ${
                        booking.status === 'confirmed' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 
                        booking.status === 'pending' ? 'bg-amber-900/30 text-amber-400 border-amber-800' : 
                        'bg-red-900/30 text-red-400 border-red-800'
                    }`}>
                      {booking.status || 'Confirmed'}
                    </span>
                  </div>
                  
                  {/* 날짜/위치 정보 */}
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-300'>
                    <div className='bg-black/40 rounded-xl p-4 border border-zinc-800/50'>
                        <p className='text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1'>Dates</p>
                        <p className='font-medium'>{booking.pickupDate?.split('T')[0] || 'N/A'}</p>
                        <p className='text-gray-500 text-xs'>to {booking.returnDate?.split('T')[0] || 'N/A'}</p>
                    </div>
                    <div className='bg-black/40 rounded-xl p-4 border border-zinc-800/50'>
                        <p className='text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1'>Location</p>
                        <p className='font-medium break-words'>{booking.car?.location || 'Irvine, CA'}</p>
                    </div>
                  </div>
                </div>

                {/* 3. 가격 및 영수증 영역 */}
                <div className='w-full lg:w-1/4 flex flex-col justify-center items-start lg:items-end text-left lg:text-right'>
                  <p className='text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2'>Total Amount</p>
                  <h1 className='text-3xl md:text-4xl font-black text-white tracking-tighter mb-4'>
                    {currency}{booking.price?.toLocaleString() || '---'}
                  </h1>
                  <div className='mb-4'>
                    <p className='text-[10px] text-gray-600 uppercase tracking-widest font-medium mb-1'>
                      Booked: {booking.createdAt?.split('T')[0] || 'Recent'}
                    </p>
                    {(booking.cardLast4 || booking.cardBrand) && (
                      <p className='text-[10px] text-gray-500 uppercase tracking-wider'>
                        Card •••• {booking.cardLast4}{booking.cardBrand ? ` · ${String(booking.cardBrand).charAt(0).toUpperCase() + String(booking.cardBrand).slice(1)}` : ''}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDownloadInvoice(booking._id)}
                    disabled={downloadingId === booking._id}
                    className='w-full bg-white text-black py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-50'
                  >
                    {downloadingId === booking._id ? 'Downloading…' : 'Download Invoice'}
                  </button>
                  {booking.status !== 'cancelled' && (
                    <>
                      <button
                        onClick={() => setReportModal(booking)}
                        className='w-full mt-3 border border-zinc-600 text-gray-400 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-800/50 transition-colors'
                      >
                        Report incident / damage
                      </button>
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        disabled={cancellingId === booking._id}
                        className='w-full mt-3 border border-red-500/50 text-red-400 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-red-500/10 transition-colors disabled:opacity-50'
                      >
                        {cancellingId === booking._id ? 'Cancelling…' : 'Cancel Reservation'}
                      </button>
                    </>
                  )}
                </div>

              </motion.div>
            ))
          ) : (
            /* 예약이 없을 때 (Empty State) */
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className='flex flex-col items-center justify-center py-32 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-[3rem] text-center'
            >
              <div className='w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800'>
                  <img src={assets.carIcon} alt="Car" className='w-10 opacity-50 grayscale'/>
              </div>
              <h3 className='text-2xl font-bold mb-4 tracking-tight'>No Trips Found</h3>
              <p className='text-gray-500 font-light mb-8 max-w-sm'>
                You haven't booked any vehicles yet. Your next adventure awaits in the heart of Orange County.
              </p>
              <Link to="/fleet" className='bg-white text-black px-10 py-4 rounded-full hover:bg-gray-200 hover:scale-105 transition-all text-xs uppercase font-bold tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.2)]'>
                Explore the Fleet
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {reportModal && (
        <div className='fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4' onClick={() => setReportModal(null)}>
          <div className='bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full shadow-xl text-left' onClick={(e) => e.stopPropagation()}>
            <h3 className='font-bold text-lg mb-4'>Report incident / damage</h3>
            <p className='text-gray-400 text-sm mb-4'>Booking: {reportModal.car?.brand} {reportModal.car?.model}</p>
            <input
              className='w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white mb-3'
              placeholder='Title'
              value={reportForm.title}
              onChange={(e) => setReportForm((f) => ({ ...f, title: e.target.value }))}
            />
            <select
              className='w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white mb-3'
              value={reportForm.type}
              onChange={(e) => setReportForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option value='accident'>Accident</option>
              <option value='damage'>Damage</option>
              <option value='other'>Other</option>
            </select>
            <textarea
              className='w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white mb-4 resize-none'
              rows={4}
              placeholder='Describe what happened…'
              value={reportForm.description}
              onChange={(e) => setReportForm((f) => ({ ...f, description: e.target.value }))}
            />
            <div className='flex gap-3'>
              <button
                onClick={handleReportIncident}
                className='flex-1 bg-white text-black py-3 rounded-full text-sm font-bold uppercase'
              >
                Submit
              </button>
              <button
                onClick={() => setReportModal(null)}
                className='px-6 py-3 rounded-full border border-zinc-600 text-gray-400 text-sm font-bold uppercase'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyBookings
