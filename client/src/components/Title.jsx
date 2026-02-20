import React from 'react'

const Title = ({ title, subTitle, align }) => {
  return (
    <div className={`flex flex-col justify-center items-center text-center ${align === "left" ? "md:items-start md:text-left" : ""}`}>
      {/* 제목을 흰색(text-white)으로 명시하고 자간을 줄여 테슬라 느낌을 줍니다 */}
      <h1 className='font-bold text-4xl md:text-[40px] text-white tracking-tight'>
        {title}
      </h1>
      
      {/* 서브타이틀은 약간 밝은 회색(text-gray-400)으로 처리하여 가독성을 높입니다 */}
      <p className='text-sm md:text-base text-gray-400 mt-3 max-w-156 font-light leading-relaxed'>
        {subTitle}
      </p>
      
      {/* 테슬라 브랜드 특유의 미니멀한 레드 포인트를 언더라인으로 추가 (선택 사항) */}
      <div className="w-12 h-1 bg-red-600 mt-4 rounded-full"></div>
    </div>
  )
}

export default Title
