import React, { useState } from 'react';
import { Building2, Globe, MapPin, Briefcase, Calendar, Banknote, FileText, Link, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const ApplicationForm = ({ company, onSuccess, onCancel, isExternalCreation = false }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        role: '',
        status: 'APPLIED',
        appliedDate: new Date().toISOString().split('T')[0],
        followUpDate: '',
        salary: '',
        externalWebsite: '',
        notes: '',
        // External company fields
        companyName: company?.name || '',
        companyTown: company?.town || '',
        companyIndustry: '',
        companyWebsite: '',
        companyLogoUrl: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                role: formData.role,
                status: formData.status,
                appliedDate: formData.appliedDate,
                followUpDate: formData.followUpDate || null,
                salary: formData.salary,
                externalWebsite: formData.externalWebsite,
                notes: formData.notes,
            };

            if (isExternalCreation) {
                payload.isExternalCompany = true;
                payload.companyData = {
                    name: formData.companyName,
                    town: formData.companyTown,
                    industry: formData.companyIndustry,
                    website: formData.companyWebsite,
                    logoUrl: formData.companyLogoUrl,
                };
            } else {
                payload.companyId = company.id;
            }

            await api.post('/applications', payload);
            toast.success('Application tracked successfully!');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Submission error:', error);
            toast.error(error.response?.data?.error || 'Failed to create application');
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium";
    const labelClasses = "block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Context */}
            {!isExternalCreation && company && (
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100/50 mb-8">
                    <div className="bg-white p-2.5 rounded-xl shadow-sm">
                        <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-black text-gray-900 leading-tight">{company.name}</h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {company.town}
                        </p>
                    </div>
                </div>
            )}

            {isExternalCreation && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-gray-100">
                    <div className="md:col-span-2">
                        <label className={labelClasses}>Company Name</label>
                        <input
                            required
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            className={inputClasses}
                            placeholder="e.g. Acme Corp"
                        />
                    </div>
                    <div>
                        <label className={labelClasses}>Location</label>
                        <input
                            name="companyTown"
                            value={formData.companyTown}
                            onChange={handleChange}
                            className={inputClasses}
                            placeholder="e.g. London"
                        />
                    </div>
                    <div>
                        <label className={labelClasses}>Industry</label>
                        <input
                            name="companyIndustry"
                            value={formData.companyIndustry}
                            onChange={handleChange}
                            className={inputClasses}
                            placeholder="e.g. Technology"
                        />
                    </div>
                </div>
            )}

            {/* Core Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                <div className="md:col-span-2">
                    <label className={labelClasses}>Job Role</label>
                    <div className="relative">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            required
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className={`${inputClasses} pl-11`}
                            placeholder="e.g. Full Stack Developer"
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClasses}>Current Status</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className={inputClasses}
                    >
                        <option value="APPLIED">Applied</option>
                        <option value="INTERVIEW">Interview</option>
                        <option value="OFFER">Offer</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="NO_RESPONSE">No Response</option>
                        <option value="WITHDRAWN">Withdrawn</option>
                    </select>
                </div>

                <div>
                    <label className={labelClasses}>Date Applied</label>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="date"
                            name="appliedDate"
                            value={formData.appliedDate}
                            onChange={handleChange}
                            className={`${inputClasses} pl-11`}
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClasses}>Salary Range (Optional)</label>
                    <div className="relative">
                        <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            name="salary"
                            value={formData.salary}
                            onChange={handleChange}
                            className={`${inputClasses} pl-11`}
                            placeholder="e.g. £45k - £55k"
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClasses}>Follow-up Date (Optional)</label>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400/60" />
                        <input
                            type="date"
                            name="followUpDate"
                            value={formData.followUpDate}
                            onChange={handleChange}
                            className={`${inputClasses} pl-11`}
                        />
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className={labelClasses}>Job Link / Website</label>
                    <div className="relative">
                        <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            name="externalWebsite"
                            value={formData.externalWebsite}
                            onChange={handleChange}
                            className={`${inputClasses} pl-11`}
                            placeholder="https://company.com/jobs/..."
                        />
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className={labelClasses}>Initial Notes</label>
                    <div className="relative">
                        <FileText className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            className={`${inputClasses} pl-11 min-h-[100px] py-3.5`}
                            placeholder="Any key details about the application process..."
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-6 py-3.5 rounded-2xl font-black text-gray-500 hover:bg-gray-50 transition-all text-sm"
                >
                    CANCEL
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] px-6 py-3.5 bg-gray-900 text-white rounded-2xl font-black shadow-xl shadow-gray-900/10 hover:shadow-gray-900/20 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2 text-sm"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            SAVING...
                        </>
                    ) : (
                        <>
                            CREATE APPLICATION
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default ApplicationForm;
