import { createContext, useContext, useEffect, useState } from "react";
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useNavigate } from "react-router-dom";

// 개발 모드: 항상 상대 경로 → Vite가 /api를 localhost:3000으로 프록시
// 프로덕션: VITE_BASE_URL 사용 (배포 API 주소)
axios.defaults.baseURL = import.meta.env.DEV ? '' : (import.meta.env.VITE_BASE_URL || '')

export const AppContext = createContext();

export const AppProvider = ({ children }) => {

    const navigate = useNavigate()
    const currency = import.meta.env.VITE_CURRENCY

    const [token, setToken] = useState(localStorage.getItem('token') || null)
    const [user, setUser] = useState(null)
    const [isOwner, setIsOwner] = useState(false)
    const [showLogin, setShowLogin] = useState(false)
    const [pickupDate, setPickupDate] = useState('')
    const [returnDate, setReturnDate] = useState('')
    const [cars, setCars] = useState([])

    // 사용자 데이터 가져오기 (로그인 상태 확인)
    const fetchUser = async (authToken) => {
        try {
            // 헤더에 토큰이 확실히 들어있는지 재확인
            const { data } = await axios.get('/api/user/data', {
                headers: { Authorization: authToken }
            })

            if (data.success) {
                setUser(data.user)
                setIsOwner(data.user.role === 'owner')
            } else {
                logout()
            }
        } catch (error) {
            console.error("Fetch User Error:", error)
            if (error.response?.status === 401) {
                logout()
            }
        }
    }

    // 차량 목록 가져오기
    const fetchCars = async () => {
        try {
            const { data } = await axios.get('/api/user/cars')
            if (data.success) {
                setCars(data.cars)
            }
        } catch (error) {
            console.error("Fetch Cars Error:", error)
        }
    }

    // 로그아웃 함수
    const logout = () => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
        setIsOwner(false)
        delete axios.defaults.headers.common['Authorization']
        toast.success('Logged out successfully')
        navigate('/')
    }

    // 1. 초기 로드 시 차량 목록만 먼저 가져옴
    useEffect(() => {
        fetchCars()
    }, [])

    // 2. 토큰 상태 관리 및 Axios 헤더 동기화 (여기가 핵심!)
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        
        if (storedToken) {
            setToken(storedToken);
            // 모든 요청에 토큰이 포함되도록 기본 헤더 설정
            axios.defaults.headers.common['Authorization'] = storedToken;
            fetchUser(storedToken);
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]); // 토큰이 바뀔 때마다 실행

    const value = {
        navigate, currency, axios, user, setUser,
        token, setToken, isOwner, setIsOwner, fetchUser, 
        showLogin, setShowLogin, logout, fetchCars, 
        cars, setCars, pickupDate, setPickupDate, returnDate, setReturnDate
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export const useAppContext = () => {
    return useContext(AppContext)
}
