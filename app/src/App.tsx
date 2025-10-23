import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { MovieProvider } from "./MovieContext";
import NavBar from "./NavBar";
import Home from "./Home";
import Favourites from "./Favourites";
import "./App.css";

function App() {
  return (
    <MovieProvider>
      <Router>
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/favourites" element={<Favourites />} />
        </Routes>
      </Router>
    </MovieProvider>
  );
}

export default App;
