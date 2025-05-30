import React, { useState } from 'react';
import Modal from './Modal';

const ExerciseModal = ({ 
  isOpen, 
  onClose, 
  exercise, 
  targetValue, 
  onComplete 
}) => {
  const [actualValue, setActualValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = parseInt(actualValue, 10);
    if (!isNaN(value) && value > 0) {
      const isCompleted = value >= targetValue;
      onComplete(value, isCompleted);
      setActualValue('');
      onClose();
    }
  };

  const handleCancel = () => {
    setActualValue('');
    onClose();
  };

  if (!exercise) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleCancel}>
      <form onSubmit={handleSubmit} className="exercise-modal">
        <h2>{exercise.name}</h2>
        
        <div className="target-info">
          <span>目標値：</span>
          <strong>{targetValue} {exercise.unit}</strong>
        </div>

        <div className="input-group">
          <label htmlFor="actual-value">実行値：</label>
          <input
            id="actual-value"
            type="number"
            min="0"
            value={actualValue}
            onChange={(e) => setActualValue(e.target.value)}
            placeholder={`${exercise.unit}を入力`}
            autoFocus
            required
          />
          <span className="unit">{exercise.unit}</span>
        </div>

        <div className="button-group">
          <button type="submit" className="btn-primary">
            完了
          </button>
          <button type="button" onClick={handleCancel} className="btn-secondary">
            キャンセル
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ExerciseModal;