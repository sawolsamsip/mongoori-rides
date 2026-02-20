import { createContext, useContext, useEffect, useState } from "react";
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useNavigate } from "react-router-dom";

// 환경 변수에서 기본 URL 설정
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

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
            // 헤더에 토큰 직접 설정 (안전성 확보)
            const { data } = await axios.get('/api/user/data', {
                headers: { Authorization: authToken }
            })

            if (data.success) {
                setUser(data.user)
                setIsOwner(data.user.role === 'owner')
            } else {
                // 토큰이 유효하지 않은 경우 로그아웃 처리
                logout()
            }
        } catch (error) {
            console.error(error)
            // 401 에러(인증 만료) 등의 경우 로그아웃
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
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.error(error)
        }
    }

    // 로그아웃 함수
    const logout = () => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
        setIsOwner(false)
        // 공통 헤더 초기화
        delete axios.defaults.headers.common['Authorization']
        toast.success('Logged out successfully')
        navigate('/')
    }

    // 초기 실행: 차량 목록 로드 및 토큰 확인
    useEffect(() => {
        fetchCars()
        const storedToken = localStorage.getItem('token')
        if (storedToken) {
            setToken(storedToken)
        }
    }, [])

    // 토큰이 변경될 때마다 axios 헤더 갱신 및 유저 정보 업데이트
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = token
            fetchUser(token)
        } else {
            delete axios.defaults.headers.common['Authorization']
        }
    }, [token])

    const value = {
        navigate, 
        currency, 
        axios, 
        user, 
        setUser,
        token, 
        setToken, 
        isOwner, 
        setIsOwner, 
        fetchUser, 
        showLogin, 
        setShowLogin, 
        logout, 
        fetchCars, 
        cars, 
        setCars, 
        pickupDate, 
        setPickupDate, 
        returnDate, 
        setReturnDate
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
