import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { assets } from '../assets/assets'

const OurStory = () => {
  const navigate = useNavigate();

  // 페이지 진입 시 맨 위로 스크롤
  useEffect(() => { 
    window.scrollTo(0, 0); 
  }, []);

  // 공통 애니메이션 설정
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  }

  return (
    <div className='bg-black text-white min-h-screen pt-32 pb-32 px-6 md:px-16 lg:px-24 xl:px-48 overflow-hidden relative'>
      
      {/* 배경 장식 (은은한 그라데이션) */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className='max-w-6xl mx-auto relative z-10'>
        
        {/* 헤더 섹션 */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <h2 className='text-xs md:text-sm font-bold tracking-[0.5em] text-gray-500 uppercase mb-8'>
            Established 2026 • Irvine, CA
          </h2>
          <h1 className='text-5xl md:text-7xl lg:text-8xl font-black mb-16 tracking-tighter leading-[0.9]'>
            DRIVING THE <br/>
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-700'>
              FUTURE, TODAY.
            </span>
          </h1>
        </motion.div>

        {/* 메인 스토리 텍스트 & 이미지 영역 */}
        <div className='grid lg:grid-cols-2 gap-16 lg:gap-24 items-center'>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            className='space-y-8 text-gray-300 text-lg md:text-xl font-light leading-relaxed'
          >
            <p>
              <span className='text-white font-semibold'>mongoori rides.</span> started with a simple observation: the luxury car rental market in Orange County was stuck in the past. Loud engines, complicated paperwork, and hidden fees were the norm.
            </p>
            <p>
              We envisioned a different path—one that aligns with the innovative spirit of Southern California. We wanted to provide a seamless, tech-first experience that merges the performance of Tesla with the sophistication of Irvine’s lifestyle.
            </p>
            <div className='pl-6 border-l-2 border-gray-600 mt-10'>
              <p className='italic text-white font-medium text-xl md:text-2xl'>
                "It’s not just about getting from A to B; it’s about how you feel when you arrive."
              </p>
            </div>
          </motion.div>
          
          {/* 우측 이미지 영역 (assets.main_car 활용) */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className='flex justify-center lg:justify-end'
          >
            <div className='relative w-full max-w-md'>
              <div className='absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10'></div>
              <img 
                src={assets.main_car} 
                alt="Tesla Experience" 
                className='w-full object-contain drop-shadow-[0_20px_50px_rgba(255,255,255,0.05)]'
              />
            </div>
          </motion.div>
        </div>

        {/* Stats Section (통계) */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={fadeUp}
          className='grid grid-cols-2 md:grid-cols-4 gap-10 mt-32 py-16 border-y border-white/10'
        >
          {[
            { label: 'Fleet Focus', value: '100% Electric' },
            { label: 'Booking Time', value: '< 2 Mins' },
            { label: 'Support', value: '24/7 Priority' },
            { label: 'Location', value: 'Irvine, CA' }
          ].map((stat, i) => (
            <div key={i} className='text-center md:text-left'>
              <h3 className='text-2xl md:text-3xl font-black text-white mb-2'>{stat.value}</h3>
              <p className='text-[10px] md:text-xs uppercase tracking-[0.2em] text-gray-500 font-bold'>
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* CTA (Call to Action) */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className='mt-32 text-center'
        >
          <p className='text-gray-400 text-lg md:text-xl font-light mb-8'>Ready to experience the evolution?</p>
          <button 
            onClick={() => navigate('/fleet')} 
            className='inline-block px-12 py-5 bg-white text-black text-xs md:text-sm font-bold uppercase tracking-widest rounded-full hover:bg-gray-200 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
          >
            Explore the Fleet
          </button>
        </motion.div>
        
      </div>
    </div>
  )
}

export default OurStory
