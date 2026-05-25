export function Footer({ onNavigate }: { onNavigate: (page: string) => void }) {
  const linkCols = [
    {
      title: 'Platform',
      links: ['About Us', 'How It Works', 'Blog', 'Careers'],
    },
    {
      title: 'Resources',
      links: ['Help Center', 'Documentation', 'API Access', 'Community Forum'],
    },
    {
      title: 'Company',
      links: ['Terms', 'Privacy Policy', 'Trust Center', 'Security'],
    },
  ]

  const socials = ['f', 'ig', 'tw', 'dr']
  const socialLabels = ['Facebook', 'Instagram', 'Twitter', 'Dribbble']

  return (
    <footer className="fn-footer">
      <div className="fn-container">
        <div className="fn-footer-grid">
          {/* Brand */}
          <div>
            <button
              className="fn-nav-logo"
              onClick={() => onNavigate('Home')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: '12px', display: 'flex' }}
            >
              <div className="fn-nav-logo-icon">⚡</div>
              <span className="fn-nav-logo-text">IntelliTrace</span>
            </button>
            <p className="fn-footer-brand-desc">
              Experience next-generation finance with powerful insights, automation, and real-time control.
            </p>
            <div className="fn-social-row">
              {socials.map((s, i) => (
                <button key={s} className="fn-social-btn" title={socialLabels[i]} aria-label={socialLabels[i]}>
                  {s === 'f' ? 'f' : s === 'ig' ? '◎' : s === 'tw' ? '✕' : '●'}
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {linkCols.map(col => (
            <div key={col.title}>
              <p className="fn-footer-col-title">{col.title}</p>
              <ul className="fn-footer-links">
                {col.links.map(link => (
                  <li key={link}>
                    <button className="fn-footer-link" onClick={() => {}}>{link}</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Watermark */}
      <div className="fn-footer-watermark">
        <span className="fn-footer-watermark-text">IntelliTrace</span>
      </div>

      <div className="fn-footer-bottom">
        <div className="fn-container">
          <p>© 2026 IntelliTrace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
