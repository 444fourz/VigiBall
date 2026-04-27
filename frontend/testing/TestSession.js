import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Participant from '../src/Participant'; 
// Testing whether the participant list is loaded rather than generic values

function TestSession() {
    const { testId } = useParams();
    const [playerList, setPlayerList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTestDetails = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/get-test/${testId}`);
                const data = await res.json();
                setPlayerList(data.players);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load test session", err);
            }
        };
        fetchTestDetails();
    }, [testId]);

    if (loading) return <div className="text-white text-center mt-20">Initializing Session...</div>;

    return <Participant predefinedPlayers={playerList} isTestSession={true} />;
}

export default TestSession;