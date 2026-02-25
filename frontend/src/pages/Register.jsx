import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { UserPlus, Mail, Lock } from 'lucide-react';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) return toast.error('Passwords do not match');

        setLoading(true);
        try {
            await api.post('/auth/register', { email, password });
            toast.success('Registration successful! Please sign in.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-blue-200 mx-auto mb-4">
                    S
                </div>
                <h1 className="text-2xl font-black text-gray-900">Create Account</h1>
                <p className="text-gray-500 text-sm">Join the Sponsorship Intelligence Platform</p>
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

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Confirm Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="confirmPassword"
                            required
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                >
                    {loading ? 'Creating account...' : <><UserPlus className="w-5 h-5" /> Sign Up</>}
                </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 font-bold hover:underline">
                    Sign in here
                </Link>
            </p>
        </div>
    );
}
