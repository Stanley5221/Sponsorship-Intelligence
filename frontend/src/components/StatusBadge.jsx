import React from 'react';

const STATUS_COLORS = {
    APPLIED: 'bg-blue-100 text-blue-700 border-blue-200',
    INTERVIEW: 'bg-amber-100 text-amber-700 border-amber-200',
    OFFER: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-rose-100 text-rose-700 border-rose-200',
    NO_RESPONSE: 'bg-slate-100 text-slate-700 border-slate-200',
    WITHDRAWN: 'bg-purple-100 text-purple-700 border-purple-200',
};

const StatusBadge = ({ status }) => {
    const colorClass = STATUS_COLORS[status] || STATUS_COLORS.APPLIED;

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${colorClass}`}>
            {status.replace('_', ' ')}
        </span>
    );
};

export default StatusBadge;
export { STATUS_COLORS };
