import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const Incidentals = () => {
  const { axios } = useAppContext()
  const [incidentals, setIncidentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [modal, setModal] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get('/api/incidentals/owner/list')
        if (data.success) setIncidentals(data.incidentals || [])
      } catch (e) {
        toast.error(e.response?.data?.message || e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [axios])

  const updateStatus = async (incidentalId, status, resolutionNotes) => {
    setUpdatingId(incidentalId)
    try {
      const { data } = await axios.post('/api/incidentals/update-status', {
        incidentalId,
        status,
        resolutionNotes,
      })
      if (data.success) {
        toast.success('Status updated')
        setIncidentals((prev) =>
          prev.map((i) => (i._id === incidentalId ? data.incidental : i))
        )
        setModal(null)
      } else toast.error(data.message)
    } catch (e) {
      toast.error(e.response?.data?.message || e.message)
    } finally {
      setUpdatingId(null)
    }
  }

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
        <h2 className='text-[10px] font-bold tracking-[0.3em] text-gray-500 uppercase mb-2'>Incidents</h2>
        <h1 className='text-3xl md:text-4xl font-black tracking-tight'>Incident Reports.</h1>
        <p className='text-gray-400 text-sm mt-2 font-light'>
          Collect driver and owner statements, then resolve or escalate.
        </p>
      </div>

      <div className='space-y-4'>
        {incidentals.length > 0 ? (
          incidentals.map((inc) => (
            <div
              key={inc._id}
              className='bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors'
            >
              <div className='flex flex-wrap items-start justify-between gap-4'>
                <div>
                  <div className='flex items-center gap-3 mb-2'>
                    <span className='px-3 py-1 rounded-full text-[10px] font-bold uppercase border bg-zinc-800 text-gray-300'>
                      {inc.type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                      inc.status === 'resolved' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' :
                      inc.status === 'under_review' ? 'bg-amber-900/30 text-amber-400 border-amber-800' :
                      'bg-zinc-800 text-gray-400 border-zinc-700'
                    }`}>
                      {inc.status}
                    </span>
                  </div>
                  <h3 className='font-bold text-lg'>{inc.title || 'Incident report'}</h3>
                  <p className='text-gray-400 text-sm mt-1'>{inc.description || '—'}</p>
                  <p className='text-[10px] text-gray-500 mt-2 uppercase tracking-widest'>
                    Booking: {inc.booking?.car?.brand} {inc.booking?.car?.model} · {inc.booking?.user?.name}
                  </p>
                  {(inc.driverStatement || inc.ownerStatement) && (
                    <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                      {inc.driverStatement && (
                        <div className='bg-black/30 rounded-xl p-3 border border-zinc-800'>
                          <p className='text-[10px] text-gray-500 uppercase mb-1'>Driver statement</p>
                          <p className='text-gray-300'>{inc.driverStatement}</p>
                        </div>
                      )}
                      {inc.ownerStatement && (
                        <div className='bg-black/30 rounded-xl p-3 border border-zinc-800'>
                          <p className='text-[10px] text-gray-500 uppercase mb-1'>Owner statement</p>
                          <p className='text-gray-300'>{inc.ownerStatement}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {inc.status !== 'resolved' && inc.status !== 'disputed' && (
                  <button
                    onClick={() => setModal(inc)}
                    className='bg-white text-black px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200'
                  >
                    Update status
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className='py-16 text-center border border-dashed border-zinc-800 rounded-2xl text-gray-500'>
            No incident reports yet.
          </div>
        )}
      </div>

      {modal && (
        <div className='fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4' onClick={() => setModal(null)}>
          <div className='bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full shadow-xl' onClick={(e) => e.stopPropagation()}>
            <h3 className='font-bold text-lg mb-4'>Update status</h3>
            <select
              className='w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white mb-4'
              value={modal.status}
              onChange={(e) => setModal({ ...modal, status: e.target.value })}
            >
              <option value='reported'>Reported</option>
              <option value='gathering_info'>Gathering info</option>
              <option value='under_review'>Under review</option>
              <option value='resolved'>Resolved</option>
              <option value='disputed'>Disputed</option>
            </select>
            <textarea
              className='w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white mb-4 resize-none'
              rows={3}
              placeholder='Resolution notes (optional)'
              value={modal.resolutionNotes || ''}
              onChange={(e) => setModal({ ...modal, resolutionNotes: e.target.value })}
            />
            <div className='flex gap-3'>
              <button
                onClick={() => updateStatus(modal._id, modal.status, modal.resolutionNotes)}
                disabled={updatingId === modal._id}
                className='flex-1 bg-white text-black py-3 rounded-full text-sm font-bold uppercase disabled:opacity-50'
              >
                {updatingId === modal._id ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setModal(null)}
                className='px-6 py-3 rounded-full border border-zinc-600 text-gray-400 text-sm font-bold uppercase'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default Incidentals
