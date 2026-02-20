import React from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'

const Newsletter = () => {
  
  const handleSubscribe = (e) => {
    e.preventDefault();
    toast.success("Welcome to the club! We'll keep you in the loop with mongoori rides exclusives.");
    e.target.reset();
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.8 }}
      className='px-6 md:px-16 lg:px-32 py-16 md:py-24 border-t border-zinc-900 text-center'
    >
      <div className='max-w-2xl mx-auto space-y-6 md:space-y-10'>
        <h2 className='text-2xl md:text-3xl font-bold tracking-tight'>Unlock <span className='text-gray-400'>mongoori</span> Exclusives</h2>
        <p className='text-gray-500 font-light text-sm md:text-base px-4 md:px-0'>
          Get first access to new Tesla arrivals, private community events, and early-bird promo codes right here in Orange County.
        </p>
        
        {/* 🚨 모바일에서는 위아래로 분리, PC에서는 한 줄로 */}
        <form 
          className='flex flex-col sm:flex-row gap-4 sm:gap-2 p-0 sm:p-1 bg-transparent sm:bg-zinc-900/50 border-0 sm:border border-zinc-800 rounded-none sm:rounded-full mt-8' 
          onSubmit={handleSubscribe}
        >
          <input 
            type="email" 
            required
            placeholder="Enter your email address" 
            className='w-full sm:flex-1 px-6 py-4 sm:py-0 bg-zinc-900/50 sm:bg-transparent border border-zinc-800 sm:border-none rounded-full sm:rounded-none outline-none text-sm text-white placeholder-gray-600 focus:border-gray-500 transition-colors' 
          />
          <button 
            type="submit"
            className='w-full sm:w-auto bg-zinc-800 text-white px-8 py-4 sm:py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all'
          >
            Subscribe
          </button>
        </form>
      </div>
    </motion.div>
  )
}

export default Newsletter
