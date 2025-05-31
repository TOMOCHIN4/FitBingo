import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const PointsDisplay = ({ userId, battleId }) => {
  const [points, setPoints] = useState(0);
  const [previousPoints, setPreviousPoints] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (!userId || !battleId) return;

    const scoreRef = doc(db, 'battleScores', `${battleId}_${userId}`);
    const unsubscribe = onSnapshot(scoreRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const newPoints = data.totalPoints || 0;
        
        if (newPoints > previousPoints) {
          setShowAnimation(true);
          setTimeout(() => setShowAnimation(false), 1000);
        }
        
        setPreviousPoints(points);
        setPoints(newPoints);
      }
    });

    return () => unsubscribe();
  }, [userId, battleId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!battleId) return null;

  return (
    <div className={`points-display ${showAnimation ? 'animate' : ''}`}>
      <div className="points-label">🔥 バトルポイント 🔥</div>
      <div className="points-value">
        {points.toLocaleString()}
        <span className="points-unit">pt</span>
      </div>
      {showAnimation && (
        <div className="points-animation">
          +{points - previousPoints}
        </div>
      )}
    </div>
  );
};

export default PointsDisplay;