import React, { useEffect, useRef } from 'react'
import NavbarOwner from '../../components/owner/NavbarOwner'
import Sidebar from '../../components/owner/Sidebar'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'

const Layout = () => {
  const { isOwner, token, user, axios, fetchUser } = useAppContext()
  const navigate = useNavigate()
  const upgradedRef = useRef(false)

  useEffect(() => {
    if (!token) {
      navigate('/')
      return
    }
    // Refetch user when entering owner area so role (e.g. admin) is up to date
    fetchUser(token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    if (!token || !user) return
    // 오너가 아닌 사용자가 오너 영역에 들어온 경우 한 번만 change-role 호출 후 유저 갱신 (Bookings/Incidents Unauthorized 방지)
    if (user.role !== 'owner' && user.role !== 'admin' && !upgradedRef.current) {
      upgradedRef.current = true
      axios.post('/api/owner/change-role')
        .then(({ data }) => data.success && fetchUser(token))
        .catch(() => { upgradedRef.current = false })
    }
  }, [token, user, axios, fetchUser])

  return (
    <div className='flex flex-col min-h-screen bg-black text-white font-sans'>
      {/* 1. 상단 네비게이션바 (오너 전용) */}
      <NavbarOwner />
      
      {/* 2. 하단 영역 (사이드바 + 메인 콘텐츠) */}
      <div className='flex flex-1 pt-20 md:pt-24 h-screen'> 
        {/* 상단바 높이만큼 pt-24를 줘서 가려지지 않게 함 */}
        
        {/* 왼쪽 사이드바 (고정) */}
        <Sidebar />
        
        {/* 오른쪽 메인 콘텐츠 영역 (스크롤 가능) */}
        <div className='flex-1 overflow-y-auto bg-zinc-950 px-4 md:px-8 lg:px-12 py-8 relative'>
           {/* 배경 장식 */}
           <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] pointer-events-none"></div>
           
           <div className='relative z-10 max-w-7xl mx-auto'>
              <Outlet /> 
           </div>
        </div>
      </div>
    </div>
  )
}

export default Layout
