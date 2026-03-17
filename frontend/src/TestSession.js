import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Participant from './Participant'; // Your existing main component

function TestSession() {
    const { testId } = useParams();
    const [playerList, setPlayerList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTestDetails = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/get-test/${testId}`);
                const data = await res.json();
                setPlayerList(data.players); // This is your ["Haaland", "Saka"] list
                setLoading(false);
            } catch (err) {
                console.error("Failed to load test session", err);
            }
        };
        fetchTestDetails();
    }, [testId]);

    if (loading) return <div className="text-white text-center mt-20">Initializing Session...</div>;

    // Pass the specific player list to your existing Participant component
    // You might need to adjust Participant.js to accept a 'predefinedPlayers' prop
    return <Participant predefinedPlayers={playerList} isTestSession={true} />;
}

export default TestSession;