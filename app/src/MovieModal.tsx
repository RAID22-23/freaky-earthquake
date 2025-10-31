// Importaciones: React y tipos del contexto
import React from "react";
import type { Movie } from "./MovieContext";

// Interfaz para las props del componente MovieModal
interface MovieModalProps {
  movie: Movie | null; // La película a mostrar, puede ser null
  onClose: () => void; // Función para cerrar el modal
}

// Componente funcional para el modal de detalles de película
const MovieModal: React.FC<MovieModalProps> = ({ movie, onClose }) => {
  // Si no hay película, no renderiza nada
  if (!movie) return null;

  // Renderiza el modal
  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* Contenedor del modal con prevención de propagación de clics */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Botón para cerrar el modal */}
        <button className="modal-close" onClick={onClose}>×</button>
        {/* Cuerpo del modal */}
        <div className="modal-body">
          {/* Imagen del póster */}
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
            className="modal-poster"
          />
          {/* Detalles de la película */}
          <div className="modal-details">
            {/* Título */}
            <h2>{movie.title}</h2>
            {/* Fecha de lanzamiento */}
            <p className="modal-release">Release Date: {movie.release_date}</p>
            {/* Sinopsis */}
            <p className="modal-overview">
              {movie.overview || "No overview available."}
            </p>
            {/* Estadísticas: rating y votos */}
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

// Exporta el componente por defecto
export default MovieModal;
