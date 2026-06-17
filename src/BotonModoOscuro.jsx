import React from 'react';

const BotonModoOscuro = ({ modoOscuro, setModoOscuro }) => {
  return (
    <button 
      onClick={() => setModoOscuro(!modoOscuro)}
      className="fixed bottom-6 right-6 z-50 py-3 px-5 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-full shadow-lg transform hover:-translate-y-1 transition-all flex items-center gap-2 cursor-pointer"
    >
      {modoOscuro ? '☀️ Claro' : '🌙 Oscuro'}
    </button>
  )
}

export default BotonModoOscuro;