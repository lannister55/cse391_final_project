import React from 'react';

const StarRating = ({ rating, onRate, interactive = false, size = 'text-2xl' }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex gap-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onRate(star)}
          disabled={!interactive}
          className={`transition ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} ${
            star <= rating ? 'text-yellow-400' : 'text-gray-300'
          } ${size}`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

export default StarRating;