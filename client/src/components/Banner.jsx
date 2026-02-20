import React from 'react'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { motion } from 'framer-motion'

const Banner = () => {
  const navigate = useNavigate()

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8 }}
      className='px-4 sm:px-6 md:px-16 lg:px-32 pb-20 md:pb-32'
    >
      {/* 🚨 모바일에서는 p-8, rounded-3xl 적용 */}
      <div className='bg-zinc-900/20 border border-zinc-800 rounded-3xl md:rounded-[3rem] p-8 md:p-20 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-10 overflow-hidden relative'>
        
        <div className="absolute top-[-50%] left-[-10%] w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className='flex-1 text-center lg:text-left relative z-10'>
          <h2 className='text-3xl sm:text-4xl md:text-6xl font-bold tracking-tighter mb-4 md:mb-6'>
            Host with <span className='text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500'>mongoori rides.</span>
          </h2>
          <p className='text-gray-400 text-base md:text-lg font-light mb-8 max-w-xl mx-auto lg:mx-0'>
            Turn your parked Tesla into a high-earning asset. Join Irvine's premier car-sharing community and start earning with zero hassle. Elevate the Orange County lifestyle.
          </p>
          <button 
            onClick={() => navigate('/add-car')} 
            className='bg-white text-black px-10 md:px-12 py-4 rounded-full font-bold text-sm uppercase hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] w-full sm:w-auto'
          >
            Become a Host
          </button>
        </div>
        
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className='flex-1 flex justify-center relative z-10 w-full mt-4 md:mt-0'
        >
          <img 
            src={assets.main_car} 
            alt="Tesla" 
            className='w-full max-w-[550px] drop-shadow-[0_20px_50px_rgba(255,255,255,0.05)] hover:scale-105 transition-transform duration-700' 
          />
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Banner
