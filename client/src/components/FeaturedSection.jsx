import React from 'react'
import { useAppContext } from '../context/AppContext'
import { motion } from 'framer-motion'
import CarCard from './CarCard'

const FeaturedSection = () => {
  const { cars } = useAppContext()

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8 }}
      className='px-6 md:px-16 lg:px-32 py-32'
    >
      <h2 className='text-3xl font-bold mb-16 tracking-tight'>Available Models</h2>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-10'>
        {cars.slice(0, 3).map((car, index) => (
          <CarCard key={index} car={car} />
        ))}
      </div>
    </motion.div>
  )
}

export default FeaturedSection
