import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const STAT_GLOSSARY = {
  "xg": { title: "Expected Goals", desc: "Measures shot quality. High xG suggests a player finds themselves in high-probability scoring positions." },
  "xag": { title: "Expected Assisted Goals", desc: "The xG resulting from a player's passes. Measures the quality of chances created for teammates." },
  "gls": { title: "Goals", desc: "Actual non-penalty goals scored. Comparing this to xG shows finishing efficiency." },
  "gca90": { title: "Goal Creating Actions", desc: "The two offensive actions directly leading to a goal. Measures decisive impact on the scoreline." },
  "kp": { title: "Key Passes", desc: "Passes that directly lead to a shot attempt. A primary indicator of creative vision." },
  "att_pen": { title: "Penalty Area Touches", desc: "Number of times a player touches the ball in the opponent's box. Measures 'threat' presence." },
  "prgc": { title: "Progressive Carries", desc: "Carries that move the ball towards the opponent's goal line by at least 10 yards. Measures ball-carrying drive." },
  "prgp": { title: "Progressive Passes", desc: "Completed passes that move the ball significantly closer to the goal. Measures vertical playmaking." },
  "prgdist": { title: "Progressive Distance", desc: "Total yards gained toward the goal via passes or carries." },
  "succ%": { title: "Dribble Success %", desc: "Percentage of successful take-ons." },
  "cmp%": { title: "Pass Completion %", desc: "Percentage of passes completed." },
  "mis": { title: "Miscontrols", desc: "Number of times a player failed to control the ball." },
  "dis": { title: "Dispossessed", desc: "Number of times a player lost the ball to an opponent's tackle." },
  "tkl%": { title: "Tackle Success %", desc: "Percentage of dribblers tackled." },
  "int": { title: "Interceptions", desc: "Number of times a player cut out an opponent's pass." },
  "recov": { title: "Ball Recoveries", desc: "Number of loose balls picked up." },
  "blocks": { title: "Blocks", desc: "Number of times a player blocked an opponent's pass or shot." },
  "tkl+int": { title: "Tackles + Interceptions", desc: "The combined defensive output." },
  "clr": { title: "Clearances", desc: "Actions taken to move the ball away from the danger zone." },
  "att_3rd": { title: "Attacking 1/3 Press", desc: "Defensive actions taken in the opponent's territory." },
  "won%": { title: "Aerial Duel Win %", desc: "Percentage of headed duels won." }
};

function Participant() {
  const { testId } = useParams();
  const [cohort, setCohort] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [player, setPlayer] = useState("");
  const [guess, setGuess] = useState("");
  const [finalBid, setFinalBid] = useState("");
  const [data, setData] = useState(null);
  const [phase, setPhase] = useState(1);
  const [sessionId] = useState(`USER-${Date.now()}`);
  const [timeLeft, setTimeLeft] = useState(30);
  const [activeNote, setActiveNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  console.log("Current Cohort:", cohort, "Current Player:", player);


  useEffect(() => {
    const loadSession = async () => {
      // If there is a testId in the URL, load that specific test
      if (testId) {
        try {
          const res = await fetch(`http://localhost:5000/api/get-test/${testId}`);
          const result = await res.json();
          setCohort(result.player_names);
          setPlayer(result.player_names[0]);
        } catch (err) { console.error("Test load failed", err); }
      }
      // Otherwise, it's the standard mode
      else {
        const defaults = ["Cole Palmer", "Morgan Rogers", "Bruno Fernandes", "Florian Wirtz"];
        setCohort(defaults);
        setPlayer(defaults[0]);
      }
    };
    loadSession();
  }, [testId]);

  // --- 2. FETCH PLAYER STATS ---
  useEffect(() => {
    if (!player) return;
    fetch(`http://localhost:5000/api/evaluate?name=${player}`)
      .then(res => res.json())
      .then(result => setData(result))
      .catch(err => console.error(err));
  }, [player]);

  // --- 3. SUBMIT & LOOP LOGIC ---
  const submitResults = async (isTimeout = false) => {
    const bidToSave = finalBid || guess;
    await fetch('http://localhost:5000/api/save_result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        player: data.name,
        initial_guess: guess,
        ai_value: data.market_value_m,
        final_bid: bidToSave,
        test_id: testId || "STANDARD",
        time_out: isTimeout ? 1 : 0
      })
    });

    if (currentIndex + 1 < cohort.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setPlayer(cohort[nextIdx]);
      setGuess("");
      setFinalBid("");
      setPhase(1);
      setTimeLeft(30);
    } else {
      setPhase(4);
    }
  };

  // --- TIMER & SCOUT NOTES ---
  useEffect(() => {
    if (phase === 3) {
      if (timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setTimeout(() => submitResults(true), 2000);
      }
    }
  }, [phase, timeLeft]);

  useEffect(() => {
  if (phase === 3 && data?.scout_note?.length > 0) {
    let lastIndex = -1;

    const showNextNote = () => {
      let nextIndex;
      // Ensure we don't show the same note twice consecutively
      do {
        nextIndex = Math.floor(Math.random() * data.scout_note.length);
      } while (nextIndex === lastIndex && data.scout_note.length > 1);

      lastIndex = nextIndex;
      setActiveNote(data.scout_note[nextIndex]);
      setShowNote(true);

      // Display for 4 seconds, then fade out
      setTimeout(() => setShowNote(false), 4000);
    };

    showNextNote(); // Show first note immediately
    const interval = setInterval(showNextNote, 6000);

    return () => clearInterval(interval);
  }
}, [phase, data]);

  // --- TOOLTIP COMPONENT ---
  const StatTooltip = ({ label, originaLkEY }) => {
    const info = STAT_GLOSSARY[label.toLowerCase()] || { title: label, desc: "Performance metric." };
    return (
      <div className="group relative inline-block cursor-help">
        <span className="border-b border-dotted border-slate-700 group-hover:text-sky-400">{label}</span>
        <div className="absolute bottom-full left-0 mb-2 w-48 p-3 bg-slate-950 border border-sky-500/40 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-50 pointer-events-none">
          <p className="text-sky-400 font-black text-[9px] uppercase">{info.title}</p>
          <p className="text-slate-300 text-[10px] italic">"{info.desc}"</p>
        </div>
      </div>
    );
  };

  const PercentileTooltip = ({ percentage, rawValue, statLabel }) => {
    return (
      <div className="group relative inline-block cursor-help">
        {/* The Percentage Display */}
        <span className="text-sky-400 font-black group-hover:text-white transition-colors">
          {(percentage * 100).toFixed(0)}%
        </span>

        {/* The Pop-up Box */}
        <div className="absolute bottom-full right-0 mb-2 w-56 p-3 bg-slate-950 border border-sky-500/40 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-50 pointer-events-none shadow-2xl">
          <p className="text-slate-500 font-black text-[9px] uppercase mb-1">Contextual Rank</p>
          <p className="text-white text-[11px] leading-tight mb-2">
            This player ranks in the <span className="text-sky-400 font-bold">{(percentage * 100).toFixed(0)}th percentile</span> for {statLabel}.
          </p>

          {rawValue && (
            <div className="pt-2 border-t border-slate-800">
              <p className="text-slate-500 text-[9px] uppercase">Raw Statistic</p>
              <p className="text-sky-400 font-mono text-xs">{rawValue}</p>
            </div>
          )}

          <p className="mt-2 text-[8px] text-slate-600 italic">
            *Compared against all Active Midfielders (MF) in the 25/26 Season.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-12">
      <div className="max-w-4xl mx-auto">

        {/* PROGRESS BAR */}
        {phase < 4 && (
          <div className="mb-8 flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Player {currentIndex + 1} of {cohort.length}</span>
            <div className="flex gap-1">
              {cohort.map((_, i) => (
                <div key={i} className={`h-1 w-8 rounded-full ${i <= currentIndex ? 'bg-sky-500 shadow-[0_0_10px_#0ea5e9]' : 'bg-slate-800'}`}></div>
              ))}
            </div>
          </div>
        )}

        {phase === 1 && (
          <div className="bg-slate-900 p-10 rounded-[2rem] border border-slate-800 shadow-2xl animate-in fade-in zoom-in">
            <div className="flex flex-col md:flex-row gap-10 items-center">
              {/* PLAYER PHOTO */}
              <div className="w-48 h-48 rounded-3xl bg-slate-800 overflow-hidden border-2 border-slate-700 shadow-2xl shrink-0">
                <img
                  src={`/players/${player}.jpg`}
                  alt={player}
                  className="w-full h-full object-cover"
                  onError={(e) => e.target.src = "https://via.placeholder.com/200?text=No+Photo"}
                />
              </div>

              <div className="flex-grow w-full">
                <h2 className="text-sky-400 font-black uppercase text-xs mb-2 tracking-widest">Phase 1: Identification</h2>
                <h1 className="text-4xl font-black mb-6">{player}</h1>

                <div className="grid grid-cols-3 gap-4 mb-8 bg-slate-950 p-6 rounded-2xl">
                  <div><p className="text-[10px] text-slate-500 uppercase">Games</p><p className="text-2xl font-bold">{data?.matches || "-"}</p></div>
                  <div><p className="text-[10px] text-slate-500 uppercase">Goals</p><p className="text-2xl font-bold text-green-400">{data?.goals || "0"}</p></div>
                  <div><p className="text-[10px] text-slate-500 uppercase">Assists</p><p className="text-2xl font-bold text-sky-400">{data?.assists || "0"}</p></div>
                </div>

                <input
                  type="number"
                  className="w-full bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Initial Market Value (£M)"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                />
                <button
                  onClick={() => setPhase(2)}
                  disabled={!guess}
                  className="w-full py-4 bg-sky-500 text-slate-950 rounded-xl font-black uppercase tracking-widest disabled:opacity-30"
                >
                  Proceed to Analysis
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === 2 && data && (
          <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-5xl font-black">{data.name}</h2>
                <p className="text-sky-400 font-bold uppercase tracking-widest text-sm mt-2">{data.position} | {data.squad}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-black uppercase">AI Calculated Value</p>
                <p className="text-4xl font-black text-green-400">£{data.market_value_m}M</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xs font-black text-slate-500 uppercase mb-6 tracking-widest">Performance Percentiles</h3>
                {Object.entries(data.percentiles).map(([stat, val]) => (
                  <div key={stat} className="mb-5">
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      {/* 1. Stat Name Tooltip (Left Side) */}
                      <StatTooltip label={stat} />

                      {/* 2. Percentile Tooltip (Right Side) */}
                      <PercentileTooltip
                        percentage={val / 100} // Convert 85 back to 0.85 for the logic
                        rawValue={data.raw_stats ? data.raw_stats[stat] : null}
                        statLabel={STAT_GLOSSARY[stat.toLowerCase()]?.title || stat}
                      />
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500 transition-all duration-700"
                        style={{ width: `${val}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col justify-center bg-slate-950 p-8 rounded-3xl border border-slate-800">
                <p className="text-center text-xs text-slate-500 mb-6">Your initial intuition was <span className="text-white font-bold">£{guess}M</span>. Review the AI's data before your final verdict.</p>
                <button onClick={() => setPhase(3)} className="w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest hover:bg-sky-400 transition-colors">Review Final Verdict</button>
              </div>
            </div>
          </div>
        )}

        {phase === 3 && (
  /* 1. We wrap Phase 3 in a relative container to position the floating note against the whole screen/area */
  <div className="relative w-full">
    
    {/* THE DECISION CARD */}
    <div className="max-w-md mx-auto bg-slate-900 p-10 rounded-[2rem] border border-slate-800 text-center relative shadow-2xl">
      {timeLeft === 0 && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center text-white font-black uppercase">
          Time Expired - Saving...
        </div>
      )}

      <div className="mb-8">
        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Decision Window</div>
        <div className={`text-3xl font-mono font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
          00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
        </div>
      </div>

      <div className="bg-slate-950 p-6 rounded-2xl mb-8 border border-slate-800">
        <p className="text-[10px] text-slate-500 font-black mb-1 uppercase">AI Recommended Price</p>
        <p className="text-4xl font-black text-green-400">£{data?.market_value_m}M</p>
      </div>

      <input
        type="number"
        className="w-full bg-slate-800 p-5 rounded-xl text-center text-3xl font-black mb-6 border border-slate-700 outline-none focus:border-sky-500"
        placeholder="Final £M"
        value={finalBid}
        onChange={(e) => setFinalBid(e.target.value)}
      />

      <button 
        onClick={submitResults} 
        disabled={!finalBid} 
        className="w-full py-5 bg-green-500 text-black rounded-xl font-black uppercase tracking-widest disabled:opacity-20"
      >
        Submit Final Bid
      </button>
    </div>

    {/* 2. FLOATING SCOUT NOTE - Repositioned to the top-right of the card */}
<div className={`absolute top-24 -right-16 w-72 transition-all duration-700 ease-in-out transform z-[60]
  ${showNote ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-90'}`}>
      
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-600 to-blue-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        
        <div className="relative bg-slate-900/95 backdrop-blur-xl border border-sky-500/30 text-sky-100 p-5 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-sky-500/20">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-sky-400">
                Scout's Note
              </span>
            </div>
            <span className="text-[8px] font-mono text-sky-600">INTEL-V2</span>
          </div>

          <p className="text-[12px] leading-relaxed font-medium italic text-slate-200">
            <span className="text-sky-500 font-mono mr-1">{">"}</span>
            {activeNote}
          </p>

          <div className="mt-4 flex gap-1.5">
            <div className="h-1 w-12 bg-sky-500/20 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 animate-pulse w-2/3"></div>
            </div>
            <div className="h-1 w-2 bg-sky-500/20 rounded-full"></div>
            <div className="h-1 w-2 bg-sky-500/20 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

        {phase === 4 && (
          <div className="text-center py-20 animate-in fade-in">
            <div className="text-6xl mb-6">🎯</div>
            <h2 className="text-5xl font-black text-sky-400 mb-4 italic">SESSION COMPLETE</h2>
            <p className="text-slate-500 max-w-sm mx-auto">Your evaluations have been successfully logged. Your contribution helps us understand human-AI interaction in high-stakes markets.</p>
            <button onClick={() => window.location.href = '/'} className="mt-10 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white underline decoration-sky-500 underline-offset-8 transition-all">Return to Terminal</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Participant;