import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MovieCard from './MovieCard';
import type { Movie } from './MovieContext';

// const API_KEY = ''; // Replace with your TMDB API key
const API_KEY = import.meta.env.VITE_APP_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

const Home: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchMovies = async (query: string = '') => {
    setLoading(true);
    try {
      const endpoint = query
        ? `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}`
        : `${BASE_URL}/movie/popular?api_key=${API_KEY}`;
      const response = await axios.get(endpoint);
      setMovies(response.data.results);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMovies(searchQuery);
  };

  return (
    <div>
      <h1>Movie App</h1>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for movies..."
        />
        <button type="submit">Search</button>
      </form>
      {loading && <p>Loading...</p>}
      <div className="movie-grid">
        {movies.map(movie => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
};

export default Home;
