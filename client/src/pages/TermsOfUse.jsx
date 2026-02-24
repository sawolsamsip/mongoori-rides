import React, { useEffect } from 'react'
import { motion } from 'framer-motion'

const TermsOfUse = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: "By accessing and using Mongoori Rides, you agree to be bound by these Terms of Use and all applicable laws and regulations in the State of California."
    },
    {
      title: "2. Driver Requirements",
      content: "All renters must be at least 21 years of age and possess a valid, unexpired driver's license. We reserve the right to verify your driving record before confirming any reservation."
    },
    {
      title: "3. Rental Period & Vehicle Use",
      content: "Vehicles must be returned on time to the designated location. Prohibited uses include off-roading, racing, commercial towing, or any illegal activities. Smoking and pets are strictly prohibited inside our Tesla fleet."
    },
    {
      title: "4. Insurance & Liability",
      content: "Renters are responsible for providing proof of active insurance or purchasing our premium coverage. In the event of an accident, you must notify Mongoori Rides and local authorities immediately."
    },
    {
      title: "5. Fees & Payments",
      content: "All payments are processed via Stripe. Total costs include the rental rate, applicable taxes, and any potential cleaning or supercharging fees incurred during your trip."
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='px-6 md:px-32 lg:px-64 pt-28 pb-16 text-gray-400 bg-black min-h-screen font-light'
    >
      <div className='mb-12'>
        <h1 className='text-3xl font-black text-white mb-3 tracking-tighter uppercase'>
          Terms <span className='text-gray-600'>of Use</span>
        </h1>
        <div className='h-0.5 w-16 bg-white mb-4'></div>
        <p className='text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium'>
          Last updated: February 19, 2026
        </p>
      </div>

      <div className='space-y-12'>
        {sections.map((section, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className='text-sm font-bold text-white mb-3 uppercase tracking-widest'>
              {section.title}
            </h2>
            <p className='leading-relaxed text-gray-400 text-sm md:text-base'>
              {section.content}
            </p>
          </motion.div>
        ))}
      </div>

      <div className='mt-16 p-8 border border-white/10 bg-white/[0.02] rounded-lg'>
        <h2 className='text-white font-bold text-lg mb-2 uppercase tracking-tight'>Questions?</h2>
        <p className='text-xs mb-6 text-gray-500'>For any inquiries regarding our terms, please contact us.</p>
        <a 
          href="mailto:contact@mongoori.com" 
          className='inline-block px-6 py-2 border border-white text-[10px] text-white hover:bg-white hover:text-black transition-all duration-300 font-bold uppercase tracking-widest'
        >
          contact@mongoori.com
        </a>
      </div>
    </motion.div>
  )
}

export default TermsOfUse
