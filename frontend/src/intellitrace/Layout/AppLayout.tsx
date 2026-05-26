import { useLocation, Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const USER_NAME = 'Arjun Sharma'
const USER_ROLE = 'Admin'

interface PageMeta {
  title: string
  subtitle: string
}

const PAGE_META: Record<string, PageMeta> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Overview of financial activity and system health',
  },
  '/transactions': {
    title: 'Transactions',
    subtitle: 'Monitor and investigate financial transactions',
  },
  '/graph': {
    title: 'Graph Explorer',
    subtitle: 'Visualize entity relationships and transaction flows',
  },
  '/alerts': {
    title: 'Alerts',
    subtitle: 'Active alerts requiring attention',
  },
  '/cases': {
    title: 'Cases',
    subtitle: 'Manage active investigation cases',
  },
  '/entities': {
    title: 'Entity Lookup',
    subtitle: 'Search and profile financial entities',
  },
  '/reports': {
    title: 'Reports',
    subtitle: 'Compliance and audit reports',
  },
  '/admin': {
    title: 'Admin',
    subtitle: 'System administration and user management',
  },
}

function getPageMeta(pathname: string): PageMeta {
  // Exact match first
  if (PAGE_META[pathname]) return PAGE_META[pathname]
  // Prefix match for nested routes
  const prefix = Object.keys(PAGE_META).find((key) => pathname.startsWith(key + '/'))
  if (prefix) return PAGE_META[prefix]
  // Default fallback
  return { title: 'IntelliTrace', subtitle: 'Financial Intelligence Platform' }
}

export function AppLayout() {
  const location = useLocation()
  const { title, subtitle } = getPageMeta(location.pathname)

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] font-sans">
      <Sidebar userRole={USER_ROLE} userName={USER_NAME} />
      <div className="ml-60 flex-1 flex flex-col min-h-screen">
        <Topbar
          title={title}
          subtitle={subtitle}
          userName={USER_NAME}
          userRole={USER_ROLE}
        />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
