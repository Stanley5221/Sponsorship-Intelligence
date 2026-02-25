import React from 'react';
import { Clock, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';

const ApplicationTimeline = ({ updates }) => {
    if (!updates || updates.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <MessageSquare className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm font-medium">No activity recorded yet</p>
                <p className="text-xs">Timeline updates will appear here automatically</p>
            </div>
        );
    }

    return (
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-gray-100 before:to-transparent">
            {updates.map((update, index) => (
                <div key={update.id} className="relative flex items-start gap-6 group">
                    {/* Dot */}
                    <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-transform group-hover:scale-110 ${index === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                        {index === 0 ? <Clock className="w-4 h-4" /> : <div className="w-2 h-2 bg-current rounded-full" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">
                                {new Date(update.createdAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-50 shadow-sm group-hover:border-blue-100/50 transition-colors">
                            <p className="text-sm text-gray-700 font-medium leading-relaxed">
                                {update.note}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ApplicationTimeline;
