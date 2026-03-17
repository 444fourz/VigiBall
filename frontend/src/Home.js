import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const [inviteCode, setInviteCode] = useState("");

    const handleJoinTest = (e) => {
        e.preventDefault();
        if (inviteCode.trim()) {
            // Extracts ID if they paste the whole link, or just use the code
            const testId = inviteCode.includes('/test/') 
                ? inviteCode.split('/test/')[1] 
                : inviteCode;
            navigate(`/test/${testId}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-black text-sky-400 italic tracking-tighter mb-2">VIGIBALL</h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">Scouting & Valuation AI</p>
                </div>

                <div className="space-y-6">
                    {/* OPTION 1: STANDARD TEST */}
                    <button 
                        onClick={() => navigate('/standard')}
                        className="w-full bg-white text-slate-950 p-6 rounded-3xl font-black uppercase tracking-widest hover:bg-sky-400 transition-all shadow-xl group"
                    >
                        Start Standard Test
                        <p className="text-[10px] font-bold text-slate-500 mt-1 group-hover:text-slate-900 transition-colors">Evaluate our pre-selected cohort</p>
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="h-[1px] bg-slate-800 flex-grow"></div>
                        <span className="text-[10px] font-black text-slate-600 uppercase">OR</span>
                        <div className="h-[1px] bg-slate-800 flex-grow"></div>
                    </div>

                    {/* OPTION 2: JOIN VIA LINK/CODE */}
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
                        <h2 className="text-sky-400 font-black text-[10px] uppercase tracking-widest mb-4">Join Researcher Session</h2>
                        <form onSubmit={handleJoinTest} className="space-y-4">
                            <input 
                                type="text" 
                                placeholder="Enter Test ID or Link..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm focus:border-sky-500 outline-none transition-all"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                            />
                            <button 
                                type="submit"
                                disabled={!inviteCode}
                                className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest transition-all"
                            >
                                Join Session
                            </button>
                        </form>
                    </div>
                </div>

                <p className="mt-12 text-center text-[10px] text-slate-600 font-medium">
                    Dissertation Project © 2026<br/>
                    Automation Bias in Human-AI Collaborative Decision Making
                </p>
            </div>
        </div>
    );
};

export default Home;