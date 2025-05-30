import React from 'react';
import ExerciseCell from './ExerciseCell';
import { calculateTargetValue } from '../data/exercises';

const BingoCard = ({ cardLayout, completedCells, level, onCellToggle }) => {
  return (
    <div className="bingo-card">
      {cardLayout.map((exercise, index) => {
        const targetValue = calculateTargetValue(exercise.baseValue, level);
        const isCompleted = completedCells[index];
        
        return (
          <ExerciseCell
            key={index}
            exercise={exercise}
            targetValue={targetValue}
            isCompleted={isCompleted}
            onToggle={() => onCellToggle(index)}
            position={index}
          />
        );
      })}
    </div>
  );
};

export default BingoCard;