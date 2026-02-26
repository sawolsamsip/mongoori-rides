import React, { useState } from 'react'
import upload_icon from '../../assets/upload_icon.svg' 
import tick_icon from '../../assets/tick_icon.svg' 
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const AddCar = () => {
  const { axios, currency, user } = useAppContext()

  const [image, setImage] = useState(null)
  const [car, setCar] = useState({
    brand: 'Tesla',
    model: '',
    year: new Date().getFullYear(),
    pricePerDay: '',
    category: '',
    autopilot: 'Basic',
    battery_range: '',
    seating_capacity: 5,
    location: 'Irvine, CA', // Irvine으로 고정
    description: '',
  })

  const [isLoading, setIsLoading] = useState(false)

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (!image) return toast.error("Please upload a high-res car image.")
    
    // 필수 데이터 최종 검증
    if (!car.model || !car.pricePerDay || !car.battery_range || !car.description) {
      return toast.error("Please fill in all required technical specs.")
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', image)
      formData.append('carData', JSON.stringify(car))

      const { data } = await axios.post('/api/owner/add-car', formData)

      if (data.success) {
        toast.success("Tesla Listed Successfully!")
        setImage(null)
        setCar({
          brand: 'Tesla',
          model: '',
          year: new Date().getFullYear(),
          pricePerDay: '',
          category: '',
          autopilot: 'Basic',
          battery_range: '',
          seating_capacity: 5,
          location: 'Irvine, CA',
          description: '',
        })
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error(error)
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 공통 Input 클래스 스타일 (코드를 깔끔하게 유지하기 위함)
  const inputClass = "bg-black/50 border border-zinc-800 p-4 rounded-2xl text-white outline-none focus:border-gray-400 transition-colors text-sm w-full"
  const labelClass = "text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 block"

  // Tesla-connected owners should primarily add vehicles via the Tesla Sync page.
  const teslaConnected = !!user?.teslaAccessToken

  if (teslaConnected) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='w-full text-white'
      >
        <div className='mb-10'>
          <h2 className='text-[10px] font-bold tracking-[0.3em] text-gray-500 uppercase mb-2'>Partner Program</h2>
          <h1 className='text-3xl md:text-4xl font-black tracking-tight'>Tesla Sync Only.</h1>
          <p className='text-gray-400 text-sm mt-3 font-light max-w-xl'>
            Your account is connected to Tesla. Vehicle listings are managed via{' '}
            <span className='font-semibold text-white'>Tesla &rarr; Add vehicles to fleet</span>. Please sync your
            Tesla account and select vehicles to add to your Mongoori fleet from the Tesla page.
          </p>
        </div>
        <div className='rounded-3xl border border-zinc-800 bg-zinc-900/40 p-10 max-w-2xl'>
          <p className='text-gray-300 text-sm mb-3'>
            To keep specs, range, and telemetry accurate, new Tesla vehicles should be registered via{' '}
            <span className='font-semibold text-white'>Tesla Sync</span> instead of manual entry.
          </p>
          <p className='text-gray-500 text-sm'>
            Go to the <span className='font-semibold text-white'>Tesla</span> section in the sidebar, sync your
            account, and add vehicles from there. You can then edit pricing and details in <span className='font-semibold text-white'>Manage Cars</span>.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='w-full text-white'
    >
        {/* 헤더 타이틀 */}
        <div className='mb-10'>
            <h2 className='text-[10px] font-bold tracking-[0.3em] text-gray-500 uppercase mb-2'>Partner Program</h2>
            <h1 className='text-3xl md:text-4xl font-black tracking-tight'>List Your Tesla.</h1>
            <p className='text-gray-400 text-sm mt-3 font-light max-w-xl'>
                Turn your vehicle into a high-earning asset. Location is currently restricted to <strong className='text-white font-medium'>Irvine, CA</strong> to ensure premium service quality.
            </p>
        </div>

        {/* 메인 폼 */}
        <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={onSubmitHandler} 
            className='bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 w-full max-w-4xl shadow-2xl space-y-10'
        >
        
        {/* 1. 차량 이미지 업로드 */}
        <div>
          <label className={labelClass}>Vehicle Photo</label>
          <label htmlFor="car-image" className='group relative w-full md:w-2/3 lg:w-1/2 h-56 md:h-64 bg-zinc-900/50 border-2 border-dashed border-zinc-700 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 hover:bg-zinc-800/50 transition-all overflow-hidden'>
            {image ? (
                <img src={URL.createObjectURL(image)} alt="Preview" className='w-full h-full object-contain p-4 drop-shadow-xl'/>
            ) : (
                <div className='flex flex-col items-center gap-4 text-center px-6'>
                    <div className='w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform'>
                        <img src={upload_icon} alt="" className='w-6 invert opacity-70'/>
                    </div>
                    <div>
                        <p className='text-sm font-bold text-gray-300'>Upload High-Res Photo</p>
                        <p className='text-xs text-gray-500 mt-1 font-light'>PNG, JPG up to 5MB</p>
                    </div>
                </div>
            )}
            <input type="file" id="car-image" accept="image/*" hidden onChange={e => setImage(e.target.files[0])} />
          </label>
        </div>

        <div className='h-[1px] w-full bg-zinc-800/50'></div>

        {/* 2. 모델 & 서비스 위치 */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          <div>
            <label className={labelClass}>Tesla Model</label>
            <select required className={inputClass} value={car.model} onChange={e => setCar({ ...car, model: e.target.value })}>
              <option value="" className='bg-zinc-900'>Select Model</option>
              <option value="Model 3" className='bg-zinc-900'>Model 3</option>
              <option value="Model Y" className='bg-zinc-900'>Model Y</option>
              <option value="Model S" className='bg-zinc-900'>Model S</option>
              <option value="Model X" className='bg-zinc-900'>Model X</option>
              <option value="Cybertruck" className='bg-zinc-900'>Cybertruck</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Service Location</label>
            <input 
              type="text" 
              readOnly 
              className='bg-black/30 border border-zinc-800/50 p-4 rounded-2xl text-zinc-500 outline-none cursor-not-allowed text-sm w-full font-medium tracking-wide' 
              value={car.location} 
            />
          </div>
        </div>

        {/* 3. 카테고리, 연식, 좌석 수 */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          <div>
            <label className={labelClass}>Category</label>
            <select required className={inputClass} value={car.category} onChange={e => setCar({ ...car, category: e.target.value })}>
              <option value="" className='bg-zinc-900'>Select</option>
              <option value="Sedan" className='bg-zinc-900'>Sedan</option>
              <option value="SUV" className='bg-zinc-900'>SUV</option>
              <option value="Performance" className='bg-zinc-900'>Performance</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Year</label>
            <input type="number" className={inputClass} value={car.year} onChange={e => setCar({ ...car, year: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Seating</label>
            <input type="number" min="2" max="7" className={inputClass} value={car.seating_capacity} onChange={e => setCar({ ...car, seating_capacity: e.target.value })} />
          </div>
        </div>

        {/* 4. 기술 스펙 (오토파일럿, 주행거리, 가격) */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          <div>
            <label className={labelClass}>Autopilot Package</label>
            <select className={inputClass} value={car.autopilot} onChange={e => setCar({ ...car, autopilot: e.target.value })}>
              <option value="Basic" className='bg-zinc-900'>Basic Autopilot</option>
              <option value="Enhanced" className='bg-zinc-900'>Enhanced Autopilot</option>
              <option value="FSD" className='bg-zinc-900'>Full Self-Driving</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Range (miles)</label>
            <input type="number" placeholder="e.g. 330" required className={inputClass} value={car.battery_range} onChange={e => setCar({ ...car, battery_range: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Price per Day ({currency})</label>
            <input type="number" placeholder="e.g. 150" required className={inputClass} value={car.pricePerDay} onChange={e => setCar({ ...car, pricePerDay: e.target.value })} />
          </div>
        </div>

        {/* 5. 상세 설명 */}
        <div>
          <label className={labelClass}>Vehicle Notes / Trim Features</label>
          <textarea 
            rows={4} 
            placeholder="e.g. White Interior, Acceleration Boost, 20'' Induction Wheels, etc." 
            required 
            className={`${inputClass} resize-none`} 
            value={car.description} 
            onChange={e => setCar({ ...car, description: e.target.value })}
          ></textarea>
        </div>

        <div className='pt-6'>
            <button 
                type="submit"
                disabled={isLoading} 
                className='flex items-center justify-center gap-3 px-10 py-5 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-200 hover:scale-105 transition-all w-full md:w-auto disabled:bg-zinc-800 disabled:text-zinc-500 disabled:hover:scale-100 shadow-[0_0_20px_rgba(255,255,255,0.15)]'
            >
            {isLoading ? (
                <>
                    <div className='w-4 h-4 border-2 border-zinc-500 border-t-black rounded-full animate-spin'></div>
                    Listing...
                </>
            ) : (
                <>
                    <img src={tick_icon} alt="" className='w-3.5 invert' />
                    List Vehicle
                </>
            )}
            </button>
        </div>

      </motion.form>
    </motion.div>
  )
}

export default AddCar
