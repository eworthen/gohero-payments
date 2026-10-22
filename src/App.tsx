import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'

const Home = lazy(() => import('./pages/Home'))
const PaymentProcessing = lazy(() => import('./pages/PaymentProcessing'))
const BusinessFunding = lazy(() => import('./pages/BusinessFunding'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const NotFound = lazy(() => import('./pages/NotFound'))
const AdminLayout = lazy(() => import('./admin/components/AdminLayout'))
const Dashboard = lazy(() => import('./admin/pages/Dashboard'))
const Leads = lazy(() => import('./admin/pages/Leads'))
const LeadDetail = lazy(() => import('./admin/pages/LeadDetail'))
const Pipeline = lazy(() => import('./admin/pages/Pipeline'))
const FollowUps = lazy(() => import('./admin/pages/FollowUps'))
const Reports = lazy(() => import('./admin/pages/Reports'))
const Users = lazy(() => import('./admin/pages/Users'))
const AdminNotFound = lazy(() => import('./admin/pages/AdminNotFound'))
const AuditLogs = lazy(() => import('./admin/pages/AuditLogs'))

export function AppRoutes() {
  return (
    <Suspense fallback={<div className="route-loading" role="status">Loading page...</div>}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/:leadId" element={<LeadDetail />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="follow-ups" element={<FollowUps />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<Users />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="*" element={<AdminNotFound />} />
        </Route>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/payment-processing" element={<PaymentProcessing />} />
          <Route path="/business-funding" element={<BusinessFunding />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>
}
