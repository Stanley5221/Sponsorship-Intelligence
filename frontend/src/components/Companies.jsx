import { useState, useEffect } from 'react'
import api from '../services/api'
import { Search, MapPin, Award, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'



function Companies() {
    const [companies, setCompanies] = useState([])
    const [pagination, setPagination] = useState({ page: 1, totalPages: 0 })
    const [loading, setLoading] = useState(true)
    const [town, setTown] = useState('')
    const [rating, setRating] = useState('')

    const fetchCompanies = async (page = 1) => {
        setLoading(true)
        try {
            const response = await api.get('/companies', {
                params: {
                    page,
                    limit: 10,
                    town,
                    rating,
                }
            })
            setCompanies(response.data.companies)
            setPagination(response.data.pagination)
        } catch (error) {
            console.error('Error fetching companies:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCompanies()
    }, [town, rating])

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Sponsorship Intelligence</h1>
                <p className="text-gray-600">Search and filter UKVI licensed sponsors</p>
            </header>

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by city (e.g. London)..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:text-gray-400"
                        value={town}
                        onChange={(e) => setTown(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                        className="pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                    >
                        <option value="">All Ratings</option>
                        <option value="A">A Rating</option>
                        <option value="B">B Rating</option>
                    </select>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Organisation</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Route</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Rating</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded w-48"></div></td>
                                        <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                        <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                                        <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded w-8 mx-auto"></div></td>
                                    </tr>
                                ))
                            ) : companies.length > 0 ? (
                                companies.map((company) => (
                                    <tr key={company.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{company.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3 opacity-40" />
                                                {company.town}{company.county ? `, ${company.county}` : ''}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{company.route}</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold rounded-full ${company.rating === 'A' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                {company.rating}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                        No companies found matching those filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Improved Pagination */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Page <span className="font-medium text-gray-900">{pagination.page}</span> of <span className="font-medium text-gray-900">{pagination.totalPages}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            disabled={pagination.page <= 1 || loading}
                            onClick={() => fetchCompanies(pagination.page - 1)}
                            className="p-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-white hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                            title="Previous Page"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            disabled={pagination.page >= pagination.totalPages || loading}
                            onClick={() => fetchCompanies(pagination.page + 1)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-100"
                            title="Next Page"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Companies
