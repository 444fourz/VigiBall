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
                {/* Logo section at the top */}
                <div className="text-center mb-8">
                    <h1 className="text-6xl font-black text-sky-400 italic tracking-tighter mb-2">VIGIBALL</h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">AI Scouting & Valuation Terminal</p>
                </div>
                {/* Tab navigation */}
                <div className="flex justify-center gap-2 mb-8 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 w-fit mx-auto">
                    {[
                        { id: 'start', label: 'Begin Test' },
                        { id: 'about', label: 'About Project' },
                        { id: 'bias', label: 'What is Automation Bias?' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                ? 'bg-sky-500 text-black shadow-lg shadow-sky-500/20'
                                : 'text-slate-500 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                {/* Start Standard Test button */}
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
                {/* Researcher session area */}
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

                {/* What is Automation bias section  */}
                {activeTab === 'bias' && (
                    <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-2xl font-black mb-4 text-white uppercase italic tracking-tighter">Understanding Automation Bias</h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8">
                            Automation Bias is a cognitive heuristic where humans over-rely on automated systems, often favoring algorithmic output over their own expertise or contradictory environmental data. In high-stakes environments like the transfer market, this can lead to two distinct failure states:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="group bg-slate-950 p-6 rounded-2xl border border-slate-800 hover:border-sky-500/50 transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_8px_#0ea5e9]"></div>
                                    <p className="text-sky-400 font-black text-[11px] uppercase tracking-widest">Commission Errors</p>
                                </div>
                                <p className="text-slate-500 text-[11px] leading-normal">
                                    The active decision to follow incorrect algorithmic advice, even when it conflicts with observable reality (e.g., accepting a low valuation for an elite performer).
                                </p>
                            </div>
                            <div className="group bg-slate-950 p-6 rounded-2xl border border-slate-800 hover:border-sky-500/50 transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-2 w-2 rounded-full bg-slate-700 group-hover:bg-sky-500 transition-colors"></div>
                                    <p className="text-slate-400 group-hover:text-sky-400 font-black text-[11px] uppercase tracking-widest transition-colors">Omission Errors</p>
                                </div>
                                <p className="text-slate-500 text-[11px] leading-normal">
                                    The failure to act or notice critical information because the automated system failed to provide an alert or prompt, leading to a loss of situational awareness.
                                </p>
                            </div>
                        </div>
                        <div className="mt-8 p-4 bg-sky-500/5 rounded-xl border border-sky-500/10">
                            <p className="text-[10px] text-sky-500/80 italic text-center">
                                VigiBall measures these errors by calculating your <strong>Weight of Advice (WoA)</strong> shift during the valuation process.
                            </p>
                        </div>
                    </div>
                )}
                {/* About project section */}
                {activeTab === 'about' && (
                    <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-2xl font-black mb-6 text-white uppercase italic tracking-tight">Project Overview</h2>
                        <div className="space-y-6 mb-10 text-slate-400 text-sm leading-relaxed">
                            <p>
                                This platform is the core technical artifact of a Final Year Dissertation at <span className="text-sky-400 font-bold">Aston University</span>.
                                It investigates the intersection of <span className="text-white font-semibold">Predictive Analytics</span> and <span className="text-white font-semibold">Human-Computer Interaction (HCI)</span> within the professional football scouting industry.
                            </p>
                            <p>
                                At its heart is a proprietary <span className="text-sky-400 font-bold">Market Value Prediction Algorithm (MVPA)</span> that processes 30+
                                position-specific performance metrics such as xG, Progressive Passes, and PSxG-GA to generate real-time financial valuations.
                            </p>
                            <p>
                                By simulating a high-pressure "Deadline Day" environment, this study measures <span className="text-sky-400 font-bold">Automation Bias</span>.
                                It analyzes how effectively human intuition can resist or adapt to algorithmic influence when presented with conflicting social and technical stimuli.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex justify-between border-b border-slate-800/50 pb-3 text-[10px]">
                                <span className="text-slate-500 font-bold uppercase tracking-widest">Lead Researcher</span>
                                <span className="text-sky-400 font-black uppercase">Nayeem Ahmed</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800/50 pb-3 text-[10px]">
                                <span className="text-slate-500 font-bold uppercase tracking-widest">Primary Focus</span>
                                <span className="text-white font-medium uppercase">Cognitive Bias & Over-reliance of system advice</span>
                            </div>
                            <div className="flex flex-col gap-2 pt-1">
                                <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Data Provenance</span>
                                <div className="flex flex-col gap-1">
                                    <span className="text-sky-400/80 font-mono text-[9px] truncate">
                                        Kaggle: Football Player Stats{' '}
                                        <a
                                            href="https://www.kaggle.com/datasets/hubertsidorowicz/football-players-stats-2024-2025"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-bold text-sky-400 hover:text-white underline decoration-sky-500/50 underline-offset-2 transition-all"
                                        >
                                            24/25
                                        </a>
                                        {' '}&{' '}
                                        <a
                                            href="https://www.kaggle.com/datasets/hubertsidorowicz/football-players-stats-2025-2026"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-bold text-sky-400 hover:text-white underline decoration-sky-500/50 underline-offset-2 transition-all"
                                        >
                                            25/26
                                        </a>
                                    </span>
                                    <span className="text-slate-600 font-mono text-[8px] italic uppercase tracking-tighter">Source: FBRef Data via Hubert Sidorowicz</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Footer */}
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