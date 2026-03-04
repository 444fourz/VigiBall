import React, { useState, useEffect } from 'react';

function Admin() {
    const [results, setResults] = useState([]);

    // Fetch live data from the backend CSV
    const refreshData = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/get_results');
            const data = await res.json();
            // Data comes back as a JSON string from Pandas, so we parse if needed
            setResults(typeof data === 'string' ? JSON.parse(data) : data);
        } catch (err) {
            console.error("Failed to fetch results", err);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    // Calculate Average Delta (Influence)
    const avgDelta = results.length > 0 
        ? (results.reduce((acc, curr) => acc + Math.abs(curr.final_bid - curr.initial_guess), 0) / results.length).toFixed(1)
        : 0;

    return (
        <div className="min-h-screen bg-[#020617] text-white p-12 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-12 border-b border-slate-800 pb-6">
                    <div>
                        <h1 className="text-2xl font-black text-sky-400 uppercase tracking-tighter">Researcher Console</h1>
                        <p className="text-slate-500 text-xs">MONITORING EXPERIMENT: AUTOMATION BIAS IN TRANSFER VALUATION</p>
                    </div>
                    <button onClick={refreshData} className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-lg text-xs font-bold transition-all border border-slate-700">
                        REFRESH LIVE DATA
                    </button>
                </div>

                {/* Metric Overviews */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800">
                        <p className="text-slate-500 text-[10px] font-bold uppercase mb-2">Total Submissions</p>
                        <div className="text-5xl font-black text-white">{results.length}</div>
                    </div>
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800">
                        <p className="text-slate-500 text-[10px] font-bold uppercase mb-2">Mean Influence (£M)</p>
                        <div className="text-5xl font-black text-green-400">£{avgDelta}M</div>
                    </div>
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800">
                        <p className="text-slate-500 text-[10px] font-bold uppercase mb-2">System Status</p>
                        <div className="text-5xl font-black text-sky-400 italic">LIVE</div>
                    </div>
                </div>

                {/* Results Table */}
                <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950 border-b border-slate-800">
                            <tr>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase">Player</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase">Human Initial (£M)</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase">AI Valuation (£M)</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase">Human Final (£M)</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase">Shift (Difference)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {results.map((r, i) => (
                                <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="p-6 font-bold text-white">{r.player}</td>
                                    <td className="p-6 text-slate-400">£{r.initial_guess}M</td>
                                    <td className="p-6 text-green-400 font-bold">£{r.ai_value}M</td>
                                    <td className="p-6 text-sky-400 font-bold">£{r.final_bid}M</td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black ${Math.abs(r.final_bid - r.initial_guess) > 0 ? 'bg-sky-500/10 text-sky-400' : 'bg-slate-800 text-slate-500'}`}>
                                            £{Math.abs(r.final_bid - r.initial_guess).toFixed(1)}M
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {results.length === 0 && (
                        <div className="p-20 text-center text-slate-600 italic">No experimental data recorded yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Admin;