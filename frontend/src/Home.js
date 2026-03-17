import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("start"); // "start", "about", "bias"
    const [inviteCode, setInviteCode] = useState("");

    const handleJoinTest = (e) => {
        e.preventDefault();
        if (inviteCode.trim()) {
            const testId = inviteCode.includes('/test/') 
                ? inviteCode.split('/test/')[1] 
                : inviteCode;
            navigate(`/test/${testId}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6 font-sans">
            <div className="max-w-2xl w-full">
                
                {/* LOGO SECTION */}
                <div className="text-center mb-8">
                    <h1 className="text-6xl font-black text-sky-400 italic tracking-tighter mb-2">VIGIBALL</h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">AI Scouting & Valuation Terminal</p>
                </div>

                {/* TAB NAVIGATION */}
                <div className="flex justify-center gap-2 mb-8 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 w-fit mx-auto">
                    {[
                        { id: 'start', label: 'Begin Test' },
                        { id: 'about', label: 'About Project' },
                        { id: 'bias', label: 'What is Automation Bias?' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab.id 
                                ? 'bg-sky-500 text-black shadow-lg shadow-sky-500/20' 
                                : 'text-slate-500 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* TAB CONTENT: START */}
                {activeTab === 'start' && (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                        <button 
                            onClick={() => navigate('/standard')}
                            className="w-full bg-white text-slate-950 p-8 rounded-[2.5rem] font-black uppercase tracking-widest hover:bg-sky-400 transition-all shadow-2xl group text-left relative overflow-hidden"
                        >
                            <span className="relative z-10 text-xl">Start Standard Test</span>
                            <p className="relative z-10 text-[10px] font-bold text-slate-500 mt-1 group-hover:text-slate-900 transition-colors">Evaluate pre-defined cohort</p>
                            <div className="absolute right-10 top-1/2 -translate-y-1/2 text-4xl opacity-10 group-hover:opacity-100 transition-all">→</div>
                        </button>

                        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
                            <h2 className="text-sky-400 font-black text-[10px] uppercase tracking-widest mb-4">Researcher Session</h2>
                            <form onSubmit={handleJoinTest} className="flex gap-3">
                                <input 
                                    type="text" 
                                    placeholder="Enter Test ID..."
                                    className="flex-grow bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm focus:border-sky-500 outline-none transition-all"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                />
                                <button 
                                    type="submit"
                                    disabled={!inviteCode}
                                    className="bg-sky-500 text-black px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-sky-400 disabled:opacity-30 transition-all"
                                >
                                    Join
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: BIAS */}
                {activeTab === 'bias' && (
                    <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-2xl font-black mb-4 text-white uppercase italic">The Automation Bias</h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            Automation bias is a ...
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                <p className="text-sky-400 font-black text-[10px] uppercase mb-2">Commission Errors</p>
                                <p className="text-slate-500 text-[10px]">Following incorrect instructions provided by an automated system.</p>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                <p className="text-sky-400 font-black text-[10px] uppercase mb-2">Omission Errors</p>
                                <p className="text-slate-500 text-[10px]">Failing to notice critical information because the system didn't flag it.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: ABOUT */}
                {activeTab === 'about' && (
                    <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-2xl font-black mb-4 text-white uppercase italic">Project Overview</h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            This platform is part of a Final Year Dissertation at Aston University. It explores how ...
                        </p>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b border-slate-800 pb-2 text-[10px]">
                                <span className="text-slate-500 font-bold uppercase">Researcher</span>
                                <span className="text-sky-400 font-black uppercase">Nayeem Ahmed FYP</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-2 text-[10px]">
                                <span className="text-slate-500 font-bold uppercase">Focus</span>
                                <span className="text-sky-400 font-black uppercase">Automation Bias Within the Transfer Market</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-2 text-[10px]">
                                <span className="text-slate-500 font-bold uppercase">Dataset</span>
                                <span className="text-sky-400 font-black uppercase">https://www.kaggle.com/datasets/hubertsidorowicz/football-players-stats-2024-2025
                                    https://www.kaggle.com/datasets/hubertsidorowicz/football-players-stats-2025-2026/versions/25/data</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* DATA SCOPE FOOTER */}
                <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-600 font-medium">
                        Nayeem Ahmed 2026 Final Year Project | Aston University
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Home;