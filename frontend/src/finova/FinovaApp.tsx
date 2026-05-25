import { useState } from 'react'
import './styles.css'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { HomePage } from './HomePage'
import { FeaturesPage } from './FeaturesPage'
import { SolutionsPage } from './SolutionsPage'
import { AnalyticsPage } from './AnalyticsPage'
import { PricingPage } from './PricingPage'
import { LoginPage, SignupPage } from './AuthPages'

type PageName = 'Home' | 'Features' | 'Solutions' | 'Analytics' | 'Pricing' | 'Login' | 'Signup'

const noFooterPages: PageName[] = ['Login', 'Signup']
const noNavPages: PageName[] = []

export function IntelliTraceApp() {
  const [currentPage, setCurrentPage] = useState<PageName>('Home')

  const navigate = (page: string) => {
    setCurrentPage(page as PageName)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'Home':       return <HomePage onNavigate={navigate} />
      case 'Features':   return <FeaturesPage onNavigate={navigate} />
      case 'Solutions':  return <SolutionsPage onNavigate={navigate} />
      case 'Analytics':  return <AnalyticsPage onNavigate={navigate} />
      case 'Pricing':    return <PricingPage onNavigate={navigate} />
      case 'Login':      return <LoginPage onNavigate={navigate} />
      case 'Signup':     return <SignupPage onNavigate={navigate} />
      default:           return <HomePage onNavigate={navigate} />
    }
  }

  const showNav    = !noNavPages.includes(currentPage)
  const showFooter = !noFooterPages.includes(currentPage)

  return (
    <div className="finova-body" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {showNav && <Navbar currentPage={currentPage} onNavigate={navigate} />}
      <main style={{ flex: 1, marginTop: showNav ? 0 : 0 }}>
        {renderPage()}
      </main>
      {showFooter && <Footer onNavigate={navigate} />}
    </div>
  )
}
