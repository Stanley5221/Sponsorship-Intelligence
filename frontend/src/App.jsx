import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Search, Briefcase, LayoutDashboard, BarChart3, Map as MapIcon, LogOut, User } from 'lucide-react'
import Companies from './components/Companies'
import Applications from './components/Applications'
import Dashboard from './components/Dashboard'
import SponsorMap from './components/SponsorMap'
import OfflineBanner from './components/OfflineBanner'
import PWAInstall from './components/PWAInstall'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider, useAuth } from './context/AuthContext'

function AppContent() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-outfit">
      <Toaster position="top-right" />
      <OfflineBanner />

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
                  S
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent hidden sm:block">
                  Sponsorship
                </span>
              </Link>
              <div className="hidden md:flex items-center gap-4 text-layout">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-all hover:bg-blue-50/50 rounded-lg"
                >
                  <BarChart3 className="w-4 h-4" /> Dashboard
                </Link>
                <Link
                  to="/sponsor-map"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-all hover:bg-blue-50/50 rounded-lg"
                >
                  <MapIcon className="w-4 h-4" /> Sponsor Map
                </Link>
                <Link
                  to="/"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-all hover:bg-blue-50/50 rounded-lg"
                >
                  <Search className="w-4 h-4" /> Search
                </Link>
                <Link
                  to="/applications"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-all hover:bg-blue-50/50 rounded-lg"
                >
                  <Briefcase className="w-4 h-4" /> My Tracker
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <PWAInstall />
              {user ? (
                <div className="flex items-center gap-4 border-l border-gray-100 pl-4">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs font-bold text-gray-900">{user.email.split('@')[0]}</span>
                    <span className="text-[10px] text-gray-400">Authenticated</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
                >
                  <User className="w-4 h-4" /> Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App
