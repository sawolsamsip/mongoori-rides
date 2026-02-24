import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className='bg-black text-white py-16 md:py-24 border-t border-zinc-900 mt-auto'>
      <div className='max-w-7xl mx-auto px-6 lg:px-12'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8'>
          
          {/* 1. Brand & Tagline */}
          <div className='lg:col-span-1'>
            <Link to='/' className='inline-block mb-6' onClick={() => window.scrollTo(0,0)}>
              <span className='text-2xl md:text-3xl font-bold tracking-tighter text-white'>
                mongoori <span className='text-gray-500'>rides.</span>
              </span>
            </Link>
            <p className='text-gray-400 text-sm font-light leading-relaxed max-w-xs'>
              Redefining mobility in Orange County. Sustainable luxury at your fingertips.
            </p>
          </div>

          {/* 2. Explore Links */}
          <div>
            <h4 className='text-xs font-bold tracking-widest uppercase text-white mb-6'>Explore</h4>
            <ul className='space-y-4 text-sm text-gray-400 font-light'>
              <li><Link to='/fleet' onClick={() => window.scrollTo(0,0)} className='hover:text-white transition-colors'>Fleet</Link></li>
              <li><Link to='/my-bookings' onClick={() => window.scrollTo(0,0)} className='hover:text-white transition-colors'>My Bookings</Link></li>
              <li><Link to='/our-story' onClick={() => window.scrollTo(0,0)} className='hover:text-white transition-colors'>Our Story</Link></li>
            </ul>
          </div>

          {/* 3. Legal Links */}
          <div>
            <h4 className='text-xs font-bold tracking-widest uppercase text-white mb-6'>Legal</h4>
            <ul className='space-y-4 text-sm text-gray-400 font-light'>
              <li><Link to='/privacy-policy' onClick={() => window.scrollTo(0,0)} className='hover:text-white transition-colors'>Privacy Policy</Link></li>
              <li><Link to='/terms-of-use' onClick={() => window.scrollTo(0,0)} className='hover:text-white transition-colors'>Terms of Use</Link></li>
              <li><Link to='/insurance' onClick={() => window.scrollTo(0,0)} className='hover:text-white transition-colors'>Insurance</Link></li>
            </ul>
          </div>

          {/* 4. Contact Info */}
          <div>
            <h4 className='text-xs font-bold tracking-widest uppercase text-white mb-6'>Location</h4>
            <ul className='space-y-4 text-sm text-gray-400 font-light'>
              <li>Irvine, CA 92612</li>
              <li className='text-white font-medium'>+1 (949) 385-3271</li>
              <li><a href="mailto:contact@mongoori.com" className='hover:text-white transition-colors'>contact@mongoori.com</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright – 그리드와 시각적으로 이어지도록 여백·라인 정리 */}
        <div className='mt-16 md:mt-20 pt-6 md:pt-8 text-center'>
          <p className='text-[11px] text-gray-500 tracking-wide'>
            &copy; {new Date().getFullYear()} Mongoori Rides. Designed in Irvine.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
