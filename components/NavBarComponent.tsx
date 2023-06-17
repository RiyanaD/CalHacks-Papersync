import React from 'react'
import logo from "../public/logo.png"


// interface NavBarProps {
//     authors: string
//     title: string
//     abstract: string
// }
  
const NavBarComponent = () => {
    return (

    <div className="w-[1280px] h-[75px] relative">
        <a href = "/home">
            <img src={logo.src} alt = "Placeholder" className='max-w-full max-h-full'/>
        </a>
        <a href ="/posts" className="absolute left-[222px] top-[30px] text-xl text-left text-white">Publish</a>
        <a href ="/home" className="absolute left-[346px] top-[30px] text-xl text-left text-white">Profile</a>
    </div>
    )
}
  
  export default NavBarComponent
