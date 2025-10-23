import React from "react";
import { useMovieContext } from "./MovieContext";
import type { Movie } from "./MovieContext";

interface MovieCardProps {
  movie: Movie;
  onClick?: () => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  const { addFavourite, removeFavourite, isFavourite } = useMovieContext();

  const handleFavourite = () => {
    if (isFavourite(movie.id)) {
      removeFavourite(movie.id);
    } else {
      addFavourite(movie);
    }
  };

  return (
    <div className="movie-card" onClick={onClick}>
      <img
        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
        alt={movie.title}
      />
      <h3>{movie.title}</h3>
      <p>{movie.release_date}</p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleFavourite();
        }}
      >
        {isFavourite(movie.id) ? "Remove from Favourites" : "Add to Favourites"}
      </button>
    </div>
  );
};

export default MovieCard;
