// 로고, 비디오, 프로필 이미지
import logo from './logo.svg'
import tesla_video from './tesla-video.mp4'
import main_car from './main_car.png'
import user_profile from './user_profile.png' // 🌟 프로필 이미지 추가
// Tesla model-specific images (replace tesla_model_y with Model Y asset when available)
const tesla_model_3 = main_car
const tesla_model_y = main_car

// 메뉴 및 액션 아이콘
import addIcon from './addIcon.svg'
import addIconColored from './addIconColored.svg'
import listIcon from './listIcon.svg'
import listIconColored from './listIconColored.svg'
import carIcon from './carIcon.svg'
import carIconColored from './carIconColored.svg'
import dashboardIcon from './dashboardIcon.svg'
import dashboardIconColored from './dashboardIconColored.svg'

// 기타 기능 아이콘
import arrow_icon from './arrow_icon.svg'
import delete_icon from './delete_icon.svg'
import edit_icon from './edit_icon.svg'
import menu_icon from './menu_icon.svg'
import search_icon from './search_icon.svg'
import star_icon from './star_icon.svg'
import upload_icon from './upload_icon.svg'
import check_icon from './check_icon.svg'
import close_icon from './close_icon.svg'
import tick_icon from './tick_icon.svg'
import fuel_icon from './fuel_icon.svg'
import location_icon from './location_icon.svg'
import users_icon from './users_icon.svg'

// 오너용 메뉴 링크 설정
export const ownerMenuLinks = [
    { 
        name: 'Dashboard', 
        path: '/owner/dashboard', 
        icon: dashboardIcon, 
        activeIcon: dashboardIconColored 
    },
    { 
        name: 'Add Car', 
        path: '/owner/tesla', 
        icon: addIcon, 
        activeIcon: addIconColored 
    },
    { 
        name: 'Manage Cars', 
        path: '/owner/manage-cars', 
        icon: listIcon, 
        activeIcon: listIconColored 
    },
    { 
        name: 'Bookings', 
        path: '/owner/manage-bookings', 
        icon: listIcon, 
        activeIcon: listIconColored 
    },
    { 
        name: 'Finances', 
        path: '/owner/finances', 
        icon: listIcon, 
        activeIcon: listIconColored 
    },
    { 
        name: 'Incidents', 
        path: '/owner/incidentals', 
        icon: listIcon, 
        activeIcon: listIconColored 
    },
]

// 전체 에셋 객체 내보내기
export const assets = {
    logo,
    tesla_video,
    main_car,
    tesla_model_3,
    tesla_model_y,
    user_profile, // 🌟 여기서도 내보내기!
    addIcon,
    addIconColored,
    listIcon,
    listIconColored,
    carIcon,
    carIconColored,
    dashboardIcon,
    dashboardIconColored,
    arrow_icon,
    delete_icon,
    edit_icon,
    menu_icon,
    search_icon,
    star_icon,
    upload_icon,
    check_icon,
    close_icon,
    tick_icon,
    fuel_icon,
    location_icon,
    users_icon
}
