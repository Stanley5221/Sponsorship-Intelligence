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
    Loader2, Calendar, AlertCircle
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
    const [loading, setLoading] = useState(true)
    const [lastImport, setLastImport] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [appRes, importRes] = await Promise.all([
                    api.get('/applications'),
                    api.get('/stats/last-import')
                ])
                setApplications(appRes.data)
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
        if (total === 0) return { total: 0, interviewRate: 0, offerRate: 0, topRegion: '—' }
        const interviewed = applications.filter(a => ['Interviewing', 'Offer', 'Rejected'].includes(a.status)).length
        const offered = applications.filter(a => a.status === 'Offer').length
        const regions = {}
        applications.forEach(a => {
            const t = a.company.town || 'Unknown'
            if (!regions[t]) regions[t] = { offers: 0 }
            if (a.status === 'Offer') regions[t].offers++
        })
        const topRegion = Object.entries(regions).sort((a, b) => b[1].offers - a[1].offers)[0]?.[0] || '—'
        return {
            total,
            interviewRate: Math.round((interviewed / total) * 100),
            offerRate: Math.round((offered / total) * 100),
            topRegion
        }
    }, [applications])

    const statusData = useMemo(() => {
        const counts = { Applied: 0, Interviewing: 0, Offer: 0, Rejected: 0 }
        applications.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1 })
        return {
            labels: Object.keys(counts),
            datasets: [{ data: Object.values(counts), backgroundColor: ['#3b82f6', '#a855f7', '#22c55e', '#ef4444'], borderWidth: 0 }]
        }
    }, [applications])

    const regionData = useMemo(() => {
        const regions = {}
        applications.forEach(a => {
            const t = a.company.town || 'Unknown'
            regions[t] = (regions[t] || 0) + 1
        })
        const sorted = Object.entries(regions).sort((a, b) => b[1] - a[1]).slice(0, 6)
        return {
            labels: sorted.map(s => s[0]),
            datasets: [{ label: 'Applications', data: sorted.map(s => s[1]), backgroundColor: '#3b82f6cc', borderRadius: 8 }]
        }
    }, [applications])

    const timeData = useMemo(() => {
        const timeline = {}
        applications
            .sort((a, b) => new Date(a.dateApplied) - new Date(b.dateApplied))
            .forEach(a => {
                const d = new Date(a.dateApplied).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
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
        <div className="space-y-6 animate-in">
            {/* Header */}
            <header className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Impact Dashboard</h1>
                <p className="text-sm sm:text-base text-gray-400">Your sponsorship application analytics at a glance</p>
            </header>

            {/* Empty State */}
            {applications.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                        <BarChart3 className="w-8 h-8 text-blue-400" />
                    </div>
                    <h2 className="font-bold text-gray-900 mb-1">No applications yet</h2>
                    <p className="text-sm text-gray-400 max-w-xs">
                        Start tracking your sponsorship applications to see analytics and insights here.
                    </p>
                </div>
            )}

            {/* Metric Cards — 2 cols on mobile, 4 on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <MetricCard icon={<Users className="w-5 h-5 text-blue-600" />} label="Total" value={metrics.total} subValue="Applications" color="blue" />
                <MetricCard icon={<TrendingUp className="w-5 h-5 text-purple-600" />} label="Progression" value={`${metrics.interviewRate}%`} subValue="Beyond Applied" color="purple" />
                <MetricCard icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} label="Offer Rate" value={`${metrics.offerRate}%`} subValue="Conversion" color="emerald" />
                <MetricCard icon={<MapPin className="w-5 h-5 text-amber-600" />} label="Top Region" value={metrics.topRegion} subValue="Best city" color="amber" />
            </div>

            {applications.length > 0 && (
                <>
                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Status Pie */}
                        <ChartCard title="Status Distribution" icon={<BarChart3 className="w-4 h-4 text-blue-500" />}>
                            <div className="h-52 sm:h-60">
                                <Pie
                                    data={statusData}
                                    options={{
                                        maintainAspectRatio: false,
                                        plugins: { legend: { position: 'bottom', labels: { font: { family: 'Outfit', size: 11 }, padding: 12 } } }
                                    }}
                                />
                            </div>
                        </ChartCard>

                        {/* Region Bar */}
                        <ChartCard title="By City" icon={<MapPin className="w-4 h-4 text-blue-500" />} className="lg:col-span-2">
                            <div className="h-52 sm:h-60">
                                <Bar data={regionData} options={CHART_OPTIONS_BASE} />
                            </div>
                        </ChartCard>
                    </div>

                    {/* Timeline */}
                    <ChartCard title="Application Timeline" icon={<Calendar className="w-4 h-4 text-blue-500" />}>
                        <div className="h-52 sm:h-64">
                            <Line data={timeData} options={CHART_OPTIONS_BASE} />
                        </div>
                    </ChartCard>
                </>
            )}

            {/* Footer */}
            <footer className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${lastImport ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
                    <span>
                        {lastImport
                            ? `Last CSV Update: ${new Date(lastImport.createdAt).toLocaleString()} · ${lastImport.count?.toLocaleString()} companies`
                            : 'No recent CSV updates recorded'
                        }
                    </span>
                </div>
                <div className="flex items-center gap-1 opacity-60">
                    <TrendingUp className="w-3 h-3" />
                    Sponsorship Intelligence v1.3
                </div>
            </footer>
        </div>
    )
}

function MetricCard({ icon, label, value, subValue, color }) {
    const bgMap = { blue: 'bg-blue-50', purple: 'bg-purple-50', emerald: 'bg-emerald-50', amber: 'bg-amber-50' }
    return (
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className={`${bgMap[color]} w-9 h-9 rounded-xl flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xl sm:text-2xl font-black text-gray-900 truncate">{value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{subValue}</p>
        </div>
    )
}

function ChartCard({ title, icon, children, className = '' }) {
    return (
        <div className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 ${className}`}>
            <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
                {icon}
                {title}
            </h3>
            {children}
        </div>
    )
}

export default Dashboard
