import React, { useState, useEffect } from 'react'; // Added useEffect to imports

const PLAYERS = ["Cole Palmer", "Martin Ødegaard", "William Saliba", "Mohamed Salah", "Kobbie Mainoo", "Antony", "Bryan Mbeumo", "Bukayo Saka", "Erling Haaland", "Chris Wood"];

function Participant() {
  const [player, setPlayer] = useState(PLAYERS[0]);
  const [guess, setGuess] = useState("");
  const [finalBid, setFinalBid] = useState("");
  const [data, setData] = useState(null);
  const [phase, setPhase] = useState(1);

  useEffect(() => {
    const fetchBasicStats = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/evaluate?name=${player}`);
        const result = await res.json();
        setData(result); 
      } catch (err) {
        console.error("Error fetching preview stats:", err);
      }
    };

    fetchBasicStats();
  }, [player]);

  const fetchPlayerData = async () => {
    const res = await fetch(`http://localhost:5000/api/evaluate?name=${player}`);
    const result = await res.json();
    setData(result);
    setPhase(2);
  };

  const submitResults = async () => {
    const bidToSave = finalBid || guess;
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
    setPhase(4); 
  };

  const [timeLeft, setTimeLeft] = useState(30); // 30-second countdown
useEffect(() => {
  if (phase === 3) {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // 1. Timer hit zero - the overlay appears automatically
      // 2. Wait 2 seconds so they can read the "Time Expired" message
      const autoSubmitTimer = setTimeout(() => {
        submitResults();
      }, 2000);
      
      return () => clearTimeout(autoSubmitTimer);
    }
  }
}, [phase, timeLeft]);

  const [activeNote, setActiveNote] = useState("");
const [showNote, setShowNote] = useState(false);

// Logic to show random popups in Phase 3
useEffect(() => {
  if (phase === 3 && data?.scout_note) {
    const triggerPopup = () => {
      // Pick a random insight from the list
      const randomMsg = data.scout_note[Math.floor(Math.random() * data.scout_note.length)];
      setActiveNote(randomMsg);
      setShowNote(true);

      // Hide it after 3 seconds
      setTimeout(() => setShowNote(false), 3000);

      // Schedule the next one at a random interval (4-8 seconds)
      const nextInterval = Math.floor(Math.random() * 4000) + 2000;
      return setTimeout(triggerPopup, nextInterval);
    };

    const timer = triggerPopup();
    return () => clearTimeout(timer);
  }
}, [phase, data]);

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
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                  Subject Profile
                </span>
                {/* DISPLAY AGE AND POSITION IN PHASE 1 */}
                {data && (
                  <div className="flex gap-2">
                    <span className="text-[10px] text-sky-400 uppercase font-bold bg-sky-500/10 px-2 py-1 rounded border border-sky-500/20">
                      {data.position}
                    </span>
                    <span className="text-[10px] text-sky-400 uppercase font-bold bg-sky-500/10 px-2 py-1 rounded border border-sky-500/20">
                      Age: {data.age}
                    </span>
                  </div>
                )}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8 text-center bg-slate-950 p-6 rounded-2xl">
              <div><p className="text-[10px] text-slate-500">GAMES</p><p className="text-2xl font-bold">{data ? data.matches : "-"}</p></div>
              <div><p className="text-[10px] text-slate-500">GOALS</p><p className="text-2xl font-bold text-green-400">{data ? data.goals : "-"}</p></div>
              <div><p className="text-[10px] text-slate-500">ASSISTS</p><p className="text-2xl font-bold text-sky-400">{data ? data.assists : "-"}</p></div>
            </div>

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
                disabled={!guess || guess <= 0} 
                className={`w-full py-4 rounded-xl font-black transition-all uppercase tracking-widest ${
                  !guess || guess <= 0 
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                    : 'bg-sky-500 text-slate-950 hover:bg-sky-400 shadow-lg shadow-sky-500/20' 
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
               
               {/* DISPLAY AGE AND POSITION IN PHASE 2 */}
               <p className="text-sky-400 font-bold uppercase tracking-widest text-sm mb-6">
                  {data.position} | Age: {data.age} | {data.squad}
               </p>

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
  <div className="max-w-md mx-auto relative bg-slate-900 p-10 rounded-[2rem] border border-slate-800 text-center shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden">
    
    {/* TIME EXPIRED OVERLAY: Appears only when timeLeft is 0 */}
    {timeLeft === 0 && (
      <div className="absolute inset-0 z-50 flex items-center justify-center">
        {/* Blurred Backdrop */}
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></div>
        
        {/* Message Content */}
        <div className="relative z-10 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tighter">Time Expired</h2>
          <p className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase">
            Finalizing Bid...
          </p>
        </div>
      </div>
    )}

    {/* PHASE 3: TIMER DISPLAY */}
    <div className="absolute top-6 left-6 flex flex-col items-center">
      <div className={`text-[9px] font-black mb-1 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-slate-500 uppercase tracking-widest'}`}>
        Decision Window
      </div>
      <div className={`text-2xl font-mono font-black ${timeLeft <= 10 ? 'text-red-500' : 'text-white'}`}>
        00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
      </div>
    </div>
    
    {/* EXTERNAL SCOUT'S NOTE: Positioned outside to the right */}
    <div className={`absolute top-0 -right-52 w-48 transition-all duration-1000 transform hidden md:block ${
      showNote ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
    }`}>
      <div className="bg-[#0f172a] border border-sky-500/40 p-4 rounded-2xl shadow-2xl text-left relative">
        <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2">
          <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse"></div>
          <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest">
            Scout's Note
          </span>
        </div>
        <p className="text-slate-300 font-medium text-[10px] leading-relaxed italic">
          "{activeNote}"
        </p>
        <div className="absolute top-8 -left-4 w-4 h-[1px] bg-sky-500/30"></div>
      </div>
    </div>

    <h2 className="text-xl font-bold mb-6 italic text-slate-400">Final Assessment</h2>

    <div className="bg-slate-950 p-6 rounded-2xl mb-8 border border-slate-800/50 text-center">
        <p className="text-[10px] text-slate-500 uppercase font-black mb-1">AI Calculated Market Value</p>
        <p className="text-3xl font-black text-green-400">£{data?.market_value_m}M</p>
    </div>

    <input 
      type="number" 
      className="w-full bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700 text-center text-2xl font-bold focus:ring-2 focus:ring-sky-500 outline-none" 
      placeholder="Final Value (£M)" 
      value={finalBid} 
      onChange={(e) => setFinalBid(e.target.value)} 
    />

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