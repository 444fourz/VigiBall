import React, { useState } from 'react';

const PLAYERS = ["Cole Palmer", "Martin Ødegaard", "William Saliba", "Mohamed Salah", "Kobbie Mainoo", "Antony", "Bryan Mbeumo", "Evan Ferguson", "Erling Haaland", "Chris Wood"];

function Participant() {
  const [player, setPlayer] = useState(PLAYERS[0]);
  const [guess, setGuess] = useState("");
  const [finalBid, setFinalBid] = useState("");
  const [data, setData] = useState(null);
  const [phase, setPhase] = useState(1);

  // 1. This "Effect" runs every time the 'player' variable changes
React.useEffect(() => {
  const fetchBasicStats = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/evaluate?name=${player}`);
      const result = await res.json();
      setData(result); // This updates the Matches, Goals, and Assists in Phase 1
    } catch (err) {
      console.error("Error fetching preview stats:", err);
    }
  };

  fetchBasicStats();
}, [player]); // <--- The [player] here is the "Dependency". It means: "Run this when player changes"

  const fetchPlayerData = async () => {
    const res = await fetch(`http://localhost:5000/api/evaluate?name=${player}`);
    const result = await res.json();
    setData(result);
    setPhase(2);
  };

  const submitResults = async () => {
    await fetch('http://localhost:5000/api/save_result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player: data.name,
        initial_guess: guess,
        ai_value: data.market_value_m,
        final_bid: finalBid
      })
    });
    setPhase(4); // Success screen
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-12">
      <div className="max-w-4xl mx-auto">

        {/* PHASE 1: BASIC STATS & INITIAL GUESS */}
        {phase === 1 && (
          <div className="bg-slate-900 p-10 rounded-[2rem] border border-slate-800 shadow-2xl">
            <h2 className="text-sky-400 font-black uppercase text-xs mb-8 tracking-widest">Phase 1: Subject Identification</h2>

            <select className="w-full bg-slate-800 p-4 rounded-xl mb-6" onChange={(e) => setPlayer(e.target.value)}>
              {PLAYERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <div className="flex justify-between items-center px-2 mb-2">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Performance Summary</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold bg-slate-800 px-2 py-1 rounded">
                    Since September 2024
                </span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8 text-center bg-slate-950 p-6 rounded-2xl">
              <div><p className="text-[10px] text-slate-500">GAMES</p><p className="text-2xl font-bold">{data ? data.matches : "-"}</p></div>
              <div><p className="text-[10px] text-slate-500">GOALS</p><p className="text-2xl font-bold text-green-400">{data ? data.goals : "-"}</p></div>
              <div><p className="text-[10px] text-slate-500">ASSISTS</p><p className="text-2xl font-bold text-sky-400">{data ? data.assists : "-"}</p></div>
            </div>


           {/* Phase 1 Input Section */}
<div className="space-y-4">
  <input 
    type="number" 
    className="w-full bg-slate-800 p-4 rounded-xl border border-slate-700 text-white outline-none focus:ring-2 focus:ring-sky-500" 
    placeholder="Your Initial Market Value (£M)" 
    value={guess}
    onChange={(e) => setGuess(e.target.value)} 
  />

  <button 
    onClick={fetchPlayerData} 
    disabled={!guess || guess <= 0} // Lock button if empty or 0
    className={`w-full py-4 rounded-xl font-black transition-all uppercase tracking-widest ${
      !guess || guess <= 0 
        ? 'bg-slate-700 text-slate-500 cursor-not-allowed' // Style for disabled
        : 'bg-sky-500 text-slate-950 hover:bg-sky-400 shadow-lg shadow-sky-500/20' // Style for active
    }`}
  >
    Proceed to Deep Analysis
  </button>
  
  {(!guess || guess <= 0) && (
    <p className="text-[10px] text-center text-slate-500 italic mt-2">
      Please enter a valuation to continue
    </p>
  )}
</div>
          </div>
        )}

        {/* PHASE 2: ADVANCED STATS & AI VALUE */}
        {phase === 2 && data && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 mb-6">
               <h2 className="text-5xl font-black mb-2">{data.name}</h2>
               <div className="flex gap-4 items-center">
                 <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-green-500/20">AI Valuation: £{data.market_value_m}M</span>
               </div>
               
               <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <h3 className="text-sky-400 font-bold uppercase text-xs mb-6 tracking-widest">Advanced Metrics (Percentiles)</h3>
                    {Object.entries(data.percentiles).map(([stat, val]) => (
                      <div key={stat} className="mb-4">
                        <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black mb-1">
                          <span>{stat.replace('_', ' ')}</span><span>{val}%</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-sky-500" style={{width: `${val}%`}}></div></div>
                      </div>
                    ))}
                 </div>
                 <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 flex flex-col justify-center text-center">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-4">Initial Intuition: £{guess}M</p>
                    <button onClick={() => setPhase(3)} className="bg-white text-slate-950 py-4 rounded-xl font-black uppercase tracking-widest text-sm">Review Final Verdict</button>
                 </div>
               </div>
            </div>
          </div>
        )}

        {/* PHASE 3: FINAL VERDICT */}
        {phase === 3 && (
          <div className="max-w-md mx-auto bg-slate-900 p-10 rounded-[2rem] border border-slate-800 text-center">
            <h2 className="text-xl font-bold mb-6">Final Assessment</h2>
            <p className="text-slate-400 text-sm mb-8">Having reviewed the basic stats, deep analytics, and AI valuation, what is your final bid?</p>
            <input type="number" className="w-full bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700 text-center text-2xl font-bold" 
                   placeholder="Final Value (£M)" onChange={(e) => setFinalBid(e.target.value)} />
            <button 
      onClick={submitResults} 
      disabled={!finalBid || finalBid <= 0}
      className={`w-full py-4 rounded-xl font-black transition-all ${
        !finalBid || finalBid <= 0
          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
          : 'bg-green-500 text-slate-950 hover:bg-green-400'
      }`}
    >
      SUBMIT EXPERIMENT DATA
    </button>
  </div>
)}

        {/* PHASE 4: SUCCESS */}
        {phase === 4 && (
          <div className="text-center p-20">
            <h2 className="text-4xl font-black text-sky-400 mb-4">THANK YOU</h2>
            <p className="text-slate-500">Your data has been successfully logged for the dissertation study.</p>
            <button onClick={() => window.location.reload()} className="mt-8 underline text-xs">Test New Subject</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Participant;