import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { LogIn, Mail, Lock } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            login(response.data.token, response.data.user);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-xl border border-gray-100 animate-in fade-in zoom-in duration-500">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-blue-200 mx-auto mb-4">
                    S
                </div>
                <h1 className="text-2xl font-black text-gray-900">Welcome Back</h1>
                <p className="text-gray-500 text-sm">Sign in to manage your sponsorship tracker</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="email"
                            required
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="password"
                            required
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                >
                    {loading ? 'Signing in...' : <><LogIn className="w-5 h-5" /> Sign In</>}
                </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 font-bold hover:underline">
                    Create one here
                </Link>
            </p>
        </div>
    );
}
