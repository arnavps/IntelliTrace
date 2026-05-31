import { useState, useEffect } from 'react'

interface NavbarProps {
  currentPage: string
  onNavigate: (page: string) => void
}

const navLinks = ['Home', 'Features', 'Solutions', 'Analytics', 'Pricing']

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNav = (page: string) => {
    onNavigate(page)
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <nav className="fn-nav" style={{ background: scrolled ? 'rgba(10,10,10,0.98)' : 'rgba(10,10,10,0.95)' }}>
        <div className="fn-nav-inner">
          {/* Logo */}
          <button className="fn-nav-logo" onClick={() => handleNav('Home')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <div className="fn-nav-logo-icon">⚡</div>
            <span className="fn-nav-logo-text">IntelliTrace</span>
          </button>

          {/* Desktop Menu */}
          <ul className="fn-nav-menu">
            {navLinks.map(link => (
              <li key={link}>
                <button
                  className={`fn-nav-link ${currentPage === link ? 'active' : ''}`}
                  onClick={() => handleNav(link)}
                >
                  {link}
                </button>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="fn-nav-actions">
            <button
              className="fn-nav-link fn-desktop-only"
              onClick={() => handleNav('Login')}
            >
              Login
            </button>
            <button
              className="fn-btn fn-btn-outline-solid"
              onClick={() => handleNav('Signup')}
              style={{ fontSize: '13px', padding: '7px 18px' }}
            >
              Sign Up
            </button>
            {/* Hamburger */}
            <button
              className="fn-nav-hamburger"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Menu"
            >
              <span style={{ transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
              <span style={{ opacity: menuOpen ? 0 : 1 }} />
              <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`fn-mobile-menu ${menuOpen ? 'open' : ''}`}>
        {navLinks.map(link => (
          <button
            key={link}
            className={`fn-nav-link ${currentPage === link ? 'active' : ''}`}
            onClick={() => handleNav(link)}
          >
            {link}
          </button>
        ))}
        <div className="fn-mobile-menu-actions">
          <button className="fn-btn fn-btn-outline" style={{ flex: 1 }} onClick={() => handleNav('Login')}>Login</button>
          <button className="fn-btn fn-btn-primary" style={{ flex: 1 }} onClick={() => handleNav('Signup')}>Sign Up</button>
        </div>
      </div>
    </>
  )
}
