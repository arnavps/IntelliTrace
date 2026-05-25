import { useState } from 'react'
import { FinancialCrimeDashboard } from './components/FinancialCrimeDashboard'
import { IntelliTraceApp } from './finova/FinovaApp'

function App() {
  const [showDashboard, setShowDashboard] = useState(false)

  if (showDashboard) {
    return (
      <>
        <FinancialCrimeDashboard />
        <button
          onClick={() => setShowDashboard(false)}
          style={{
            position: 'fixed',
            top: '12px',
            right: '12px',
            zIndex: 9999,
            background: 'rgba(245,166,35,0.9)',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          ← Finova Site
        </button>
      </>
    )
  }

  return (
    <>
      <IntelliTraceApp />
      <button
        onClick={() => setShowDashboard(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: 'rgba(245,166,35,0.9)',
          color: '#000',
          border: 'none',
          borderRadius: '10px',
          padding: '10px 18px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 16px rgba(245,166,35,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
        title="Open IntelliTrace Dashboard"
      >
        🔍 IntelliTrace Dashboard
      </button>
    </>
  )
}

export default App
