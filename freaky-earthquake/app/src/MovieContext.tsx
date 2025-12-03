// Importaciones necesarias de React para crear el contexto y manejar el estado
import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// Interfaz que define la estructura de una película
export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
}

// Interfaz que define los tipos del contexto de películas
interface MovieContextType {
  favourites: Movie[];
  addFavourite: (movie: Movie) => void;
  removeFavourite: (id: number) => void;
  isFavourite: (id: number) => boolean;
}

// Creación del contexto de películas, inicializado como undefined
const MovieContext = createContext<MovieContextType | undefined>(undefined);

// Componente proveedor del contexto de películas
export const MovieProvider: React.FC<{ children: ReactNode }> = (
  { children },
) => {
  // Estado para almacenar la lista de películas favoritas
  const [favourites, setFavourites] = useState<Movie[]>([]);

  // Función para agregar una película a favoritos
  const addFavourite = (movie: Movie) => {
    setFavourites((prev) => [...prev, movie]);
  };

  // Función para remover una película de favoritos por su ID
  const removeFavourite = (id: number) => {
    setFavourites((prev) => prev.filter((movie) => movie.id !== id));
  };

  // Función para verificar si una película es favorita por su ID
  const isFavourite = (id: number) => {
    return favourites.some((movie) => movie.id === id);
  };

  // Renderiza el proveedor del contexto con el valor definido
  return (
    <MovieContext.Provider
      value={{ favourites, addFavourite, removeFavourite, isFavourite }}
    >
      {children}
    </MovieContext.Provider>
  );
};

// Hook personalizado para usar el contexto de películas
export const useMovieContext = () => {
  // Obtiene el contexto actual
  const context = useContext(MovieContext);
  // Lanza un error si no se usa dentro de un MovieProvider
  if (!context) {
    throw new Error("useMovieContext must be used within a MovieProvider");
  }
  // Retorna el contexto
  return context;
};
