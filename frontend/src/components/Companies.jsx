import { useState, useEffect } from 'react'
import api from '../services/api'
import { Search, MapPin, Award, ChevronLeft, ChevronRight, Loader2, Building2, Route } from 'lucide-react'

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded-full w-48" /></td>
            <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded-full w-24" /></td>
            <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded-full w-32" /></td>
            <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded-full w-8 mx-auto" /></td>
        </tr>
    )
}

function SkeletonCard() {
    return (
        <div className="animate-pulse bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <div className="h-4 bg-gray-100 rounded-full w-3/4" />
            <div className="h-3 bg-gray-100 rounded-full w-1/2" />
            <div className="flex gap-2 mt-4">
                <div className="h-6 bg-gray-100 rounded-full w-16" />
                <div className="h-6 bg-gray-100 rounded-full w-20" />
            </div>
        </div>
    )
}

function Companies() {
    const [companies, setCompanies] = useState([])
    const [pagination, setPagination] = useState({ page: 1, totalPages: 0, total: 0 })
    const [loading, setLoading] = useState(true)
    const [town, setTown] = useState('')
    const [rating, setRating] = useState('')

    const fetchCompanies = async (page = 1) => {
        setLoading(true)
        try {
            const response = await api.get('/companies', {
                params: { page, limit: 12, town, rating }
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
        <div className="space-y-6 animate-in">
            {/* Page Header */}
            <header className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                    Sponsorship Intelligence
                </h1>
                <p className="text-sm sm:text-base text-gray-500">
                    Search all UKVI licensed sponsors across the UK
                </p>
            </header>

            {/* Filters */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Filter by city (e.g. London)..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder:text-gray-400 min-h-[44px]"
                            value={town}
                            onChange={(e) => setTown(e.target.value)}
                        />
                    </div>
                    <div className="relative sm:w-44">
                        <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                        <select
                            className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer min-h-[44px]"
                            value={rating}
                            onChange={(e) => setRating(e.target.value)}
                        >
                            <option value="">All Ratings</option>
                            <option value="A">A Rating</option>
                            <option value="B">B Rating</option>
                        </select>
                    </div>
                </div>
                {pagination.total > 0 && (
                    <p className="text-xs text-gray-400 mt-3">
                        Showing {companies.length} of {pagination.total?.toLocaleString()} results
                    </p>
                )}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/80 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Organisation</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Route</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Rating</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading
                                ? Array(8).fill(0).map((_, i) => <SkeletonRow key={i} />)
                                : companies.length > 0
                                    ? companies.map((company) => (
                                        <tr key={company.id} className="hover:bg-blue-50/40 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">
                                                    {company.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-3 h-3 text-gray-300 flex-shrink-0" />
                                                    {company.town}{company.county ? `, ${company.county}` : ''}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400">{company.route}</td>
                                            <td className="px-4 py-4 text-center">
                                                <RatingBadge rating={company.rating} />
                                            </td>
                                        </tr>
                                    ))
                                    : (
                                        <tr>
                                            <td colSpan="4">
                                                <EmptyState />
                                            </td>
                                        </tr>
                                    )
                            }
                        </tbody>
                    </table>
                </div>
                <Pagination pagination={pagination} loading={loading} onPage={fetchCompanies} />
            </div>

            {/* Mobile Card Layout */}
            <div className="sm:hidden space-y-3">
                {loading
                    ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
                    : companies.length > 0
                        ? companies.map((company) => (
                            <div key={company.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 text-sm leading-tight truncate">
                                            {company.name}
                                        </p>
                                        {(company.town || company.county) && (
                                            <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                                <span className="truncate">{company.town}{company.county ? `, ${company.county}` : ''}</span>
                                            </div>
                                        )}
                                    </div>
                                    <RatingBadge rating={company.rating} />
                                </div>
                                {company.route && (
                                    <div className="mt-3 pt-3 border-t border-gray-50">
                                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                                            <Building2 className="w-3 h-3" />
                                            {company.route}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))
                        : <EmptyState mobile />
                }
                {!loading && companies.length > 0 && (
                    <Pagination pagination={pagination} loading={loading} onPage={fetchCompanies} mobile />
                )}
            </div>
        </div>
    )
}

function RatingBadge({ rating }) {
    return (
        <span className={`inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold rounded-full ${rating === 'A'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
            {rating}
        </span>
    )
}

function EmptyState({ mobile }) {
    return (
        <div className={`flex flex-col items-center justify-center py-16 text-center ${mobile ? '' : 'px-6'}`}>
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-900 font-bold text-sm">No sponsors found</p>
            <p className="text-gray-400 text-xs mt-1">Try adjusting your filters</p>
        </div>
    )
}

function Pagination({ pagination, loading, onPage, mobile }) {
    const { page, totalPages } = pagination
    return (
        <div className={`${mobile ? 'flex' : 'flex px-6'} items-center justify-between py-4 border-t border-gray-50`}>
            <p className="text-xs text-gray-400">
                Page <span className="font-bold text-gray-700">{page}</span> of <span className="font-bold text-gray-700">{totalPages}</span>
            </p>
            <div className="flex gap-2">
                <button
                    disabled={page <= 1 || loading}
                    onClick={() => onPage(page - 1)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-white hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[36px]"
                >
                    <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button
                    disabled={page >= totalPages || loading}
                    onClick={() => onPage(page + 1)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[36px] shadow-sm shadow-blue-200"
                >
                    Next <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

export default Companies
