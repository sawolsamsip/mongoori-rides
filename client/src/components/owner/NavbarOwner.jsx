import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'

const NavbarOwner = () => {
    const navigate = useNavigate()
    const { user, setToken, setUser } = useAppContext()

    // 🚨 메인 네비게이션바와 동일하게 localStorage까지 완벽히 비우는 로그아웃
    const handleLogout = () => {
        if(setToken) setToken('')
        if(setUser) setUser(null)
        localStorage.removeItem('token')
        navigate('/')
    }

    return (
        <div className='fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 lg:px-12 py-5 md:py-6 bg-black/95 backdrop-blur-xl border-b border-zinc-900'>
            
            {/* 1. Logo (메인 사이트와 완벽히 동일한 디자인) */}
            <div onClick={() => navigate('/')} className='cursor-pointer flex items-center gap-2'>
                <span className='text-2xl md:text-3xl font-bold tracking-tighter text-white'>
                    mongoori <span className='text-gray-500'>rides.</span>
                </span>
            </div>

            {/* 2. User Info & Logout Button */}
            <div className='flex items-center gap-6 md:gap-8'>
                
                {/* 오너 정보 (PC에서만 표시) */}
                <div className='hidden md:flex flex-col items-end'>
                    <p className='text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold mb-0.5'>Owner Portal</p>
                    <p className='text-sm font-medium text-white tracking-wide'>{user?.name || 'Partner Host'}</p>
                </div>
                
                {/* 로그아웃 버튼 */}
                <button 
                    onClick={handleLogout}
                    className='bg-white text-black px-6 md:px-8 py-2.5 md:py-3 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                >
                    Sign Out
                </button>
            </div>
        </div>
    )
}

export default NavbarOwner
