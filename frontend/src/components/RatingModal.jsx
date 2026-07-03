import { useState } from 'react';
import { Star } from 'lucide-react';
import api from '../services/api';

export default function RatingModal({ ride, onClose, onRated }) {
  const [score, setScore] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post(`/rides/${ride._id}/rate`, { score, feedback });
      onRated(data.ride);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Rate Your Ride</h3>
        <p className="text-sm text-gray-500 mb-4">
          How was your ride with {ride.driver?.name}?
        </p>

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setScore(n)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${n <= score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="label">Feedback (optional)</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your experience..."
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Skip
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
