import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const ScientistSidebar = () => {
    const location = useLocation();

    return (
        <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-700 flex flex-col pt-6 z-10 sticky top-0">
            <div className="px-6 pb-6 border-b border-slate-700">
                <Link to="/lab/data" className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                        MatFlow
                    </h1>
                </Link>
                <p className="text-slate-400 text-sm mt-1">Materials Design Lab</p>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 text-slate-300">
                {/* 1. Dataset Page */}
                <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
                        1. Preparation
                    </h3>
                    <Link
                        to="/lab/data"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            location.pathname.includes('/lab/data')
                                ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                                : 'hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                        Data Lab
                    </Link>
                </div>

                {/* 2. Forward ML Page */}
                <div className="pt-4">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
                        2. Prediction
                    </h3>
                    <Link
                        to="/lab/forward"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            location.pathname.includes('/lab/forward')
                                ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                                : 'hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Forward ML
                    </Link>
                </div>

                {/* 3. Inverse Design Page */}
                <div className="pt-4">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
                        3. Generation
                    </h3>
                    <Link
                        to="/lab/inverse"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            location.pathname.includes('/lab/inverse')
                                ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                                : 'hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        Inverse Design
                    </Link>
                </div>
            </nav>

            <div className="px-6 py-4 border-t border-slate-700">
                <Link to="/dashboard" className="text-sm flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                    </svg>
                    Back to Dashboard
                </Link>
            </div>
        </aside>
    );
};

export default ScientistSidebar;
