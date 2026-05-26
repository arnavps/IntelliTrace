import { useState, useRef, useEffect } from 'react'
import { Bell, Settings, ChevronDown, LogOut, User, Shield } from 'lucide-react'

interface TopbarProps {
  title: string
  subtitle?: string
  userName: string
  userRole: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function Topbar({ title, subtitle, userName, userRole }: TopbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-30 h-[60px] flex items-center px-6 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-[#1E1E1E]">
      {/* Left: Title + Breadcrumb */}
      <div className="flex-1 min-w-0">
        <h1 className="text-white font-semibold text-base leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-[#555] text-[11px] leading-tight truncate mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Center: System Status */}
      <div className="flex items-center gap-2 px-4">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-green-400 text-xs font-medium">System Active</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <button
          className="relative w-9 h-9 flex items-center justify-center bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg hover:border-[#3A3A3A] hover:bg-[#222] transition text-[#999] hover:text-white"
          aria-label="Notifications"
        >
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        {/* Settings */}
        <button
          className="w-9 h-9 flex items-center justify-center bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg hover:border-[#3A3A3A] hover:bg-[#222] transition text-[#999] hover:text-white"
          aria-label="Settings"
        >
          <Settings size={15} />
        </button>

        {/* User Avatar + Dropdown */}
        <div className="relative ml-1" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg pl-1 pr-2 h-9 hover:border-[#3A3A3A] hover:bg-[#222] transition"
          >
            <div className="w-7 h-7 rounded-md bg-[#F5A623]/20 border border-[#F5A623]/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[#F5A623] text-[10px] font-bold">{getInitials(userName)}</span>
            </div>
            <span className="text-white text-xs font-medium hidden sm:block">{userName.split(' ')[0]}</span>
            <ChevronDown
              size={12}
              className={`text-[#666] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden z-50">
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-[#2A2A2A]">
                <p className="text-white text-sm font-semibold truncate">{userName}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Shield size={11} className="text-[#F5A623]" />
                  <span className="text-[#F5A623] text-[11px] font-medium">{userRole}</span>
                </div>
              </div>
              {/* Menu Items */}
              <div className="py-1">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-[#999] hover:text-white hover:bg-white/5 text-sm transition">
                  <User size={14} />
                  <span>Profile</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-[#999] hover:text-white hover:bg-white/5 text-sm transition">
                  <Settings size={14} />
                  <span>Preferences</span>
                </button>
              </div>
              <div className="border-t border-[#2A2A2A] py-1">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm transition">
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
