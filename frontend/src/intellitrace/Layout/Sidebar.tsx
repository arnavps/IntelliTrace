import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Activity,
  Network,
  Bell,
  Briefcase,
  Users,
  FileText,
  Settings,
  Shield,
} from 'lucide-react'

interface SidebarProps {
  userRole: string
  userName: string
}

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  badge?: { count: number; color: 'red' | 'amber' }
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'MAIN',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard size={16} /> },
      { label: 'Transactions', to: '/transactions', icon: <Activity size={16} /> },
      { label: 'Graph Explorer', to: '/graph', icon: <Network size={16} /> },
    ],
  },
  {
    title: 'INVESTIGATION',
    items: [
      {
        label: 'Alerts',
        to: '/alerts',
        icon: <Bell size={16} />,
        badge: { count: 3, color: 'red' },
      },
      {
        label: 'Cases',
        to: '/cases',
        icon: <Briefcase size={16} />,
        badge: { count: 5, color: 'amber' },
      },
      { label: 'Entity Lookup', to: '/entities', icon: <Users size={16} /> },
    ],
  },
  {
    title: 'COMPLIANCE',
    items: [
      { label: 'Reports', to: '/reports', icon: <FileText size={16} /> },
      { label: 'Admin', to: '/admin', icon: <Settings size={16} /> },
    ],
  },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function Sidebar({ userRole, userName }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#0D0D0D] border-r border-[#1E1E1E] flex flex-col z-40">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1E1E1E]">
        <div className="w-8 h-8 bg-[#F5A623] rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield size={16} className="text-black" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-tight truncate">IntelliTrace</p>
          <p className="text-[#666] text-[10px] leading-tight truncate">Financial Intelligence</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="text-[#444] text-[10px] font-semibold tracking-widest uppercase px-2 mb-2">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 w-full group',
                        isActive
                          ? 'text-[#F5A623] bg-[#F5A623]/10 border border-[#F5A623]/20'
                          : 'text-[#666] hover:text-white hover:bg-white/5 border border-transparent',
                      ].join(' ')
                    }
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={[
                          'text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none flex-shrink-0',
                          item.badge.color === 'red'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-[#F5A623]/20 text-[#F5A623]',
                        ].join(' ')}
                      >
                        {item.badge.count}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: User info */}
      <div className="px-3 py-4 border-t border-[#1E1E1E]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[#F5A623]/20 border border-[#F5A623]/30 flex items-center justify-center flex-shrink-0">
            <span className="text-[#F5A623] text-[11px] font-bold">{getInitials(userName)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-medium truncate">{userName}</p>
            <span className="inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#F5A623]/15 text-[#F5A623] leading-none">
              {userRole}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
