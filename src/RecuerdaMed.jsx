import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import Med from "./Med";
import CardTemplate from "./CardTemplate";
import BotonModoOscuro from "./BotonModoOscuro";
import Citas from "./Citas";
import Estudios from "./Estudios";

const RecuerdaMed = ({ session, modoOscuro, setModoOscuro }) => {
  const [vista, setVista] = useState("inicio");

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div
      className={`min-h-screen p-6 md:p-12 font-sans transition-colors duration-300 ${
        modoOscuro ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"
      }`}
    >
      <BotonModoOscuro modoOscuro={modoOscuro} setModoOscuro={setModoOscuro} />

      <header
        className={`mb-8 flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-6 transition-colors ${modoOscuro ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="text-center md:text-left">
          <h1
            className={`text-4xl font-extrabold tracking-tight transition-colors ${modoOscuro ? "text-white" : "text-gray-900"}`}
          >
            RecuerdaMed
          </h1>
          <p
            className={`mt-2 text-lg transition-colors ${modoOscuro ? "text-gray-300" : "text-gray-600"}`}
          >
            {session.user.email}
          </p>
        </div>
        <button
          onClick={cerrarSesion}
          className={`py-2 px-6 font-bold rounded-lg transition-colors cursor-pointer ${modoOscuro ? "bg-gray-800 hover:bg-gray-700 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}
        >
          Cerrar Sesión
        </button>
      </header>

      {vista === "inicio" && (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto mt-8 space-y-8 fade-in">
          <h2
            className={`text-3xl font-extrabold transition-colors ${modoOscuro ? "text-white" : "text-gray-800"}`}
          >
            ¿Qué deseas gestionar hoy?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            <CardTemplate
              imagen="https://static.vecteezy.com/system/resources/previews/017/257/838/non_2x/cute-medicine-cartoon-free-png.png"
              titulo="Medicamentos"
              descripcion="Gestiona tus tomas y recibe recordatorios."
              textoBoton="Abrir registro"
              alHacerClic={() => setVista("med")}
              modoOscuro={modoOscuro}
            />
            <CardTemplate
              imagen="https://png.pngtree.com/png-clipart/20220103/big/pngtree-cartoon-hand-drawn-stethoscope-illustration-png-image_7011513.png"
              titulo="Próximas Citas"
              descripcion="Organiza tus visitas al médico y especialistas."
              textoBoton="Ver Citas"
              alHacerClic={() => setVista("citas")}
              modoOscuro={modoOscuro}
            />
            <CardTemplate
              imagen="https://cdn-icons-png.flaticon.com/512/337/337946.png"
              titulo="Estudios Médicos"
              descripcion="Guarda imágenes, análisis, resultados y documentos PDF."
              textoBoton="Ver estudios"
              alHacerClic={() => setVista("estudios")}
              modoOscuro={modoOscuro}
            />
          </div>
        </div>
      )}

      {vista === "med" && (
        <div className="fade-in">
          <button
            onClick={() => setVista("inicio")}
            className={`mb-6 text-sm font-bold underline transition-colors cursor-pointer ${modoOscuro ? "text-green-400 hover:text-green-300" : "text-green-700 hover:text-green-800"}`}
          >
            Volver al menú principal
          </button>
          <Med session={session} />
        </div>
      )}

      {vista === "citas" && (
        <div className="fade-in">
          <button
            onClick={() => setVista("inicio")}
            className={`mb-6 text-sm font-bold underline transition-colors cursor-pointer ${modoOscuro ? "text-green-400 hover:text-green-300" : "text-green-700 hover:text-green-800"}`}
          >
            Volver al menú principal
          </button>
          <div
            className={`p-8 rounded-xl shadow-md border text-center transition-colors ${modoOscuro ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}
          >
            <Citas session={session} />
          </div>
        </div>
      )}

      {vista === "estudios" && (
        <div className="fade-in">
          <button
            onClick={() => setVista("inicio")}
            className={`mb-6 text-sm font-bold underline transition-colors cursor-pointer ${
              modoOscuro
                ? "text-green-400 hover:text-green-300"
                : "text-green-700 hover:text-green-800"
            }`}
          >
            Volver al menú principal
          </button>

          <Estudios session={session} modoOscuro={modoOscuro} />
        </div>
      )}
    </div>
  );
};

export default RecuerdaMed;
