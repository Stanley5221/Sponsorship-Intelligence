import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend,
    CategoryScale, LinearScale, BarElement, PointElement,
    LineElement, Title, Filler,
} from 'chart.js'
import { Pie, Bar, Line } from 'react-chartjs-2'
import {
    TrendingUp, Users, CheckCircle2, BarChart3, MapPin,
    Loader2, Calendar, AlertCircle, Bell
} from 'lucide-react'

ChartJS.register(
    ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
    BarElement, PointElement, LineElement, Title, Filler
)

const CHART_OPTIONS_BASE = {
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { family: 'Outfit', size: 11 } },
            grid: { color: '#f3f4f6' },
        },
        x: {
            ticks: { font: { family: 'Outfit', size: 11 } },
            grid: { display: false },
        }
    }
}

function Dashboard() {
    const [applications, setApplications] = useState([])
    const [followups, setFollowups] = useState([])
    const [loading, setLoading] = useState(true)
    const [lastImport, setLastImport] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [appRes, followRes, importRes] = await Promise.all([
                    api.get('/applications'),
                    api.get('/applications/followups/upcoming'),
                    api.get('/stats/last-import')
                ])
                setApplications(appRes.data)
                setFollowups(followRes.data)
                setLastImport(importRes.data)
            } catch (err) {
                console.error('Dashboard fetch error:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const metrics = useMemo(() => {
        const total = applications.length
        if (total === 0) return { total: 0, interviewRate: 0, offerRate: 0, pendingFollowups: 0 }

        const interviewed = applications.filter(a => ['INTERVIEW', 'OFFER', 'REJECTED'].includes(a.status)).length
        const offered = applications.filter(a => a.status === 'OFFER').length

        return {
            total,
            interviewRate: Math.round((interviewed / total) * 100),
            offerRate: Math.round((offered / total) * 100),
            pendingFollowups: followups.length
        }
    }, [applications, followups])

    const statusData = useMemo(() => {
        const counts = { APPLIED: 0, INTERVIEW: 0, OFFER: 0, REJECTED: 0, NO_RESPONSE: 0, WITHDRAWN: 0 }
        applications.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1 })

        return {
            labels: ['Applied', 'Interview', 'Offer', 'Rejected', 'No Response', 'Withdrawn'],
            datasets: [{
                data: [counts.APPLIED, counts.INTERVIEW, counts.OFFER, counts.REJECTED, counts.NO_RESPONSE, counts.WITHDRAWN],
                backgroundColor: ['#3b82f6', '#a855f7', '#22c55e', '#ef4444', '#94a3b8', '#c084fc'],
                borderWidth: 0
            }]
        }
    }, [applications])

    const timeData = useMemo(() => {
        const timeline = {}
        applications
            .sort((a, b) => new Date(a.appliedDate) - new Date(b.appliedDate))
            .forEach(a => {
                const d = new Date(a.appliedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                timeline[d] = (timeline[d] || 0) + 1
            })
        return {
            labels: Object.keys(timeline),
            datasets: [{
                label: 'Applied',
                data: Object.values(timeline),
                borderColor: '#3b82f6',
                backgroundColor: '#3b82f615',
                fill: true, tension: 0.4, pointRadius: 4,
                pointBackgroundColor: '#3b82f6',
            }]
        }
    }, [applications])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-gray-400 font-medium text-sm">Loading your analytics...</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
            {/* Header */}
            <header className="space-y-1">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Performance Analytics</h1>
                <p className="text-gray-500 font-medium">Real-time insights across your sponsorship hunt</p>
            </header>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={<Users className="w-5 h-5 text-blue-600" />}
                    label="Active Tracks"
                    value={metrics.total}
                    subValue="Total Applications"
                    color="blue"
                />
                <MetricCard
                    icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
                    label="Funnel Depth"
                    value={`${metrics.interviewRate}%`}
                    subValue="Advancement Rate"
                    color="purple"
                />
                <MetricCard
                    icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    label="Offer Rate"
                    value={`${metrics.offerRate}%`}
                    subValue="Success conversion"
                    color="emerald"
                />
                <MetricCard
                    icon={<Bell className={`w-5 h-5 ${metrics.pendingFollowups > 0 ? 'text-rose-600 animate-pulse' : 'text-gray-400'}`} />}
                    label="Due Actions"
                    value={metrics.pendingFollowups}
                    subValue="Pending follow-ups"
                    color={metrics.pendingFollowups > 0 ? 'rose' : 'gray'}
                />
            </div>

            {applications.length === 0 ? (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-16 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6">
                        <BarChart3 className="w-10 h-10 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 mb-2">No data to visualize yet</h2>
                    <p className="text-gray-400 font-medium max-w-xs mb-8">
                        Once you start tracking applications, your status distribution and timeline will appear here.
                    </p>
                    <Link
                        to="/"
                        className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-gray-900/10 hover:shadow-gray-900/20 hover:-translate-y-1 transition-all active:scale-95"
                    >
                        START DISCOVERY
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Status Pie */}
                    <div className="lg:col-span-2">
                        <ChartCard title="Pipeline Status" icon={<BarChart3 className="w-4 h-4 text-blue-500" />}>
                            <div className="h-64 sm:h-72 mt-4">
                                <Pie
                                    data={statusData}
                                    options={{
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'bottom',
                                                labels: {
                                                    font: { family: 'Outfit', size: 10, weight: 'bold' },
                                                    padding: 20,
                                                    usePointStyle: true
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </ChartCard>
                    </div>

                    {/* Timeline */}
                    <div className="lg:col-span-3">
                        <ChartCard title="Velocity over Time" icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}>
                            <div className="h-64 sm:h-72 mt-4">
                                <Line data={timeData} options={CHART_OPTIONS_BASE} />
                            </div>
                        </ChartCard>
                    </div>
                </div>
            )}

            {/* Footer Status */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-8 border-t border-gray-100 opacity-50">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${lastImport ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        {lastImport
                            ? `Last Database Sync: ${new Date(lastImport.createdAt).toLocaleDateString()}`
                            : 'Database waiting for initial sync'
                        }
                    </span>
                </div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                    Enterprise CRM v2.0 • Secured by Antigravity
                </p>
            </div>
        </div>
    )
}

function MetricCard({ icon, label, value, subValue, color }) {
    const bgMap = {
        blue: 'bg-blue-50',
        purple: 'bg-purple-50',
        emerald: 'bg-emerald-50',
        amber: 'bg-amber-50',
        rose: 'bg-rose-50',
        gray: 'bg-gray-50'
    }
    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300 group">
            <div className={`${bgMap[color]} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-black text-gray-900 truncate">{value}</p>
            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">{subValue}</p>
        </div>
    )
}

function ChartCard({ title, icon, children, className = '' }) {
    return (
        <div className={`bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 h-full ${className}`}>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-xl">{icon}</div>
                {title}
            </h3>
            {children}
        </div>
    )
}

export default Dashboard
