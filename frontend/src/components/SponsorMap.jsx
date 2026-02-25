import { useState, useEffect } from 'react'
import api from '../services/api'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import {
    Map as MapIcon,
    Search,
    LocateFixed,
    Building2,
    Star,
    Navigation,
    Loader2,
    Info,
    ChevronRight,
    SearchX
} from 'lucide-react'

// Fix Leaflet marker icons in Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36]
})
L.Marker.prototype.options.icon = DefaultIcon

// Custom hook to handle map centering/zooming
function MapRefresher({ center, zoom }) {
    const map = useMap()
    useEffect(() => {
        if (center) map.setView(center, zoom || 6)
    }, [center, zoom, map])
    return null
}

function SponsorMap() {
    const [companies, setCompanies] = useState([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({ town: '', rating: '' })
    const [stats, setStats] = useState({ total: 0, clusters: 0 })

    const fetchMapData = async () => {
        setLoading(true)
        try {
            const response = await api.get('/companies/map', {
                params: { town: filters.town, rating: filters.rating }
            })
            setCompanies(response.data)
            setStats({ total: response.data.length, clusters: Math.ceil(response.data.length / 100) })
        } catch (error) {
            console.error('Error fetching map data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMapData()
    }, [])

    const handleSearch = (e) => {
        e.preventDefault()
        fetchMapData()
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] space-y-4 animate-in">
            {/* Page Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2.5">
                        <MapIcon className="w-8 h-8 text-blue-600" /> Geospatial Intel
                    </h1>
                    <p className="text-sm sm:text-base text-gray-400">Visualizing UKVI licensed sponsors across the United Kingdom</p>
                </div>

                <form onSubmit={handleSearch} className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-full md:w-auto overflow-hidden">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Filter by city..."
                            className="w-full md:w-44 pl-9 pr-3 py-2 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-gray-400 min-h-[40px]"
                            value={filters.town}
                            onChange={(e) => setFilters({ ...filters, town: e.target.value })}
                        />
                    </div>
                    <select
                        className="hidden sm:block px-3 py-2 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer min-h-[40px]"
                        value={filters.rating}
                        onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
                    >
                        <option value="">All Ratings</option>
                        <option value="A">Worker (A)</option>
                        <option value="B">Worker (B)</option>
                    </select>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all min-h-[40px] flex-shrink-0"
                    >
                        Refresh
                    </button>
                </form>
            </header>

            {/* Map Container */}
            <div className="flex-1 relative bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden flex flex-col">

                {/* Overlay Loader */}
                {loading && (
                    <div className="absolute inset-0 z-[1001] bg-white/60 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                        <div className="bg-white p-6 rounded-3xl shadow-2xl shadow-blue-200/50 flex flex-col items-center gap-3 border border-blue-50">
                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                            <p className="font-bold text-gray-900 text-sm">Mapping Data...</p>
                        </div>
                    </div>
                )}

                {/* Floating Stats Badge */}
                <div className="absolute top-4 right-4 z-[1000] animate-in">
                    <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl shadow-black/5 border border-white flex items-center gap-3.5 group transition-all hover:pr-5">
                        <div className="bg-blue-500 p-2.5 rounded-xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                            <LocateFixed className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Sponsors</p>
                            <p className="text-xl font-black text-gray-900 leading-none">{stats.total.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Map View */}
                <div className="flex-1 min-h-0 relative z-0">
                    <MapContainer
                        center={[54.5, -3.5]}
                        zoom={6}
                        className="h-full w-full"
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <MarkerClusterGroup
                            chunkedLoading
                            maxClusterRadius={60}
                            spiderfyOnMaxZoom={true}
                            showCoverageOnHover={false}
                        >
                            {companies.map((company) => (
                                <Marker
                                    key={company.id}
                                    position={[company.latitude, company.longitude]}
                                >
                                    <Popup className="custom-popup">
                                        <div className="w-[180px] p-0.5 space-y-3 font-outfit">
                                            <div className="flex items-start gap-2.5">
                                                <div className="bg-blue-50 p-2 rounded-lg flex-shrink-0">
                                                    <Building2 className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-black text-gray-900 leading-[1.2] text-sm break-words">
                                                        {company.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-400 mt-0.5 truncate">{company.town}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-gray-100">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm ${company.rating === 'A'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    RATING: {company.rating}
                                                </span>
                                                <a
                                                    href={`https://www.google.com/search?q=${encodeURIComponent(company.name + ' ' + company.town)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 hover:text-blue-700"
                                                >
                                                    DETAILS <ChevronRight className="w-2.5 h-2.5" />
                                                </a>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MarkerClusterGroup>
                    </MapContainer>
                </div>

                {/* Legend / Info Bar */}
                <div className="bg-white/80 backdrop-blur-sm border-t border-gray-100 px-5 py-3.5 flex items-center justify-between gap-6 overflow-x-auto no-scrollbar relative z-10 transition-all">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div>
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Sponsor Cluster</span>
                        </div>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">A-Rated (Confirmed)</span>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg">
                        <Info className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[10px] font-medium text-gray-400 italic">Showing top 5,000 matches for map performance</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SponsorMap
