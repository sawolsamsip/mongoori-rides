import React, { useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const Login = () => {
  const [state, setState] = useState('Login') // 'Login' or 'Sign Up'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signUpRole, setSignUpRole] = useState('user') // 'user' = driver (rent cars), 'owner' = host (list my car)

  // AppContext에서 필요한 함수들 가져오기
  const { setShowLogin, axios, setToken, setUser } = useAppContext()

  // 🚨 모달이 떠 있을 때 뒷배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    try {
      if (state === 'Login') {
        // 로그인 API 호출 (엔드포인트는 백엔드 라우트에 따라 /api/user/login 또는 /api/users/login 일 수 있습니다)
        const { data } = await axios.post('/api/user/login', { email, password })
        if (data.success) {
          setToken(data.token)
          setUser(data.user || null)
          localStorage.setItem('token', data.token)
          setShowLogin(false)
          toast.success('Welcome back to mongoori rides!')
        } else {
          toast.error(data.message)
        }
      } else {
        const { data } = await axios.post('/api/user/register', { name, email, password, role: signUpRole })
        if (data.success) {
          setToken(data.token)
          setUser(data.user || { role: signUpRole, name, email })
          localStorage.setItem('token', data.token)
          setShowLogin(false)
          toast.success(signUpRole === 'owner' ? 'Host account created. Go to Owner Portal to add your car.' : 'Account created successfully!')
        } else {
          toast.error(data.message)
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  return (
    // z-[100]으로 네비게이션바보다 항상 위에 뜨도록 설정
    <div className='fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-0'>
      
      {/* 어두운 배경 오버레이 (클릭 시 모달 닫힘) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='absolute inset-0 bg-black/80 backdrop-blur-sm' 
        onClick={() => setShowLogin(false)}
      ></motion.div>

      {/* 로그인 폼 모달 박스 */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        className='relative bg-zinc-900/90 border border-zinc-800 rounded-[2.5rem] w-full max-w-md p-8 md:p-12 shadow-2xl overflow-hidden'
      >
        {/* 장식용 은은한 빛 효과 */}
        <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none"></div>

        {/* 상단 헤더 & 닫기 버튼 */}
        <div className='flex justify-between items-start mb-10 relative z-10'>
          <div>
            <h2 className='text-3xl font-black text-white tracking-tighter'>
              {state === 'Login' ? 'Welcome Back.' : 'Join mongoori.'}
            </h2>
            <p className='text-gray-400 text-sm mt-2 font-light'>
              {state === 'Login' ? 'Sign in to access your premium trips.' : 'Create an account to elevate your journey.'}
            </p>
          </div>
          <button 
            onClick={() => setShowLogin(false)} 
            className='p-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-full transition-colors cursor-pointer'
          >
            <img src={assets.close_icon} alt="Close" className='w-4 h-4 invert opacity-70' />
          </button>
        </div>

        {/* 폼 영역 */}
        <form onSubmit={onSubmitHandler} className='flex flex-col gap-5 relative z-10'>
          
          <AnimatePresence>
            {state === 'Sign Up' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='flex flex-col gap-2 overflow-hidden'
              >
                <label className='text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]'>Full Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe"
                  onChange={(e) => setName(e.target.value)} 
                  value={name} 
                  required 
                  className='bg-black/50 border border-zinc-800 p-4 rounded-2xl text-white outline-none focus:border-gray-400 transition-colors text-sm'
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className='flex flex-col gap-2'>
            <label className='text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]'>Email Address</label>
            <input 
              type="email" 
              placeholder="name@example.com"
              onChange={(e) => setEmail(e.target.value)} 
              value={email} 
              required 
              className='bg-black/50 border border-zinc-800 p-4 rounded-2xl text-white outline-none focus:border-gray-400 transition-colors text-sm'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]'>Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)} 
              value={password} 
              required 
              className='bg-black/50 border border-zinc-800 p-4 rounded-2xl text-white outline-none focus:border-gray-400 transition-colors text-sm'
            />
          </div>

          {state === 'Sign Up' && (
            <div className='flex flex-col gap-2'>
              <label className='text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]'>I want to</label>
              <div className='flex gap-3'>
                <label className={`flex-1 flex items-center justify-center p-4 rounded-2xl border cursor-pointer transition-colors bg-black/50 hover:border-gray-500 ${signUpRole === 'user' ? 'border-white bg-white/5' : 'border-zinc-800'}`}>
                  <input type='radio' name='signUpRole' value='user' checked={signUpRole === 'user'} onChange={() => setSignUpRole('user')} className='sr-only' />
                  <span className='text-sm text-white'>Rent cars (Driver)</span>
                </label>
                <label className={`flex-1 flex items-center justify-center p-4 rounded-2xl border cursor-pointer transition-colors bg-black/50 hover:border-gray-500 ${signUpRole === 'owner' ? 'border-white bg-white/5' : 'border-zinc-800'}`}>
                  <input type='radio' name='signUpRole' value='owner' checked={signUpRole === 'owner'} onChange={() => setSignUpRole('owner')} className='sr-only' />
                  <span className='text-sm text-white'>List my car (Host)</span>
                </label>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className='w-full bg-white text-black py-4 mt-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)] cursor-pointer'
          >
            {state === 'Login' ? 'Sign In' : 'Create Account'}
          </button>

          <div className='mt-6 text-center text-xs text-gray-500 uppercase tracking-wide font-medium'>
            {state === 'Login' ? (
              <p>
                Don't have an account?{' '}
                <span onClick={() => setState('Sign Up')} className='text-white font-bold cursor-pointer hover:underline underline-offset-4 ml-1'>
                  Sign Up
                </span>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <span onClick={() => setState('Login')} className='text-white font-bold cursor-pointer hover:underline underline-offset-4 ml-1'>
                  Sign In
                </span>
              </p>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default Login
