// Importaciones: React y tipos del contexto
import React from "react";
import { useMovieContext } from "./MovieContext";
import type { Movie } from "./MovieContext";

// Interfaz para las props del componente MovieCard
interface MovieCardProps {
  movie: Movie; // La película a mostrar
  onClick?: () => void; // Función opcional para manejar clics
}

// Componente funcional para representar una tarjeta de película
const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  // Obtiene funciones del contexto para manejar favoritos
  const { addFavourite, removeFavourite, isFavourite } = useMovieContext();

  // Manejador para agregar o remover de favoritos
  const handleFavourite = () => {
    if (isFavourite(movie.id)) {
      removeFavourite(movie.id); // Remueve si ya es favorita
    } else {
      addFavourite(movie); // Agrega si no lo es
    }
  };

  // Renderiza la tarjeta de película
  return (
    <div className="movie-card" onClick={onClick} data-movie-id={movie.id}>
      {/* Imagen del póster */}
      <img
        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
        alt={movie.title}
      />
      {/* Título de la película */}
      <h3>{movie.title}</h3>
      {/* Fecha de lanzamiento */}
      <p>{movie.release_date}</p>
      {/* Botón para agregar/remover de favoritos */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Previene que se propague el clic al contenedor
          handleFavourite(); // Ejecuta la función de favorito
        }}
      >
        {/* Texto del botón según si es favorita o no */}
        {isFavourite(movie.id) ? "Remove from Favourites" : "Add to Favourites"}
      </button>
    </div>
  );
};

// Exporta el componente por defecto
export default MovieCard;
