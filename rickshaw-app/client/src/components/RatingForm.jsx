import { useState } from 'react';
import api from '../services/api';
import StarRating from './StarRating';

const RatingForm = ({ tripId, driverId, onRatingSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      await api.post('/ratings', {
        tripId,
        rating,
        review: review.trim(),
      });
      
      setSuccess(true);
      setReview('');
      setRating(0);
      
      // Notify parent component
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl px-6 py-4 text-center">
        <p className="text-lg font-bold mb-1">✅ Rating Submitted!</p>
        <p className="text-sm">Thank you for your feedback.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <h2 className="text-lg font-bold text-gray-800">Rate Your Trip</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How was your experience?
          </label>
          <div className="flex justify-center">
            <StarRating 
              rating={rating} 
              onRate={setRating} 
              interactive={true}
              size="text-4xl"
            />
          </div>
          {rating > 0 && (
            <p className="text-center text-sm text-gray-600 mt-1">
              {rating} star{rating !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Review <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your experience with this driver..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 transition resize-none"
            maxLength={500}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {review.length}/500
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl shadow-md transition"
        >
          {submitting ? 'Submitting...' : 'Submit Rating'}
        </button>
      </form>
    </div>
  );
};

export default RatingForm;