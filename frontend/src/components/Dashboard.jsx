import { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Filler,
} from 'chart.js'
import { Pie, Bar, Line } from 'react-chartjs-2'
import {
    TrendingUp,
    Users,
    CheckCircle2,
    BarChart3,
    MapPin,
    Loader2,
    Calendar
} from 'lucide-react'

// Register ChartJS components
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Filler
)

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
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    // Calculate Metrics
    const metrics = useMemo(() => {
        const total = applications.length
        if (total === 0) return { total: 0, interviewRate: 0, offerRate: 0, topRegion: 'N/A' }

        const interviewed = applications.filter(app => ['Interviewing', 'Offer', 'Rejected'].includes(app.status)).length // Simplified: anyone who progressed past Applied
        const offered = applications.filter(app => app.status === 'Offer').length

        // Region success (offers per region)
        const regions = {}
        applications.forEach(app => {
            const town = app.company.town || 'Unknown'
            if (!regions[town]) regions[town] = { count: 0, offers: 0 }
            regions[town].count++
            if (app.status === 'Offer') regions[town].offers++
        })

        const topRegion = Object.entries(regions).sort((a, b) => b[1].offers - a[1].offers)[0]?.[0] || 'N/A'

        return {
            total,
            interviewRate: Math.round((interviewed / total) * 100),
            offerRate: Math.round((offered / total) * 100),
            topRegion
        }
    }, [applications])

    // Chart Data: Status Distribution
    const statusData = useMemo(() => {
        const counts = { Applied: 0, Interviewing: 0, Offer: 0, Rejected: 0 }
        applications.forEach(app => counts[app.status] = (counts[app.status] || 0) + 1)

        return {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                backgroundColor: ['#3b82f6', '#a855f7', '#22c55e', '#ef4444'],
                borderWidth: 0,
            }]
        }
    }, [applications])

    // Chart Data: Applications per Region
    const regionData = useMemo(() => {
        const regions = {}
        applications.forEach(app => {
            const town = app.company.town || 'Unknown'
            regions[town] = (regions[town] || 0) + 1
        })

        const sorted = Object.entries(regions).sort((a, b) => b[1] - a[1]).slice(0, 5)

        return {
            labels: sorted.map(s => s[0]),
            datasets: [{
                label: 'Applications',
                data: sorted.map(s => s[1]),
                backgroundColor: '#3b82f6cc',
                borderRadius: 8,
            }]
        }
    }, [applications])

    // Chart Data: Applications over Time
    const timeData = useMemo(() => {
        const timeline = {}
        applications
            .sort((a, b) => new Date(a.dateApplied) - new Date(b.dateApplied))
            .forEach(app => {
                const date = new Date(app.dateApplied).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                timeline[date] = (timeline[date] || 0) + 1
            })

        return {
            labels: Object.keys(timeline),
            datasets: [{
                label: 'Applied',
                data: Object.values(timeline),
                borderColor: '#3b82f6',
                backgroundColor: '#3b82f622',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
            }]
        }
    }, [applications])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-gray-500 font-medium font-outfit">Loading your analytics...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Impact Dashboard</h1>
                <p className="text-gray-600">Overview of your sponsorship application progress</p>
            </header>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={<Users className="w-6 h-6 text-blue-600" />}
                    label="Total Applications"
                    value={metrics.total}
                    subValue="Active pursuits"
                />
                <MetricCard
                    icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
                    label="Progression Rate"
                    value={`${metrics.interviewRate}%`}
                    subValue="Past 'Applied' stage"
                />
                <MetricCard
                    icon={<CheckCircle2 className="w-6 h-6 text-green-600" />}
                    label="Offer Rate"
                    value={`${metrics.offerRate}%`}
                    subValue="Conversion success"
                />
                <MetricCard
                    icon={<MapPin className="w-6 h-6 text-amber-600" />}
                    label="Top Region"
                    value={metrics.topRegion}
                    subValue="Highest offer density"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Status Chart */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-500" /> Status distribution
                    </h3>
                    <div className="flex-1 flex items-center justify-center min-h-[250px]">
                        <Pie data={statusData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>

                {/* Region Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-500" /> Applications by City
                    </h3>
                    <div className="h-[250px]">
                        <Bar data={regionData} options={{
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                        }} />
                    </div>
                </div>

                {/* Timeline Chart */}
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" /> Application Timeline
                    </h3>
                    <div className="h-[300px]">
                        <Line data={timeData} options={{
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                        }} />
                    </div>
                </div>
            </div>

            {/* Dashboard Footer */}
            <footer className="mt-8 pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${lastImport ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`}></div>
                    <p>
                        {lastImport
                            ? `Last CSV Update: ${new Date(lastImport.createdAt).toLocaleString()} (${lastImport.count} new companies)`
                            : "No recent CSV updates recorded"
                        }
                    </p>
                </div>
                <div className="flex items-center gap-1 opacity-60">
                    <TrendingUp className="w-4 h-4" />
                    <p>Sponsorship Intelligence Platform v1.2</p>
                </div>
            </footer>
        </div>
    )
}

function MetricCard({ icon, label, value, subValue }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
                <div className="bg-gray-50 p-3 rounded-xl">{icon}</div>
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-2xl font-black text-gray-900">{value}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{subValue}</p>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
