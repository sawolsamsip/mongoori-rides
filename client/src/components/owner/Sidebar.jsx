import React, { useState, useEffect } from 'react'
import { assets, ownerMenuLinks } from '../../assets/assets'
import { NavLink, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const Sidebar = () => {
    const { user, axios, fetchUser } = useAppContext()
    const location = useLocation()
    const [image, setImage] = useState(null)
    const [isUploading, setIsUploading] = useState(false)

    // 이미지를 선택하면 바로 서버에 업로드하는 로직으로 개선
    useEffect(() => {
        if (image) {
            updateImage();
        }
    }, [image])

    const updateImage = async () => {
        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('image', image)
            // 주의: 백엔드 API 경로가 /api/owner/update-image 로 설정되어 있는지 확인 필요
            const { data } = await axios.post('/api/owner/update-image', formData)
            if (data.success) {
                fetchUser()
                toast.success("Profile image updated!")
            } else {
                toast.error(data.message)
            }
        } catch (error) { 
            toast.error(error.message) 
        } finally {
            setIsUploading(false)
            setImage(null) // 업로드 후 초기화하여 동일 파일 재업로드 가능하게 함
        }
    }

    return (
        <div className='h-full flex flex-col items-center pt-8 w-16 md:w-64 border-r border-zinc-900 bg-black flex-shrink-0 z-20'>
            
            {/* 프로필 이미지 영역 */}
            <div className='flex flex-col items-center mb-10 w-full px-2'>
                <div className='relative group'>
                    <label htmlFor="image" className='cursor-pointer block relative'>
                        <img 
                            src={user?.image || assets.user_profile} 
                            alt="Profile" 
                            className={`h-10 w-10 md:h-16 md:w-16 rounded-full object-cover border-2 border-zinc-800 transition-all ${isUploading ? 'opacity-50' : 'group-hover:border-gray-500'}`} 
                        />
                        {/* 마우스 오버 시 편집 아이콘 표시 */}
                        <div className='absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                            <img src={assets.edit_icon} alt="Edit" className='w-4 h-4 invert' />
                        </div>
                        <input type="file" id='image' accept="image/*" hidden onChange={e => setImage(e.target.files[0])} disabled={isUploading} />
                    </label>
                </div>
                <p className='text-white mt-4 hidden md:block font-medium tracking-wide'>{user?.name || 'Partner Host'}</p>
                <p className='text-gray-500 text-[10px] uppercase tracking-widest hidden md:block mt-1'>mongoori club</p>
            </div>

            {/* 네비게이션 링크 영역 */}
            <div className='w-full flex flex-col gap-1'>
                {ownerMenuLinks.map((item, index) => {
                    // 현재 경로가 메뉴의 경로와 일치하는지 확인 (대시보드는 /owner 로 접근할 수도 있으니 예외처리)
                    const isActiveMenu = location.pathname === item.path || (item.path === '/owner/dashboard' && location.pathname === '/owner');

                    return (
                        <NavLink 
                            key={index} 
                            to={item.path} 
                            className={`flex items-center gap-4 w-full py-4 pl-0 md:pl-8 transition-all ${
                                isActiveMenu 
                                ? 'bg-zinc-900/50 text-white border-l-4 border-white' 
                                : 'text-gray-500 border-l-4 border-transparent hover:bg-zinc-900/30 hover:text-gray-300'
                            }`}
                        >
                            <div className='w-full flex justify-center md:justify-start items-center gap-4'>
                                <img 
                                    // 기존 코드에서 item.coloredIcon을 참조했으나 assets.js 구조상 activeIcon임.
                                    src={isActiveMenu ? item.activeIcon : item.icon} 
                                    alt={item.name} 
                                    className={`w-5 h-5 object-contain transition-all ${!isActiveMenu && 'opacity-60 grayscale'}`} 
                                />
                                <span className='hidden md:block font-medium text-sm tracking-wide uppercase'>{item.name}</span>
                            </div>
                        </NavLink>
                    )
                })}
            </div>
        </div>
    )
}

export default Sidebar
