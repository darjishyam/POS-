'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuth, Role } from '@/context/AuthContext'
import { 
  LogOut, 
  User as UserIcon, 
  ShieldCheck, 
  Mail, 
  ChevronDown,
  LayoutDashboard,
  Settings,
  ExternalLink
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface UserProfileDropdownProps {
  variant?: 'header' | 'sidebar'
}

export function UserProfileDropdown({ variant = 'header' }: UserProfileDropdownProps) {
  const { user, role, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Reset error when user changes
  useEffect(() => {
    setImgError(false)
  }, [user?.photoURL])

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  const isHeader = variant === 'header'
  const isAdmin = role === 'admin'

  return (
    <div className={`relative ${variant === 'sidebar' ? 'w-full' : ''}`} ref={dropdownRef}>
      {/* Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 p-2 rounded-2xl transition-all active:scale-95 group w-full ${
          isOpen ? 'bg-white/10' : 'hover:bg-white/5'
        }`}
      >
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group relative">
          {user.photoURL && !imgError ? (
            <img 
              src={user.photoURL} 
              alt="User" 
              className="w-full h-full object-cover" 
              onError={() => setImgError(true)}
            />
          ) : (
            <UserIcon className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
          )}
        </div>
        
        <div className="flex-1 text-left min-w-0">
          <p className="text-[10px] font-black text-white uppercase tracking-tight truncate">
            {user.displayName || 'Operator'}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
             <ShieldCheck className={`w-3 h-3 ${isAdmin ? 'text-emerald-500' : 'text-blue-500'}`} />
             <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest truncate">
               {isAdmin ? 'System Commander' : 'Active Operator'}
             </p>
          </div>
        </div>
        
        <ChevronDown className={`w-3 h-3 text-slate-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: variant === 'sidebar' ? -10 : 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: variant === 'sidebar' ? -10 : 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className={`absolute ${variant === 'sidebar' ? 'bottom-full mb-4 left-0' : 'top-full mt-4 right-0'} w-72 bg-white rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden z-[100]`}
          >
            {/* User Info Header */}
            <div className="p-6 bg-slate-950 text-white relative overflow-hidden">
               {/* Background Glow */}
               <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
               
               <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-14 h-14 rounded-2xl border-2 border-white/10 overflow-hidden bg-white/5">
                        {user.photoURL && !imgError ? (
                           <img 
                             src={user.photoURL} 
                             alt="User" 
                             className="w-full h-full object-cover" 
                             onError={() => setImgError(true)}
                           />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center">
                              <UserIcon className="w-6 h-6 text-white/20" />
                           </div>
                        )}
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black uppercase tracking-tight truncate italic">
                           {user.displayName || 'Active Operator'}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1">
                           <ShieldCheck className={`w-3 h-3 ${isAdmin ? 'text-emerald-400' : 'text-blue-400'}`} />
                           <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50">
                              {isAdmin ? 'System Commander' : 'Authorized Access'}
                           </span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                     <Mail className="w-3 h-3 text-white/30 flex-shrink-0" />
                     <span className="text-[9px] font-black text-white/40 truncate lowercase tracking-widest">
                        {user.email}
                     </span>
                  </div>
               </div>
            </div>

            {/* Menu Options */}
            <div className="p-3">
               {isAdmin && (
                  <Link 
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all group"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    Management Console
                  </Link>
               )}
               
               <Link 
                 href="/dashboard/settings"
                 onClick={() => setIsOpen(false)}
                 className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all group"
               >
                 <Settings className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                 Account Infrastructure
               </Link>

               <div className="h-px bg-slate-100 my-2 mx-4" />

               <button 
                 onClick={() => {
                   setIsOpen(false);
                   logout();
                 }}
                 className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all group"
               >
                 <LogOut className="w-4 h-4 text-slate-300 group-hover:text-rose-500 transition-colors" />
                 Terminate Uplink
               </button>
            </div>
            
            <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
               <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em] italic">
                  Protocal v2.5.0 Matrix
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
