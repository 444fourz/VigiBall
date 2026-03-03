import React, { useState } from 'react';

function App() {
  const [player, setPlayer] = useState("");
  const [userGuess, setUserGuess] = useState("");
  const [report, setReport] = useState(null);

  const fetchValuation = async () => {
    const response = await fetch(`http://localhost:5000/api/evaluate?name=${player}`);
    const data = await response.json();
    setReport(data);
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px' }}>
      <h1>VigiBall Alpha v1.0</h1>
      
      {/* PHASE 1: THE ANCHOR */}
      {!report && (
        <div>
          <input 
            placeholder="Enter Player (e.g. Cole Palmer)" 
            onChange={(e) => setPlayer(e.target.value)} 
          />
          <input 
            placeholder="Your Valuation (£m)" 
            onChange={(e) => setUserGuess(e.target.value)} 
          />
          <button onClick={fetchValuation}>Reveal AI Valuation</button>
        </div>
      )}

      {/* PHASE 2: THE REVEAL */}
      {report && (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
          <h2>{report.name} ({report.squad})</h2>
          <p>Age: {report.age} | Position: {report.position_group}</p>
          <hr />
          <h3 style={{ color: '#2ecc71' }}>VigiBall Value: £{report.market_value_m}m</h3>
          <p>P-Score: {report.p_score} / 10</p>
          
          <h4>Statistical Percentiles:</h4>
          {Object.entries(report.percentiles).map(([stat, val]) => (
            <div key={stat}>
              <strong>{stat.toUpperCase()}:</strong> {val}%
              <div style={{ width: '100%', background: '#eee', height: '10px' }}>
                <div style={{ width: `${val}%`, background: '#3498db', height: '10px' }} />
              </div>
            </div>
          ))}
          <button onClick={() => setReport(null)}>Next Player</button>
        </div>
      )}
    </div>
  );
}

export default App;