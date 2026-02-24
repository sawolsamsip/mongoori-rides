import React, { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const navigate = useNavigate()
  
  // AppContext에서 로그인 관련 상태 가져오기
  const { setShowLogin, token, setToken, setUser, user } = useAppContext()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 🚨 로그아웃 함수 완벽 수정
  const logout = () => {
    if(setToken) setToken('')
    if(setUser) setUser(null)
    // 브라우저 저장소에 남아있는 토큰을 완전히 삭제!
    localStorage.removeItem('token') 
    navigate('/')
  }

  return (
    <div className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-black/90 backdrop-blur-lg border-b border-white/5 py-4' : 'bg-transparent py-6 md:py-8'}`}>
      <div className='max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between'>
        
        {/* 1. Logo */}
        <Link to='/' className='flex items-center gap-2 z-50' onClick={() => window.scrollTo(0,0)}>
          <span className='text-2xl md:text-3xl font-bold tracking-tighter text-white'>
            mongoori <span className='text-gray-500'>rides.</span>
          </span>
        </Link>

        {/* 2. Desktop Navigation */}
        <ul className='hidden md:flex items-center gap-10 text-sm font-medium tracking-widest uppercase text-gray-400'>
          <NavLink to='/' className={({isActive}) => isActive ? 'text-white' : 'hover:text-white transition-colors'}>Home</NavLink>
          <NavLink to='/fleet' className={({isActive}) => isActive ? 'text-white' : 'hover:text-white transition-colors'}>Fleet</NavLink>
          <NavLink to='/my-bookings' className={({isActive}) => isActive ? 'text-white' : 'hover:text-white transition-colors'}>Bookings</NavLink>
        </ul>

        {/* 3. Right Side Buttons */}
        <div className='hidden md:flex items-center gap-8'>
          <button 
            onClick={() => navigate('/owner/dashboard')} 
            className='text-sm font-medium text-gray-400 hover:text-white transition-colors uppercase tracking-widest'
          >
            Host a Car
          </button>

          {token ? (
            <div className='relative group cursor-pointer'>
              <img src={user?.image || assets.user_profile} alt="Profile" className='w-10 h-10 rounded-full border border-zinc-700 object-cover' />
              <div className='absolute right-0 top-full pt-4 hidden group-hover:block'>
                <div className='bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl flex flex-col min-w-[160px] overflow-hidden'>
                  <p onClick={() => navigate('/owner/dashboard')} className='px-6 py-4 hover:bg-zinc-800 text-sm cursor-pointer text-gray-300 hover:text-white transition-colors'>Dashboard</p>
                  <p onClick={logout} className='px-6 py-4 hover:bg-zinc-800 text-sm cursor-pointer text-red-400 hover:text-red-300 transition-colors'>Logout</p>
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowLogin && setShowLogin(true)} 
              className='bg-white text-black px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]'
            >
              Sign In
            </button>
          )}
        </div>

        {/* 4. Mobile Menu Toggle */}
        <button className='md:hidden z-50' onClick={() => setShowMenu(true)}>
          <img src={assets.menu_icon} alt="Menu" className='w-7 invert' />
        </button>
      </div>

      {/* 5. Mobile Sidebar Menu */}
      <div className={`md:hidden fixed top-0 right-0 w-[80%] max-w-sm h-screen bg-black/95 backdrop-blur-xl border-l border-zinc-800 z-50 transform transition-transform duration-500 ease-in-out ${showMenu ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className='p-8 flex justify-end'>
          <button onClick={() => setShowMenu(false)}>
            <img src={assets.close_icon} alt="Close" className='w-7 invert hover:opacity-70 transition-opacity' />
          </button>
        </div>
        <div className='flex flex-col gap-8 px-10 mt-10 text-xl font-light tracking-widest uppercase text-gray-400'>
          <NavLink to='/' onClick={() => setShowMenu(false)} className={({isActive}) => isActive ? 'text-white font-medium' : 'hover:text-white'}>Home</NavLink>
          <NavLink to='/fleet' onClick={() => setShowMenu(false)} className={({isActive}) => isActive ? 'text-white font-medium' : 'hover:text-white'}>Fleet</NavLink>
          <NavLink to='/my-bookings' onClick={() => setShowMenu(false)} className={({isActive}) => isActive ? 'text-white font-medium' : 'hover:text-white'}>Bookings</NavLink>
          
          <div className='h-[1px] bg-zinc-800/50 my-4'></div>
          
          <button onClick={() => { setShowMenu(false); navigate('/owner/dashboard'); }} className='text-left hover:text-white transition-colors'>Host a Car</button>
          
          {token ? (
            <button onClick={() => { setShowMenu(false); logout(); }} className='text-left text-red-400 hover:text-red-300 transition-colors'>Sign Out</button>
          ) : (
            <button onClick={() => { setShowMenu(false); setShowLogin && setShowLogin(true); }} className='text-left text-white font-medium'>Sign In</button>
          )}
        </div>
      </div>
      
      {showMenu && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setShowMenu(false)}
        ></div>
      )}
    </div>
  )
}

export default Navbar
