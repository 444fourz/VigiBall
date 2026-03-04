import React, { useState } from 'react';

const PLAYERS = ["Cole Palmer", "Martin Odegaard", "William Saliba", "Mohamed Salah", "Kobbie Mainoo", "Antony", "Bryan Mbeumo", "Evan Ferguson", "Erling Haaland", "Chris Wood"];

function App() {
  const [player, setPlayer] = useState(PLAYERS[0]);
  const [guess, setGuess] = useState("");
  const [finalBid, setFinalBid] = useState("");
  const [data, setData] = useState(null);
  const [phase, setPhase] = useState(1); // 1: Guess, 2: Reveal, 3: Success

  const startAnalysis = async () => {
    const res = await fetch(`http://localhost:5000/api/evaluate?name=${player}`);
    const result = await res.json();
    setData(result);
    setPhase(2);
  };

  const submitFinalVerdict = async () => {
    const payload = {
        player: data.name,
        initial_guess: guess,
        ai_value: data.market_value_m,
        final_bid: finalBid,
        p_score: data.p_score
    };

    try {
        const response = await fetch('http://localhost:5000/api/save_result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            setPhase(3); // Move to the "Thank You" screen
        }
    } catch (error) {
        console.error("Error saving result:", error);
        alert("System Error: Could not save results to the database.");
    }
};

  return (
    <div className="min-h-screen bg-[#020617] text-white p-12 flex flex-col items-center">
      
      {/* PHASE 1: THE ANCHORING GUESS */}
      {phase === 1 && (
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-10 rounded-3xl shadow-2xl">
          <h2 className="text-xl font-bold mb-6 text-sky-400 uppercase tracking-widest">Phase 1: Human Intuition</h2>
          <div className="space-y-4">
            <select className="w-full bg-slate-800 p-4 rounded-xl border border-slate-700 text-white"
                    onChange={(e) => setPlayer(e.target.value)}>
              {PLAYERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input type="number" className="w-full bg-slate-800 p-4 rounded-xl border border-slate-700 text-white"
                   placeholder="Your Valuation Estimate (£M)" onChange={(e) => setGuess(e.target.value)} />
            <button onClick={startAnalysis} disabled={!guess}
                    className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-4 rounded-xl transition-all">
              REVEAL AI ANALYSIS
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2: THE AI REVEAL & FINAL VERDICT */}
      {phase === 2 && data && (
        <div className="max-w-5xl w-full animate-in fade-in zoom-in duration-500">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] mb-6 flex justify-between items-center">
            <div>
              <p className="text-sky-400 font-bold text-xs uppercase tracking-widest mb-1">AI Calculation Complete</p>
              <h2 className="text-5xl font-black">{data.name}</h2>
              <p className="text-slate-400 text-xl mt-1">{data.squad} • Age {data.age}</p>
            </div>
            <div className="text-right bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <p className="text-[10px] text-slate-500 font-black uppercase">AI Market Value</p>
              <div className="text-5xl font-black text-green-400 tracking-tighter">£{data.market_value_m}M</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
              <h3 className="text-sky-400 font-bold uppercase text-xs mb-6">Performance Profile</h3>
              {Object.entries(data.percentiles).map(([stat, val]) => (
                <div key={stat} className="mb-4">
                  <div className="flex justify-between text-[10px] uppercase text-slate-500 mb-1">
                    <span>{stat.replace('_', ' ')}</span>
                    <span>{val}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500" style={{ width: `${val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col justify-center">
              <h3 className="text-sky-400 font-bold uppercase text-xs mb-4">Final Decision</h3>
              <p className="text-sm text-slate-400 mb-6">Based on the AI's data, what is your <strong>Final Market Valuation</strong> for this player?</p>
              <input type="number" className="w-full bg-slate-800 p-4 rounded-xl border border-slate-700 text-white mb-4"
                     placeholder="Your Final Valuation (£M)" onChange={(e) => setFinalBid(e.target.value)} />
              <button onClick={submitFinalVerdict} disabled={!finalBid}
                      className="w-full bg-green-500 hover:bg-green-400 text-slate-950 font-black py-4 rounded-xl transition-all uppercase">
                Submit Final Verdict
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3: THANK YOU / SUCCESS */}
      {phase === 3 && (
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-10 rounded-3xl text-center shadow-2xl">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-2xl font-bold mb-4">Data Recorded</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Your initial guess was <strong>£{guess}M</strong>.<br/>
            Your final decision was <strong>£{finalBid}M</strong>.<br/>
            The AI valuation was <strong>£{data.market_value_m}M</strong>.
          </p>
          <button onClick={() => {setPhase(1); setData(null); setGuess(""); setFinalBid("");}}
                  className="text-sky-400 font-bold uppercase tracking-widest text-xs hover:underline">
            Test Another Player
          </button>
        </div>
      )}
    </div>
  );
}

export default App;