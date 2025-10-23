import React from 'react';
import type { Movie } from './MovieContext';

interface MovieModalProps {
  movie: Movie | null;
  onClose: () => void;
}

const MovieModal: React.FC<MovieModalProps> = ({ movie, onClose }) => {
  if (!movie) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-body">
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
            className="modal-poster"
          />
          <div className="modal-details">
            <h2>{movie.title}</h2>
            <p className="modal-release">Release Date: {movie.release_date}</p>
            <p className="modal-overview">{movie.overview || 'No overview available.'}</p>
            <div className="modal-stats">
              <span>Rating: {movie.vote_average}/10</span>
              <span>Votes: {movie.vote_count}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieModal;