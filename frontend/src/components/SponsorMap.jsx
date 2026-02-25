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
    Info
} from 'lucide-react'

// Fix Leaflet marker icons in Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
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
        <div className="flex flex-col h-[calc(100vh-160px)] space-y-4 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <MapIcon className="w-8 h-8 text-blue-600" /> Sponsor Density
                    </h1>
                    <p className="text-gray-600">Visualizing 140,000+ UKVI sponsors across the United Kingdom</p>
                </div>

                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Filter by city..."
                            className="pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 w-48"
                            value={filters.town}
                            onChange={(e) => setFilters({ ...filters, town: e.target.value })}
                        />
                    </div>
                    <select
                        className="px-4 py-2 bg-gray-50 border-none rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500"
                        value={filters.rating}
                        onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
                    >
                        <option value="">All Ratings</option>
                        <option value="A">Worker (A rating)</option>
                        <option value="B">Worker (B rating)</option>
                    </select>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md shadow-blue-100 hover:bg-blue-700 transition-all"
                    >
                        Refresh Map
                    </button>
                </form>
            </header>

            {/* Map Content */}
            <div className="flex-1 relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col pointer-events-auto">
                {loading && (
                    <div className="absolute inset-0 z-[1001] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                        <p className="font-outfit font-medium text-gray-600">Geospatial data loading...</p>
                    </div>
                )}

                <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg">
                            <LocateFixed className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sponsors Found</p>
                            <p className="text-lg font-black text-gray-900 leading-none">{stats.total.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

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
                                        <div className="p-1 space-y-2">
                                            <div className="flex items-start gap-2">
                                                <Building2 className="w-4 h-4 text-blue-500 mt-1" />
                                                <div>
                                                    <h3 className="font-bold text-gray-900 leading-tight">{company.name}</h3>
                                                    <p className="text-xs text-gray-500">{company.town}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${company.rating === 'A' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                    Rating: {company.rating}
                                                </span>
                                                <a
                                                    href={`https://www.google.com/search?q=${encodeURIComponent(company.name + ' ' + company.town)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                                                >
                                                    <Navigation className="w-2.5 h-2.5" /> Details
                                                </a>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MarkerClusterGroup>
                    </MapContainer>
                </div>

                {/* Legend */}
                <div className="bg-gray-50 border-t border-gray-100 p-3 flex items-center gap-6 overflow-x-auto no-scrollbar relative z-10">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-xs font-medium text-gray-600">Sponsor Cluster</span>
                    </div>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <Star className="w-3 h-3 text-green-500 fill-green-500" />
                        <span className="text-xs font-medium text-gray-600">A-Rated</span>
                    </div>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <Info className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400 italic">Showing top 5,000 matches for map stability</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SponsorMap
