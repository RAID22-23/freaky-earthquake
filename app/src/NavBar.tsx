// Importaciones: React y Link de react-router-dom para navegación
import React from "react";
import { Link } from "react-router-dom";

// Componente funcional para la barra de navegación
const NavBar: React.FC = () => {
  // Renderiza la navegación con enlaces a Home y Favourites
  return (
    <nav>
      {/* Enlace a la página principal */}
      <Link to="/">Home</Link>
      {/* Enlace a la página de favoritos */}
      <Link to="/favourites">Favourites</Link>
    </nav>
  );
};

// Exporta el componente por defecto
export default NavBar;
