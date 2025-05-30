import React from 'react';

const ExerciseCell = ({ exercise, targetValue, isCompleted, onToggle, position }) => {
  return (
    <div 
      className={`exercise-cell ${isCompleted ? 'completed' : ''}`}
      onClick={onToggle}
      data-position={position}
    >
      <div className="exercise-name">{exercise.name}</div>
      <div className="exercise-target">
        {targetValue} {exercise.unit}
      </div>
    </div>
  );
};

export default ExerciseCell;