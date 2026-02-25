import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    Search, Briefcase, BarChart3, Map as MapIcon,
    LogOut, User, Menu, X
} from 'lucide-react'
import PWAInstall from './PWAInstall'

const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { to: '/sponsor-map', label: 'Sponsor Map', icon: MapIcon },
    { to: '/', label: 'Search', icon: Search },
    { to: '/applications', label: 'My Tracker', icon: Briefcase },
]

export default function Navbar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [menuOpen, setMenuOpen] = useState(false)

    // Close drawer on route change
    useEffect(() => {
        setMenuOpen(false)
    }, [location.pathname])

    // Prevent body scroll when drawer is open
    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [menuOpen])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const isActive = (path) => {
        if (path === '/' && location.pathname === '/') return true
        if (path !== '/' && location.pathname.startsWith(path)) return true
        return false
    }

    return (
        <>
            {/* Main Navbar */}
            <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-200">
                                S
                            </div>
                            <span className="text-lg font-bold text-gray-900 hidden sm:block tracking-tight">
                                Sponsorship<span className="text-blue-600 font-black">Intel</span>
                            </span>
                        </Link>

                        {/* Desktop Nav Links */}
                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map(({ to, label, icon: Icon }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${isActive(to)
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </Link>
                            ))}
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center gap-3">
                            <PWAInstall />

                            {user ? (
                                <div className="hidden md:flex items-center gap-3 border-l border-gray-100 pl-3">
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs font-bold text-gray-900 leading-tight">
                                            {user.email.split('@')[0]}
                                        </span>
                                        <span className="text-[10px] text-gray-400 leading-tight">Authenticated</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                        title="Logout"
                                        aria-label="Logout"
                                    >
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 shadow-sm shadow-blue-200 active:scale-95"
                                >
                                    <User className="w-4 h-4" />
                                    Sign In
                                </Link>
                            )}

                            {/* Hamburger Button (Mobile Only) */}
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                                aria-expanded={menuOpen}
                            >
                                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Backdrop */}
            {menuOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Mobile Slide-In Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out md:hidden flex flex-col ${menuOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
            >
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-200">
                            S
                        </div>
                        <span className="text-base font-bold text-gray-900 tracking-tight">
                            Sponsorship<span className="text-blue-600 font-black">Intel</span>
                        </span>
                    </div>
                    <button
                        onClick={() => setMenuOpen(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Close menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Drawer Nav Links */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {navLinks.map(({ to, label, icon: Icon }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`flex items-center gap-3 px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 min-h-[44px] ${isActive(to)
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Drawer Footer / User Auth */}
                <div className="p-4 border-t border-gray-100">
                    {user ? (
                        <div className="space-y-3">
                            <div className="px-4 py-3 bg-gray-50 rounded-xl">
                                <p className="text-sm font-bold text-gray-900">{user.email.split('@')[0]}</p>
                                <p className="text-xs text-gray-400">{user.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors min-h-[44px]"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Link
                                to="/login"
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors min-h-[44px]"
                            >
                                <User className="w-4 h-4" />
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors min-h-[44px]"
                            >
                                Create Free Account
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
