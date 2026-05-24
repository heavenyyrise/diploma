import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LeadsProvider } from './context/LeadsContext'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import Dashboard from './pages/Dashboard'
import OrdersPage from './pages/orders/OrdersPage'
import OrderDetail from './pages/orders/OrderDetail'
import ClientsPage from './pages/clients/ClientsPage'
import ClientDetail from './pages/clients/ClientDetail'
import ServicesPage from './pages/services/ServicesPage'
import IncomePage from './pages/IncomePage'
import LeadsPage from './pages/leads/LeadsPage'
import FormSettingsPage from './pages/FormSettingsPage'
import PublicLeadForm from './pages/PublicLeadForm'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>Загрузка...</div>
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/form" element={<PublicLeadForm />} />
      <Route path="/" element={<PrivateRoute><LeadsProvider><Layout /></LeadsProvider></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="income" element={<IncomePage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="form-settings" element={<FormSettingsPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return <BrowserRouter><AuthProvider><AppRoutes /></AuthProvider></BrowserRouter>
}
