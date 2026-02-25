import { useState, useEffect } from 'react'
import api from '../services/api'
import { Plus, Trash2, Edit2, Check, X, Calendar, Briefcase, FileText, Clock, AlertCircle, Building2, Brain } from 'lucide-react'
import { toast } from 'react-hot-toast'

const API_URL = 'http://localhost:5000/api'

function Applications() {
    const [applications, setApplications] = useState([])
    const [companies, setCompanies] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState(null)
    const [predictions, setPredictions] = useState({}) // Store results by app.id

    // Form State
    const [formData, setFormData] = useState({
        companyId: '',
        jobRole: '',
        dateApplied: new Date().toISOString().split('T')[0],
        status: 'Applied',
        followUpDate: '',
        notes: '',
        cvVersion: ''
    })

    // Inline Edit State
    const [editData, setEditData] = useState({
        status: '',
        notes: '',
        jobRole: '',
        cvVersion: ''
    })

    const fetchApplications = async () => {
        try {
            const response = await api.get('/applications')
            setApplications(response.data)
        } catch (error) {
            toast.error('Failed to load applications')
        } finally {
            setLoading(false)
        }
    }

    const fetchCompanies = async (searchStr = '') => {
        try {
            const response = await api.get('/companies', {
                params: { limit: 50, town: searchStr }
            })
            setCompanies(response.data.companies)
        } catch (error) {
            console.error('Error fetching companies for dropdown:', error)
        }
    }

    useEffect(() => {
        fetchApplications()
        fetchCompanies()
    }, [])

    const handlePredict = async (appId, companyId) => {
        const loadingToast = toast.loading('Calculating outcomes...')
        try {
            const response = await api.get(`/predict/${companyId}`)
            setPredictions(prev => ({ ...prev, [appId]: response.data }))
            toast.success('Strategy calculated', { id: loadingToast })
        } catch (error) {
            toast.error('Prediction engine unreachable', { id: loadingToast })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.companyId) return toast.error('Please select a company')

        const loadingToast = toast.loading('Adding application...')
        try {
            await api.post('/applications', {
                ...formData,
                companyId: parseInt(formData.companyId)
            })
            toast.success('Application added!', { id: loadingToast })
            setFormData({
                companyId: '',
                jobRole: '',
                dateApplied: new Date().toISOString().split('T')[0],
                status: 'Applied',
                followUpDate: '',
                notes: '',
                cvVersion: ''
            })
            fetchApplications()
        } catch (error) {
            toast.error('Failed to add application', { id: loadingToast })
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this application?')) return

        try {
            await api.delete(`/applications/${id}`)
            toast.success('Application deleted')
            setApplications(applications.filter(app => app.id !== id))
        } catch (error) {
            toast.error('Failed to delete')
        }
    }

    const startEditing = (app) => {
        setEditingId(app.id)
        setEditData({
            status: app.status,
            notes: app.notes || '',
            jobRole: app.jobRole,
            cvVersion: app.cvVersion || ''
        })
    }

    const handleUpdate = async (id) => {
        try {
            await api.put(`/applications/${id}`, editData)
            toast.success('Application updated')
            setEditingId(null)
            fetchApplications()
        } catch (error) {
            toast.error('Update failed')
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Applications</h1>
                <p className="text-gray-600">Keep account of your job applications and move updates</p>
            </header>

            {/* Add New Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" />
                    Add New Application
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Company</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm appearance-none"
                                value={formData.companyId}
                                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                required
                            >
                                <option value="">Select Company</option>
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} - {c.town}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Job Role</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                placeholder="Software Developer..."
                                value={formData.jobRole}
                                onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Date Applied</label>
                        <input
                            type="date"
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                            value={formData.dateApplied}
                            onChange={(e) => setFormData({ ...formData, dateApplied: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                        <select
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="Applied">Applied</option>
                            <option value="Interviewing">Interviewing</option>
                            <option value="Offer">Offer</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                    <div className="space-y-1 lg:col-span-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Notes (Optional)</label>
                        <input
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                            placeholder="Added cover letter, found on LinkedIn..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">CV Version</label>
                        <input
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                            placeholder="Fullstack_2024.pdf"
                            value={formData.cvVersion}
                            onChange={(e) => setFormData({ ...formData, cvVersion: e.target.value })}
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Save Application
                        </button>
                    </div>
                </form>
            </div>

            {/* Application List */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="flex justify-center p-12 text-blue-600">
                        <Clock className="w-8 h-8 animate-spin" />
                    </div>
                ) : applications.length > 0 ? (
                    applications.map((app) => (
                        <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{app.company.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                            <Briefcase className="w-4 h-4" />
                                            {app.jobRole}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {editingId === app.id ? (
                                            <select
                                                className="text-xs font-bold px-3 py-1 border border-gray-200 rounded-full"
                                                value={editData.status}
                                                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                            >
                                                <option value="Applied">Applied</option>
                                                <option value="Interviewing">Interviewing</option>
                                                <option value="Offer">Offer</option>
                                                <option value="Rejected">Rejected</option>
                                            </select>
                                        ) : (
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${app.status === 'Applied' ? 'bg-blue-100 text-blue-700' :
                                                app.status === 'Interviewing' ? 'bg-purple-100 text-purple-700' :
                                                    app.status === 'Offer' ? 'bg-green-100 text-green-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {app.status}
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(app.dateApplied).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notes</span>
                                        {editingId === app.id ? (
                                            <textarea
                                                className="w-full p-2 text-sm bg-gray-50 border border-gray-100 rounded-lg outline-none focus:ring-1 focus:ring-blue-300 transition-all resize-none"
                                                rows="2"
                                                value={editData.notes}
                                                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-600 italic">
                                                {app.notes || 'No notes added'}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CV Version</span>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <FileText className="w-4 h-4 text-gray-400" />
                                            {app.cvVersion || 'Not specified'}
                                        </div>
                                    </div>
                                    <div className="flex items-end justify-end gap-2">
                                        {predictions[app.id] && (
                                            <div className="flex-1 flex gap-2 animate-in zoom-in duration-300">
                                                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2 flex-1">
                                                    <span className="text-[10px] font-bold text-blue-500 uppercase block">Interview</span>
                                                    <span className="text-sm font-black text-blue-700">{(predictions[app.id].interviewProbability * 100).toFixed(0)}%</span>
                                                </div>
                                                <div className="bg-green-50/50 border border-green-100 rounded-lg p-2 flex-1">
                                                    <span className="text-[10px] font-bold text-green-500 uppercase block">Offer</span>
                                                    <span className="text-sm font-black text-green-700">{(predictions[app.id].offerProbability * 100).toFixed(0)}%</span>
                                                </div>
                                            </div>
                                        )}
                                        {editingId === app.id ? (
                                            <>
                                                <button
                                                    onClick={() => handleUpdate(app.id)}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Save Changes"
                                                >
                                                    <Check className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                                                    title="Cancel"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {!predictions[app.id] && (
                                                    <button
                                                        onClick={() => handlePredict(app.id, app.companyId)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gray-50 text-gray-600 border border-gray-100 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all group"
                                                        title="Predict Outcome"
                                                    >
                                                        <Brain className="w-4 h-4 text-blue-400 group-hover:animate-pulse" />
                                                        Predict
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => startEditing(app)}
                                                    className="p-2 text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(app.id)}
                                                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-gray-900 font-bold mb-1">No applications yet</h3>
                        <p className="text-gray-500 text-sm">Start by adding your first job application above.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Applications
