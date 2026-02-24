import React, { useEffect } from 'react'
import { motion } from 'framer-motion'

const PrivacyPolicy = () => {
  // 페이지 진입 시 최상단으로 자동 스크롤
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      title: "1. Information We Collect",
      content: "We collect personal information necessary to provide our premium rental services. This includes your name, email, phone number, and driver's license details for identity verification. We also collect vehicle telematics (such as GPS location and vehicle status) during your rental period to ensure safety and security."
    },
    {
      title: "2. Payment Processing & Security",
      content: "All payments are processed securely through Stripe. Mongoori Rides does not store your full credit card information on our servers. Stripe's use of your personal information is governed by their Privacy Policy which can be viewed at stripe.com. We rely on their PCI-compliant infrastructure to keep your financial data safe."
    },
    {
      title: "3. How We Use Your Data",
      content: "Your data allows us to manage your bookings, verify your eligibility to drive, and provide customer support. We use vehicle location data strictly for emergency assistance, theft recovery, and boundary monitoring (Geofencing)."
    },
    {
      title: "4. Data Sharing",
      content: "We do not sell, rent, or trade your personal information. We share data only with trusted partners required to fulfill our service, such as insurance providers and Stripe for payment processing."
    },
    {
      title: "5. Your Rights & CCPA",
      content: "In accordance with the California Consumer Privacy Act (CCPA), you have the right to request access to your data, request deletion, and opt-out of any data sharing. For such requests, please contact our privacy team."
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='px-6 md:px-32 lg:px-64 pt-28 pb-16 text-gray-400 bg-black min-h-screen font-light'
    >
      {/* Header Section */}
      <div className='mb-12'>
        <h1 className='text-3xl font-black text-white mb-3 tracking-tighter uppercase'>
          Privacy <span className='text-gray-600'>Policy</span>
        </h1>
        <div className='h-0.5 w-16 bg-white mb-4'></div>
        <p className='text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium'>
          Last updated: February 19, 2026
        </p>
      </div>

      {/* Content Sections */}
      <div className='space-y-12'>
        {sections.map((section, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className='group'
          >
            <h2 className='text-sm font-bold text-white mb-3 uppercase tracking-widest group-hover:text-blue-400 transition-colors'>
              {section.title}
            </h2>
            <p className='leading-relaxed text-gray-400 text-sm md:text-base'>
              {section.content}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Contact Box (최적화된 여백 및 사이즈) */}
      <div className='mt-16 p-8 border border-white/10 bg-white/[0.02] rounded-lg relative overflow-hidden'>
        <div className='absolute top-0 right-0 p-4 opacity-5'>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="white">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
          </svg>
        </div>
        <h2 className='text-white font-bold text-lg mb-2 uppercase tracking-tight'>Contact Privacy Team</h2>
        <p className='text-xs mb-6 text-gray-500'>Have questions about how we handle your data? We're here to help.</p>
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

export default PrivacyPolicy
