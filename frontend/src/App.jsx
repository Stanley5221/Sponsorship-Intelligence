import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Companies from './components/Companies'
import Applications from './components/Applications'
import Dashboard from './components/Dashboard'
import SponsorMap from './components/SponsorMap'
import OfflineBanner from './components/OfflineBanner'
import Login from './pages/Login'
import Register from './pages/Register'
import ApplicationDetails from './components/ApplicationDetails'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'font-outfit text-sm font-medium',
              style: { borderRadius: '12px', padding: '12px 16px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' },
              success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
          <OfflineBanner />
          <Navbar />

          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <Routes>
              <Route path="/" element={<Companies />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />
              <Route path="/sponsor-map" element={
                <ProtectedRoute><SponsorMap /></ProtectedRoute>
              } />
              <Route path="/applications" element={
                <ProtectedRoute><Applications /></ProtectedRoute>
              } />
              <Route path="/applications/:id" element={
                <ProtectedRoute><ApplicationDetails /></ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
