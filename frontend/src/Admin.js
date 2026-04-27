import React, { useState, useEffect } from 'react';

function Admin() {
    const [results, setResults] = useState([]);
    const [availableTests, setAvailableTests] = useState([]); 
    const [selectedTest, setSelectedTest] = useState("ALL");
    const [sortOrder, setSortOrder] = useState('asc'); 
    const [playerFilter, setPlayerFilter] = useState("ALL");
    
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [basket, setBasket] = useState([]);
    const [testLink, setTestLink] = useState("");

    const refreshData = async () => {
        try {
            const url = selectedTest === "ALL" 
                ? 'http://localhost:5000/api/get_results' 
                : `http://localhost:5000/api/get_results?test_id=${selectedTest}`;
            
            const res = await fetch(url);
            const data = await res.json();
            setResults(data);

            const testRes = await fetch('http://localhost:5000/api/admin/list-tests');
            const testData = await testRes.json();
            setAvailableTests(testData);
        } catch (err) {
            console.error("Failed to fetch data", err);
        }
    };

    useEffect(() => {
        refreshData();
        setPlayerFilter("ALL"); 
    }, [selectedTest]);

    // Sorting Logic
    const sortByPlayer = () => {
        const sorted = [...results].sort((a, b) => {
            const nameA = (a.player_name || a.player || "");
            const nameB = (b.player_name || b.player || "");
            return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        });
        setResults(sorted);
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };

    // Filter Logic
    const uniquePlayers = ["ALL", ...new Set(results.map(r => r.player_name || r.player).filter(Boolean))];
    const filteredResults = playerFilter === "ALL" 
        ? results 
        : results.filter(r => (r.player_name || r.player) === playerFilter);

    // Analytics Summary Logic
    const avgDelta = filteredResults.length > 0 
        ? (filteredResults.reduce((acc, curr) => acc + Math.abs(Number(curr.final_bid) - Number(curr.initial_guess)), 0) / filteredResults.length).toFixed(1)
        : 0;

    const avgBias = filteredResults.length > 0
        ? (filteredResults.reduce((acc, curr) => acc + (curr.bias_score || 0), 0) / filteredResults.length).toFixed(2)
        : 0;

    // Actions
    const clearData = async () => {
        if (window.confirm("CRITICAL: Wipe all results from SQL?")) {
            await fetch('http://localhost:5000/api/clear_results', { method: 'POST' });
            refreshData();
        }
    };

    const searchPlayers = async (query) => {
        setSearchQuery(query);
        if (query.length < 2) { setSearchResults([]); return; }
        const res = await fetch(`http://localhost:5000/api/search_players?q=${query}`);
        const data = await res.json();
        setSearchResults(data);
    };

    const handleCreateTest = async () => {
        const res = await fetch('http://localhost:5000/api/admin/save-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ players: basket })
        });
        const data = await res.json();
        setTestLink(`${window.location.origin}/test/${data.test_id}`);
        setBasket([]); 
        refreshData();
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white p-8 font-sans">
            <div className="max-w-7xl mx-auto flex gap-8">
                
                {/* SIDEBAR: Experiment List */}
                <div className="w-64 shrink-0 space-y-4">
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Active Experiments</h2>
                    <button 
                        onClick={() => setSelectedTest("ALL")}
                        className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all border ${selectedTest === "ALL" ? 'bg-sky-500 text-black border-sky-500' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                    >
                        View All Data
                    </button>
                    <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-2">
                        {availableTests.map(testId => (
                            <button 
                                key={testId}
                                onClick={() => setSelectedTest(testId)}
                                className={`w-full text-left p-3 rounded-xl text-[10px] font-mono transition-all border ${selectedTest === testId ? 'bg-sky-500 text-black border-sky-500' : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-600'}`}
                            >
                                {testId}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-grow">
                    {/* HEADER SECTION */}
                    <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
                        <div>
                            <h1 className="text-2xl font-black text-sky-400 uppercase tracking-tighter">Researcher Console</h1>
                            <p className="text-slate-500 text-xs uppercase tracking-tight">Active Filter: <span className="text-white">{selectedTest}</span></p>
                        </div>
                        <div className="flex gap-4">
                            {/* Filter Dropdown */}
                            <div className="flex flex-col">
                                <label className="text-[9px] font-black text-slate-500 uppercase mb-1 ml-1">Filter by Player</label>
                                <select 
                                    value={playerFilter}
                                    onChange={(e) => setPlayerFilter(e.target.value)}
                                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-[10px] font-bold text-sky-400 outline-none focus:border-sky-500"
                                >
                                    {uniquePlayers.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                                </select>
                            </div>
                            <button onClick={clearData} className="mt-auto bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-lg text-[10px] font-bold transition-all border border-red-500/20">WIPE SQL</button>
                            <button onClick={refreshData} className="mt-auto bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-[10px] font-bold transition-all border border-slate-700">REFRESH</button>
                        </div>
                    </div>

                    {/* TEST BUILDER SECTION: Creation & Basket */}
                    <div className="bg-slate-900 p-6 rounded-3xl border border-sky-500/10 mb-8 shadow-2xl">
                        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Create New Test Cohort</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <input 
                                    type="text" 
                                    placeholder="Search players for test..." 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:border-sky-500 outline-none"
                                    onChange={(e) => searchPlayers(e.target.value)}
                                />
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {searchResults.map(name => (
                                        <button 
                                            key={name} 
                                            onClick={() => !basket.includes(name) && setBasket([...basket, name])} 
                                            className="text-[9px] bg-slate-800 hover:bg-sky-500 hover:text-black p-2 rounded-lg transition-all font-bold uppercase"
                                        >
                                            {name} +
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                <p className="text-[9px] text-slate-500 font-black uppercase mb-2">Selected Players</p>
                                <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
                                    {basket.map(p => (
                                        <span key={p} className="text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-1 rounded-md font-bold flex items-center gap-2">
                                            {p}
                                            <button onClick={() => setBasket(basket.filter(item => item !== p))} className="hover:text-red-500">×</button>
                                        </span>
                                    ))}
                                </div>
                                <button 
                                    onClick={handleCreateTest} 
                                    disabled={basket.length === 0}
                                    className="w-full bg-sky-500 text-black text-[10px] font-black py-3 rounded-lg uppercase tracking-widest disabled:opacity-30"
                                >
                                    Generate Experiment Link
                                </button>
                            </div>
                        </div>
                        {testLink && (
                            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-[10px] font-mono text-green-400 flex justify-between items-center">
                                <span>{testLink}</span>
                                <button onClick={() => navigator.clipboard.writeText(testLink)} className="underline hover:text-white">Copy Link</button>
                            </div>
                        )}
                    </div>

                    {/* ANALYTICS SUMMARY: Dynamic based on Filter */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                            <p className="text-slate-500 text-[9px] font-black uppercase">Sample Size</p>
                            <div className="text-3xl font-black text-white">{filteredResults.length}</div>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                            <p className="text-slate-500 text-[9px] font-black uppercase">Mean Value Shift</p>
                            <div className="text-3xl font-black text-white">£{avgDelta}M</div>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 ring-1 ring-sky-500/30">
                            <p className="text-sky-500 text-[9px] font-black uppercase">Automation Bias Score</p>
                            <div className="text-3xl font-black text-sky-400">{(avgBias * 100).toFixed(0)}%</div>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                            <p className="text-slate-500 text-[9px] font-black uppercase">System Mode</p>
                            <div className="text-3xl font-black text-slate-400 italic">LIVE</div>
                        </div>
                    </div>

                    {/* DATA TABLE */}
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-500 uppercase font-black border-b border-slate-800">
                                <tr>
                                    <th className="p-4">User</th>
                                    <th className="p-4">
                                        <button onClick={sortByPlayer} className="flex items-center gap-2 hover:text-sky-400 transition-colors uppercase font-black">
                                            Player {sortOrder === 'asc' ? '↑' : '↓'}
                                        </button>
                                    </th>
                                    <th className="p-4">Initial</th>
                                    <th className="p-4">AI Value</th>
                                    <th className="p-4">Final Bid</th>
                                    <th className="p-4 text-sky-400">Bias Score</th>
                                    <th className="p-4">Time Out</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredResults.map((r, i) => (
                                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4 font-mono text-slate-500">{r.session_id?.slice(-5)}</td>
                                        <td className="p-4 font-bold">{r.player_name || r.player}</td>
                                        <td className="p-4 text-slate-400">£{r.initial_guess}M</td>
                                        <td className="p-4 text-white font-bold">£{r.ai_value}M</td>
                                        <td className="p-4 text-sky-400 font-bold">£{r.final_bid}M</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                    <div 
                                                        className="bg-sky-500 h-full transition-all duration-500" 
                                                        style={{ width: `${(r.bias_score || 0) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <span className="font-black text-sky-500">{(r.bias_score || 0).toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {r.time_out === 1 ? <span className="text-red-500 font-bold">YES</span> : <span className="text-slate-600">NO</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Admin;