import React from 'react';

const CardTemplate = ({ imagen, titulo, descripcion, textoBoton, alHacerClic, modoOscuro }) => {
  return (
    <div className={`p-8 rounded-2xl shadow-sm border-t-4 border-t-green-400 hover:shadow-md transition-all flex flex-col items-center text-center ${
      modoOscuro ? 'bg-gray-800' : 'bg-white'
    }`}>
      <img 
        src={imagen} 
        alt={`Ícono de ${titulo}`} 
        className="w-16 h-16 object-contain mb-4 drop-shadow-sm" 
      />
      <h3 className={`text-xl font-bold mb-2 transition-colors ${
        modoOscuro ? 'text-white' : 'text-gray-900'
      }`}>
        {titulo}
      </h3>
      <p className={`mb-6 text-sm flex-grow transition-colors ${
        modoOscuro ? 'text-gray-400' : 'text-gray-500'
      }`}>
        {descripcion}
      </p>
      <button 
        onClick={alHacerClic} 
        className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-lg shadow-sm transform hover:-translate-y-0.5 transition-all cursor-pointer"
      >
        {textoBoton}
      </button>
    </div>
  )
}

export default CardTemplate;