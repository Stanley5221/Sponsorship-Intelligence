import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import {
    Plus, Briefcase, Calendar, FileText, Clock,
    AlertCircle, Building2, Brain, ChevronRight,
    Bell, CheckCircle2, Search, ArrowUpRight
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import StatusBadge from './StatusBadge'
import Modal from './Modal'
import ApplicationForm from './ApplicationForm'

function Applications() {
    const navigate = useNavigate()
    const [applications, setApplications] = useState([])
    const [followups, setFollowups] = useState([])
    const [loading, setLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const fetchData = async () => {
        setLoading(true)
        try {
            const [appsRes, followRes] = await Promise.all([
                api.get('/applications'),
                api.get('/applications/followups/upcoming')
            ])
            setApplications(appsRes.data)
            setFollowups(followRes.data)
        } catch (err) {
            toast.error('Failed to sync tracker data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const filteredApps = applications.filter(app =>
        app.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.role.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <header className="space-y-1">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Active Tracker</h1>
                    <p className="text-gray-500 font-medium">Manage your {applications.length} active sponsorship applications</p>
                </header>
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search applications..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-gray-900/10 hover:shadow-gray-900/20 hover:-translate-y-0.5 transition-all active:scale-95 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        ADD APPLICATION
                    </button>
                </div>
            </div>

            {/* Upcoming Follow-ups Section */}
            {followups.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Bell className="w-4 h-4 text-rose-500 animate-bounce" />
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Prioritized Follow-ups</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {followups.map(app => (
                            <Link
                                key={`followup-${app.id}`}
                                to={`/applications/${app.id}`}
                                className="group relative bg-white p-5 rounded-3xl border border-rose-100 shadow-sm shadow-rose-50 hover:shadow-md hover:border-rose-200 transition-all overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-3">
                                    <div className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-full uppercase tracking-wider">
                                        ACTION REQUIRED
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="bg-rose-50 p-2.5 rounded-2xl text-rose-600">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 pr-12">
                                        <h4 className="font-black text-gray-900 leading-tight truncate">{app.company.name}</h4>
                                        <p className="text-xs text-rose-600 font-bold flex items-center gap-1 mt-1">
                                            <Calendar className="w-3 h-3" />
                                            Due {new Date(app.followUpDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Application Grid */}
            <section className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">All Applications</h2>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white h-48 rounded-[2rem] border border-gray-100 animate-pulse" />
                        ))}
                    </div>
                ) : filteredApps.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredApps.map((app) => (
                            <div
                                key={app.id}
                                className="group bg-white rounded-[2rem] border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-200/50 hover:border-blue-100/50 transition-all relative overflow-hidden flex flex-col h-full"
                            >
                                <div className="flex items-start justify-between gap-4 mb-6">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                                            <Building2 className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-gray-900 text-lg leading-tight truncate">
                                                {app.company.name}
                                            </h3>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                                                {app.company.town}
                                            </p>
                                        </div>
                                    </div>
                                    <StatusBadge status={app.status} />
                                </div>

                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="bg-gray-50 p-1.5 rounded-lg text-gray-400">
                                            <Briefcase className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-gray-700 truncate">{app.role}</span>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="bg-gray-50 p-1.5 rounded-lg text-gray-400">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium text-gray-500">
                                            Applied {new Date(app.appliedDate).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {app.salary && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="bg-emerald-50 p-1.5 rounded-lg text-emerald-600">
                                                <ArrowUpRight className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold text-emerald-700">{app.salary}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                        ID: #{app.id}
                                    </span>
                                    <Link
                                        to={`/applications/${app.id}`}
                                        className="inline-flex items-center gap-1 text-xs font-black text-blue-600 hover:text-blue-700 transition-all group-hover:translate-x-1"
                                    >
                                        VIEW DETAILS
                                        <ChevronRight className="w-4 h-4 font-bold" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[2rem] border border-dashed border-gray-200 p-20 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Briefcase className="w-10 h-10 text-gray-200" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">No applications found</h3>
                        <p className="text-gray-400 font-medium max-w-xs mx-auto mb-8">
                            {searchQuery ? `No results matching "${searchQuery}"` : "Start tracking your sponsorship journey by adding your first application."}
                        </p>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-1 transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5" /> ADD NEW APPLICATION
                        </button>
                    </div>
                )}
            </section>

            {/* CRM Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Manual Entry"
            >
                <div className="mb-6 rounded-2xl overflow-hidden relative group cursor-pointer" onClick={() => navigate('/')}>
                    <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-blue-600/20 transition-all z-10" />
                    <div className="relative p-6 border border-blue-100 flex items-center justify-between">
                        <div>
                            <h4 className="font-black text-blue-700 text-sm">Searching for a sponsor?</h4>
                            <p className="text-xs text-blue-600/60 font-bold mt-0.5 uppercase tracking-widest">Use the Intelligence Database</p>
                        </div>
                        <Search className="w-5 h-5 text-blue-500" />
                    </div>
                </div>
                <ApplicationForm
                    isExternalCreation={true}
                    onSuccess={() => {
                        setIsAddModalOpen(false);
                        fetchData();
                    }}
                    onCancel={() => setIsAddModalOpen(false)}
                />
            </Modal>
        </div>
    )
}

export default Applications
