/* eslint-disable import/extensions */
import { BrowserRouter } from "react-router-dom";
import BaseRoute from "./BaseRoute";
import "./output.css";

function App() {
  return (
    <>
      <BrowserRouter>
        <BaseRoute />
      </BrowserRouter>
    </>
  );
}

export default App;
