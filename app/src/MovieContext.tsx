import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
}

interface MovieContextType {
  favourites: Movie[];
  addFavourite: (movie: Movie) => void;
  removeFavourite: (id: number) => void;
  isFavourite: (id: number) => boolean;
}

const MovieContext = createContext<MovieContextType | undefined>(undefined);

export const MovieProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favourites, setFavourites] = useState<Movie[]>([]);

  const addFavourite = (movie: Movie) => {
    setFavourites(prev => [...prev, movie]);
  };

  const removeFavourite = (id: number) => {
    setFavourites(prev => prev.filter(movie => movie.id !== id));
  };

  const isFavourite = (id: number) => {
    return favourites.some(movie => movie.id === id);
  };

  return (
    <MovieContext.Provider value={{ favourites, addFavourite, removeFavourite, isFavourite }}>
      {children}
    </MovieContext.Provider>
  );
};

export const useMovieContext = () => {
  const context = useContext(MovieContext);
  if (!context) {
    throw new Error('useMovieContext must be used within a MovieProvider');
  }
  return context;
};
