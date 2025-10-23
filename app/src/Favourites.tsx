import React from "react";
import { useMovieContext } from "./MovieContext";
import MovieCard from "./MovieCard";

const Favourites: React.FC = () => {
  const { favourites } = useMovieContext();

  return (
    <div>
      <h1>My Favourites</h1>
      {favourites.length === 0
        ? <p>No favourite movies yet.</p>
        : (
          <div className="movie-grid">
            {favourites.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
    </div>
  );
};

export default Favourites;
