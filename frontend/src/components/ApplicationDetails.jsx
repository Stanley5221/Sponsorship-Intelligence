import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ChevronLeft, Building2, MapPin, Briefcase, Calendar,
    Banknote, Globe, FileText, Send, Loader2,
    AlertCircle, ExternalLink, Trash2, Edit
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import StatusBadge from './StatusBadge';
import ApplicationTimeline from './ApplicationTimeline';
import Modal from './Modal';
import ApplicationForm from './ApplicationForm';

export default function ApplicationDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState('');
    const [addingNote, setAddingNote] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchApplication = async () => {
        try {
            const response = await api.get(`/applications/${id}`);
            setApplication(response.data);
        } catch (error) {
            console.error('Error fetching application:', error);
            toast.error('Failed to load application details');
            navigate('/applications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplication();
    }, [id]);

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        setAddingNote(true);
        try {
            await api.post(`/applications/${id}/updates`, { note: newNote });
            setNewNote('');
            toast.success('Note added to timeline');
            fetchApplication();
        } catch (error) {
            toast.error('Failed to add note');
        } finally {
            setAddingNote(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this application?')) return;

        try {
            await api.delete(`/applications/${id}`);
            toast.success('Application deleted');
            navigate('/applications');
        } catch (error) {
            toast.error('Failed to delete application');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-gray-400 font-medium animate-pulse">Loading Application Details...</p>
            </div>
        );
    }

    if (!application) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Navigation & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <Link
                    to="/applications"
                    className="inline-flex items-center gap-2 text-sm font-black text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Tracker
                </Link>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95"
                        title="Edit Application"
                    >
                        <Edit className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-2.5 bg-white border border-gray-200 text-gray-400 hover:text-rose-600 hover:border-rose-200 transition-all active:scale-95"
                        title="Delete Application"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Header Card */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 sm:p-10">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                        <div className="flex gap-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 rounded-3xl flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                                    {application.company.name}
                                </h1>
                                <p className="text-gray-500 font-medium flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-300" />
                                    {application.company.town}
                                </p>
                                <div className="pt-2 flex flex-wrap gap-2">
                                    <StatusBadge status={application.status} />
                                    {application.company.rating && (
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-500">
                                            RATING: {application.company.rating}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {application.externalWebsite && (
                            <a
                                href={application.externalWebsite}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-gray-900/10 hover:shadow-gray-900/20 hover:-translate-y-1 transition-all active:scale-95 h-fit sm:mt-2"
                            >
                                VIEW JOB POST <ExternalLink className="w-4 h-4" />
                            </a>
                        )}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-12 pt-10 border-t border-gray-50">
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Job Role</p>
                            <div className="flex items-center gap-3">
                                <Briefcase className="w-5 h-5 text-gray-300" />
                                <span className="font-bold text-gray-900">{application.role}</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Applied On</p>
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-gray-300" />
                                <span className="font-bold text-gray-900">
                                    {new Date(application.appliedDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Salary Range</p>
                            <div className="flex items-center gap-3">
                                <Banknote className="w-5 h-5 text-gray-300" />
                                <span className="font-bold text-gray-900 text-emerald-600">{application.salary || '—'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Information & Timeline */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Add Update */}
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-500" />
                            ADD TIMELINE UPDATE
                        </h3>
                        <form onSubmit={handleAddNote} className="space-y-4">
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Add a note about an interview, email, or task..."
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium min-h-[120px]"
                            />
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={addingNote || !newNote.trim()}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0 flex items-center gap-2"
                                >
                                    {addingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                    POST UPDATE
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-black text-gray-900 pl-4 uppercase tracking-widest text-xs opacity-40">
                            Activity History
                        </h3>
                        <ApplicationTimeline updates={application.updates} />
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 space-y-6">
                        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-rose-500" />
                            FOLLOW UP
                        </h3>

                        {application.followUpDate ? (
                            <div className="space-y-4">
                                <div className={`p-5 rounded-2xl border ${new Date(application.followUpDate) < new Date() && !application.followUpCompleted
                                        ? 'bg-rose-50 border-rose-100 text-rose-700'
                                        : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                    }`}>
                                    <p className="text-xs font-black uppercase tracking-widest mb-1.5 opacity-60">
                                        Next Action Date
                                    </p>
                                    <p className="text-xl font-black">
                                        {new Date(application.followUpDate).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </p>
                                    {new Date(application.followUpDate) < new Date() && !application.followUpCompleted && (
                                        <div className="mt-3 flex items-center gap-2 text-xs font-bold">
                                            <AlertCircle className="w-4 h-4" />
                                            FOLLOW UP OVERDUE
                                        </div>
                                    )}
                                </div>
                                {!application.followUpCompleted && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                await api.put(`/applications/${id}`, { followUpCompleted: true });
                                                toast.success('Follow-up marked completed');
                                                fetchApplication();
                                            } catch (e) { toast.error('Failed to update'); }
                                        }}
                                        className="w-full py-4 bg-gray-50 text-gray-600 rounded-2xl font-black text-xs hover:bg-gray-100 transition-all border border-gray-100"
                                    >
                                        MARK AS COMPLETED
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <p className="text-xs font-bold">No follow-up scheduled</p>
                            </div>
                        )}
                    </div>

                    {/* Metadata Card */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2rem] p-8 text-white space-y-4 shadow-xl shadow-gray-200/50">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CV Version</p>
                            <p className="font-bold flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-400" />
                                {application.cvVersion || 'Standard CV'}
                            </p>
                        </div>
                        <div className="pt-4 border-t border-white/10 space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initial Notes</p>
                            <p className="text-sm font-medium text-gray-300 leading-relaxed italic">
                                "{application.notes || 'No initial notes provided'}"
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Application"
            >
                <p className="text-xs text-gray-400 mb-6 font-bold uppercase tracking-widest">Refining Details for {application.company.name}</p>
                <ApplicationForm
                    company={application.company}
                    onSuccess={() => {
                        setIsEditModalOpen(false);
                        fetchApplication();
                    }}
                    onCancel={() => setIsEditModalOpen(false)}
                />
            </Modal>
        </div>
    );
}

// Sub-components used above but keeping it clean with imports
function MessageSquare(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    )
}
