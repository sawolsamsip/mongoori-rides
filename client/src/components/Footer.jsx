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
              <li><Link to='/owner/dashboard' onClick={() => window.scrollTo(0,0)} className='hover:text-white transition-colors'>Dashboard</Link></li>
              <li><Link to='/our-story' onClick={() => window.scrollTo(0,0)} className='hover:text-white transition-colors'>Our Story</Link></li>
            </ul>
          </div>

          {/* 3. Legal Links */}
          <div>
            <h4 className='text-xs font-bold tracking-widest uppercase text-white mb-6'>Legal</h4>
            <ul className='space-y-4 text-sm text-gray-400 font-light'>
              {/* 라우트 경로가 PrivacyPolicy.jsx, TermsOfUse.jsx 등에 맞게 수정 필요 시 경로 확인 요망 */}
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

        {/* Bottom Copyright */}
        <div className='mt-20 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600 uppercase tracking-wider text-center md:text-left'>
          <p>&copy; {new Date().getFullYear()} MONGOORI RIDES. DESIGNED IN IRVINE.</p>
          <div className='flex gap-6'>
            <Link to='/privacy-policy' onClick={() => window.scrollTo(0,0)} className='hover:text-white transition-colors'>Privacy</Link>
            <Link to='/terms-of-use' onClick={() => window.scrollTo(0,0)} className='hover:text-white transition-colors'>Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
