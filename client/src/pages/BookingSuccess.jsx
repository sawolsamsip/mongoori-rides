import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

const BookingSuccess = () => {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { axios, token, fetchCars } = useAppContext()
  const navigate = useNavigate()
  const [status, setStatus] = useState('confirming')

  useEffect(() => {
    if (!token) {
      toast.error('Please sign in.')
      navigate('/')
      return
    }
    if (!sessionId) {
      toast.error('Invalid success URL.')
      navigate('/my-bookings')
      return
    }

    const confirm = async () => {
      try {
        const authToken = token || localStorage.getItem('token')
        if (!authToken) {
          setStatus('error')
          toast.error('Please sign in again.')
          return
        }
        const { data } = await axios.post('/api/payment/confirm-payment', { session_id: sessionId }, { headers: { Authorization: authToken } })
        if (data.success) {
          setStatus('success')
          toast.success('Payment confirmed. Your booking and invoice are ready.')
          await fetchCars() // refresh fleet list so "Booked" shows without manual reload
          setTimeout(() => navigate('/my-bookings'), 2000)
        } else {
          setStatus('error')
          toast.error(data.message || 'Confirmation failed')
        }
      } catch (err) {
        setStatus('error')
        toast.error(err.response?.data?.message || err.message)
      }
    }

    confirm()
  }, [sessionId, token, axios, navigate])

  return (
    <div className='bg-black min-h-screen flex items-center justify-center text-white px-6'>
      {status === 'confirming' && (
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-zinc-600 border-t-white rounded-full animate-spin mx-auto mb-6' />
          <p className='text-gray-400 uppercase tracking-widest text-sm font-semibold'>Confirming your payment…</p>
        </div>
      )}
      {status === 'success' && (
        <div className='text-center'>
          <div className='w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center mx-auto mb-6'>
            <span className='text-3xl text-emerald-400'>✓</span>
          </div>
          <h1 className='text-2xl font-bold mb-2'>Booking confirmed</h1>
          <p className='text-gray-400 mb-6'>Redirecting to My Trips…</p>
          <div className='flex flex-wrap justify-center gap-3'>
            <button type='button' onClick={() => navigate('/my-bookings')} className='bg-white text-black px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-200'>
              My Trips
            </button>
            <button type='button' onClick={() => navigate('/')} className='border border-zinc-600 text-gray-300 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-zinc-800'>
              Home
            </button>
          </div>
        </div>
      )}
      {status === 'error' && (
        <div className='text-center'>
          <p className='text-red-400 mb-4'>Something went wrong.</p>
          <button
            onClick={() => navigate('/my-bookings')}
            className='bg-white text-black px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest'
          >
            Go to My Trips
          </button>
        </div>
      )}
    </div>
  )
}

export default BookingSuccess
