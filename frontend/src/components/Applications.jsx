import { useState, useEffect } from 'react'
import api from '../services/api'
import { Plus, Trash2, Edit2, Check, X, Calendar, Briefcase, FileText, Clock, AlertCircle, Building2, Brain, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'react-hot-toast'

const statusStyles = {
    Applied: 'bg-blue-100 text-blue-700',
    Interviewing: 'bg-purple-100 text-purple-700',
    Offer: 'bg-emerald-100 text-emerald-700',
    Rejected: 'bg-red-100 text-red-700',
}

function StatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-600'}`}>
            {status}
        </span>
    )
}

function FormField({ label, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</label>
            {children}
        </div>
    )
}

const inputCls = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all min-h-[44px]"
const iconInputCls = "w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all min-h-[44px]"

function Applications() {
    const [applications, setApplications] = useState([])
    const [companies, setCompanies] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState(null)
    const [predictions, setPredictions] = useState({})
    const [formOpen, setFormOpen] = useState(false)

    const [formData, setFormData] = useState({
        companyId: '', jobRole: '',
        dateApplied: new Date().toISOString().split('T')[0],
        status: 'Applied', followUpDate: '', notes: '', cvVersion: ''
    })

    const [editData, setEditData] = useState({ status: '', notes: '', jobRole: '', cvVersion: '' })

    const fetchApplications = async () => {
        try {
            const res = await api.get('/applications')
            setApplications(res.data)
        } catch {
            toast.error('Failed to load applications')
        } finally {
            setLoading(false)
        }
    }

    const fetchCompanies = async (searchStr = '') => {
        try {
            const res = await api.get('/companies', { params: { limit: 50, town: searchStr } })
            setCompanies(res.data.companies)
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        fetchApplications()
        fetchCompanies()
    }, [])

    const handlePredict = async (appId, companyId) => {
        const t = toast.loading('Calculating outcomes...')
        try {
            const res = await api.get(`/predict/${companyId}`)
            setPredictions(prev => ({ ...prev, [appId]: res.data }))
            toast.success('Strategy calculated', { id: t })
        } catch {
            toast.error('Prediction engine unreachable', { id: t })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.companyId) return toast.error('Please select a company')
        const t = toast.loading('Adding application...')
        try {
            await api.post('/applications', { ...formData, companyId: parseInt(formData.companyId) })
            toast.success('Application added!', { id: t })
            setFormData({ companyId: '', jobRole: '', dateApplied: new Date().toISOString().split('T')[0], status: 'Applied', followUpDate: '', notes: '', cvVersion: '' })
            setFormOpen(false)
            fetchApplications()
        } catch {
            toast.error('Failed to add application', { id: t })
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this application?')) return
        try {
            await api.delete(`/applications/${id}`)
            toast.success('Application deleted')
            setApplications(applications.filter(a => a.id !== id))
        } catch {
            toast.error('Failed to delete')
        }
    }

    const startEditing = (app) => {
        setEditingId(app.id)
        setEditData({ status: app.status, notes: app.notes || '', jobRole: app.jobRole, cvVersion: app.cvVersion || '' })
    }

    const handleUpdate = async (id) => {
        try {
            await api.put(`/applications/${id}`, editData)
            toast.success('Application updated')
            setEditingId(null)
            fetchApplications()
        } catch {
            toast.error('Update failed')
        }
    }

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <header>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900">My Tracker</h1>
                    <p className="text-sm text-gray-400 mt-1">Manage and track your sponsorship applications</p>
                </header>
                <button
                    onClick={() => setFormOpen(!formOpen)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-blue-200 flex-shrink-0 min-h-[44px]"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Application</span>
                    <span className="sm:hidden">Add</span>
                    {formOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
            </div>

            {/* Collapsible Add Form */}
            {formOpen && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 animate-in">
                    <h2 className="text-base font-bold text-gray-800 mb-5">New Application</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <FormField label="Company">
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <select
                                        className={`${iconInputCls} appearance-none`}
                                        value={formData.companyId}
                                        onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Company</option>
                                        {companies.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} — {c.town}</option>
                                        ))}
                                    </select>
                                </div>
                            </FormField>

                            <FormField label="Job Role">
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        className={iconInputCls}
                                        placeholder="Software Engineer..."
                                        value={formData.jobRole}
                                        onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                                        required
                                    />
                                </div>
                            </FormField>

                            <FormField label="Date Applied">
                                <input
                                    type="date"
                                    className={inputCls}
                                    value={formData.dateApplied}
                                    onChange={(e) => setFormData({ ...formData, dateApplied: e.target.value })}
                                    required
                                />
                            </FormField>

                            <FormField label="Status">
                                <select
                                    className={`${inputCls} appearance-none`}
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option>Applied</option>
                                    <option>Interviewing</option>
                                    <option>Offer</option>
                                    <option>Rejected</option>
                                </select>
                            </FormField>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <FormField label="Notes (optional)">
                                <input
                                    type="text"
                                    className={inputCls}
                                    placeholder="Cover letter sent, found on LinkedIn..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </FormField>
                            <FormField label="CV Version">
                                <input
                                    type="text"
                                    className={inputCls}
                                    placeholder="Fullstack_2024.pdf"
                                    value={formData.cvVersion}
                                    onChange={(e) => setFormData({ ...formData, cvVersion: e.target.value })}
                                />
                            </FormField>
                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-blue-200 flex items-center justify-center gap-2 min-h-[44px]"
                                >
                                    <Plus className="w-4 h-4" />
                                    Save Application
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Application List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Clock className="w-8 h-8 text-blue-400 animate-spin" />
                    </div>
                ) : applications.length > 0 ? (
                    applications.map((app) => (
                        <div
                            key={app.id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all"
                        >
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight truncate">
                                        {app.company.name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-1">
                                        <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="truncate">
                                            {editingId === app.id ? (
                                                <input
                                                    type="text"
                                                    className="border border-gray-200 rounded-lg px-2 py-0.5 text-sm focus:ring-1 focus:ring-blue-300 outline-none"
                                                    value={editData.jobRole}
                                                    onChange={(e) => setEditData({ ...editData, jobRole: e.target.value })}
                                                />
                                            ) : app.jobRole}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                    {editingId === app.id ? (
                                        <select
                                            className="text-xs font-bold px-3 py-1.5 border border-gray-200 rounded-xl min-h-[36px]"
                                            value={editData.status}
                                            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                        >
                                            <option>Applied</option>
                                            <option>Interviewing</option>
                                            <option>Offer</option>
                                            <option>Rejected</option>
                                        </select>
                                    ) : (
                                        <StatusBadge status={app.status} />
                                    )}
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(app.dateApplied).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                <div>
                                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest block mb-1">Notes</span>
                                    {editingId === app.id ? (
                                        <textarea
                                            className="w-full p-2 text-sm bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-blue-300 transition-all resize-none"
                                            rows="2"
                                            value={editData.notes}
                                            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                                        />
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">{app.notes || 'No notes'}</p>
                                    )}
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest block mb-1">CV Version</span>
                                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                        <FileText className="w-3.5 h-3.5 text-gray-300" />
                                        {editingId === app.id ? (
                                            <input
                                                type="text"
                                                className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-blue-300 outline-none flex-1"
                                                value={editData.cvVersion}
                                                onChange={(e) => setEditData({ ...editData, cvVersion: e.target.value })}
                                            />
                                        ) : (app.cvVersion || 'Not specified')}
                                    </div>
                                </div>
                            </div>

                            {/* Predictions */}
                            {predictions[app.id] && (
                                <div className="grid grid-cols-2 gap-3 mt-4 animate-in">
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">Interview</span>
                                        <span className="text-xl font-black text-blue-700">{(predictions[app.id].interviewProbability * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Offer</span>
                                        <span className="text-xl font-black text-emerald-700">{(predictions[app.id].offerProbability * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            )}

                            {/* Card Actions */}
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                                {editingId === app.id ? (
                                    <>
                                        <button
                                            onClick={() => handleUpdate(app.id)}
                                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors min-h-[36px]"
                                        >
                                            <Check className="w-4 h-4" /> Save
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-gray-50 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors min-h-[36px]"
                                        >
                                            <X className="w-4 h-4" /> Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {!predictions[app.id] && (
                                            <button
                                                onClick={() => handlePredict(app.id, app.companyId)}
                                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 border border-gray-100 rounded-xl transition-all min-h-[36px]"
                                            >
                                                <Brain className="w-3.5 h-3.5 text-blue-400" /> Predict
                                            </button>
                                        )}
                                        <button
                                            onClick={() => startEditing(app)}
                                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors min-h-[36px]"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(app.id)}
                                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-colors ml-auto min-h-[36px]"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Briefcase className="w-7 h-7 text-gray-300" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">No applications yet</h3>
                        <p className="text-gray-400 text-sm mb-5">Track your first sponsorship application to get started.</p>
                        <button
                            onClick={() => setFormOpen(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors min-h-[44px]"
                        >
                            <Plus className="w-4 h-4" /> Add Your First Application
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Applications
