import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './intellitrace/Layout/AppLayout'
import { DashboardPage } from './intellitrace/pages/DashboardPage'
import { TransactionsPage } from './intellitrace/pages/TransactionsPage'
import { GraphExplorerPage } from './intellitrace/pages/GraphExplorerPage'
import { AlertsPage } from './intellitrace/pages/AlertsPage'
import { AlertDetailPage } from './intellitrace/pages/AlertDetailPage'
import { CaseManagementPage } from './intellitrace/pages/CaseManagementPage'
import EntityProfilePage from './intellitrace/pages/EntityProfilePage'
import EntityLookupPage from './intellitrace/pages/EntityLookupPage'
import ReportsPage from './intellitrace/pages/ReportsPage'
import { AdminPage } from './intellitrace/pages/AdminPage'
import { IntelliTraceApp } from './finova/FinovaApp'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main landing site (Finova) */}
        <Route path="/" element={<IntelliTraceApp />} />
        
        {/* Authenticated app shell */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard"    element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/graph"        element={<GraphExplorerPage />} />
          <Route path="/alerts"       element={<AlertsPage />} />
          <Route path="/alerts/:alertId" element={<AlertDetailPage />} />
          <Route path="/cases"        element={<CaseManagementPage />} />
          <Route path="/entities"     element={<EntityLookupPage />} />
          <Route path="/entity/:entityId" element={<EntityProfilePage />} />
          <Route path="/reports"      element={<ReportsPage />} />
          <Route path="/admin"        element={<AdminPage />} />
        </Route>


        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
