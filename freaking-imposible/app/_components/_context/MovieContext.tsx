import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
// Define Movie interface
export interface Movie {
  id: number;
  title: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genres?: { id: number; name: string }[];
}

interface MovieContextType {
  favourites: Movie[];
  addFavourite: (movie: Movie) => void;
  removeFavourite: (id: number) => void;
  isFavourite: (id: number) => boolean;
}

const MovieContext = createContext<MovieContextType | undefined>(undefined);
const STORAGE_KEY = "@freaking-imposible:favourites";

export const MovieProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favourites, setFavourites] = useState<Movie[]>([]);

  // Persist favourites using AsyncStorage (if available)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        const json = await AsyncStorage.default.getItem(STORAGE_KEY);
        if (json && mounted) setFavourites(JSON.parse(json));
      } catch (e) {
        console.warn("Error reading favourites from storage:", e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const addFavourite = async (movie: Movie) => {
    setFavourites((prev) => {
      if (prev.some((m) => m.id === movie.id)) return prev;
      const next = [...prev, movie];
      // Save to storage
      (async () => {
        try {
          const AsyncStorage = await import('@react-native-async-storage/async-storage');
          await AsyncStorage.default.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (e) {
          console.warn("Error saving favourites:", e);
        }
      })();
      return next;
    });
  };

  const removeFavourite = async (id: number) => {
    setFavourites((prev) => {
      const next = prev.filter((movie) => movie.id !== id);
      (async () => {
        try {
          const AsyncStorage = await import('@react-native-async-storage/async-storage');
          await AsyncStorage.default.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (e) {
          console.warn("Error saving favourites:", e);
        }
      })();
      return next;
    });
  };

  const isFavourite = (id: number) => favourites.some((movie) => movie.id === id);

  return (
    <MovieContext.Provider value={{ favourites, addFavourite, removeFavourite, isFavourite }}>
      {children}
    </MovieContext.Provider>
  );
};

export const useMovieContext = () => {
  const context = useContext(MovieContext);
  if (!context) {
    throw new Error("useMovieContext must be used within a MovieProvider");
  }
  return context;
};

export default function _MovieContextPlaceholder() { return null; }
