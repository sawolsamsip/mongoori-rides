import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const Insurance = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const plans = [
    {
      title: "Standard Protection",
      desc: "Basic coverage included in all rentals.",
      features: ["State Minimum Liability", "Mechanical Breakdown Support"]
    },
    {
      title: "Premium Shield",
      desc: "Full peace of mind for your Tesla experience.",
      features: ["Zero Deductible", "Glass & Tire Protection", "24/7 Roadside Assistance"]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className='px-6 md:px-32 lg:px-64 pt-28 pb-16 text-gray-400 bg-black min-h-screen font-light'
    >
      <h1 className='text-3xl font-black text-white mb-3 uppercase tracking-tighter'>Insurance <span className='text-gray-600'>Coverage</span></h1>
      <div className='h-0.5 w-16 bg-white mb-10'></div>
      
      <div className='grid md:grid-cols-2 gap-8'>
        {plans.map((plan, i) => (
          <div key={i} className='p-8 border border-white/10 bg-white/[0.02] rounded-lg'>
            <h2 className='text-white font-bold mb-2 uppercase tracking-widest'>{plan.title}</h2>
            <p className='text-sm mb-6 text-gray-500'>{plan.desc}</p>
            <ul className='space-y-3'>
              {plan.features.map((f, j) => (
                <li key={j} className='text-xs flex items-center gap-2'>
                  <span className='text-blue-500'>✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className='mt-12 text-center'>
        <Link to='/fleet' className='inline-block bg-white text-black px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors'>
          Book with confidence
        </Link>
      </div>
    </motion.div>
  )
}
export default Insurance
