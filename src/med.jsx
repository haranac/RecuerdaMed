import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import CardTemplate from './CardTemplate'

const Med = ({ session }) => {
  const [medicamentos, setMedicamentos] = useState([])
  const [nombre, setNombre] = useState('')
  const [dosis, setDosis] = useState('')
  const [tipo, setTipo] = useState('')
  const [unidad, setUnidad] = useState('')
  const [indiceActual, setIndiceActual] = useState(0)
  
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false)

  const cargarMedicamentos = async () => {
    if (!session?.user) return;
    const { data, error } = await supabase
      .from('medicamentos')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (!error && data) setMedicamentos(data)
  };

  useEffect(() => {
    cargarMedicamentos()
  }, [session])

  const agregarMedicamento = async (e) => {
    e.preventDefault()
    if (!nombre || !dosis || !tipo || !unidad || !session?.user) return

    const { error } = await supabase
      .from('medicamentos')
      .insert([{ nombre, dosis, tipo, unidad, user_id: session.user.id }])

    if (!error) {
      setNombre('')
      setDosis('')
      setTipo('')
      setUnidad('')
      cargarMedicamentos()
      setIndiceActual(0)
    } else {
      alert("Error al guardar: " + error.message)
    }
  };

  const confirmarEliminacion = async () => {
    const idEliminar = medicamentos[indiceActual].id
    
    const { error } = await supabase
      .from('medicamentos')
      .delete()
      .eq('id', idEliminar)

    if (!error) {
      if (indiceActual > 0 && indiceActual === medicamentos.length - 1) {
        setIndiceActual(indiceActual - 1);
      }
      setMostrarModalEliminar(false)
      cargarMedicamentos()
    } else {
      alert("Error al eliminar: " + error.message);
    }
  };

  const manejarCambioTipo = (nuevoTipo) => {
    setTipo(nuevoTipo);
    setUnidad(''); 
  };

  const obtenerOpcionesUnidad = () => {
    if (tipo === 'jarabe' || tipo === 'inyectable') return ['ml'];
    if (tipo === 'pastilla' || tipo === 'capsula') return ['mg', 'g'];
    return [];
  };

  const obtenerImagenPorTipo = (tipoMed) => {
    switch(tipoMed) {
      case 'jarabe': return 'https://cdn-icons-png.flaticon.com/512/4774/4774031.png';
      case 'inyectable': return 'https://png.pngtree.com/png-clipart/20230816/original/pngtree-medical-syringe-icon-cartoon-vector-picture-image_7987758.png';
      case 'pastilla': return 'https://static.vecteezy.com/system/resources/previews/017/257/838/non_2x/cute-medicine-cartoon-free-png.png';
      case 'capsula': return 'https://png.pngtree.com/png-clipart/20220103/big/pngtree-cartoon-hand-drawn-medical-drug-capsule-png-image_7014454.png';
      default: return 'https://static.vecteezy.com/system/resources/previews/017/257/838/non_2x/cute-medicine-cartoon-free-png.png';
    }
  };

  const irAnterior = () => {
    if (indiceActual > 0) setIndiceActual(indiceActual - 1);
  };
  const irSiguiente = () => {
    if (indiceActual < medicamentos.length - 1) setIndiceActual(indiceActual + 1);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start mt-4 relative">

        <div className="bg-white p-8 rounded-2xl shadow-md border-t-4 border-t-green-400">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Nuevo Medicamento</h2>

          <form onSubmit={agregarMedicamento} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Nombre del medicamento</label>
              <input
                type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                className="w-full p-3 rounded-lg border-2 border-green-400 bg-green-50 text-green-900 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all"
                placeholder="Ej. Paracetamol"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Presentación</label>
              <select
                required value={tipo} onChange={(e) => manejarCambioTipo(e.target.value)}
                className="w-full p-3 rounded-lg border-2 border-green-400 bg-green-50 text-green-900 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all"
              >
                <option value="" disabled>Selecciona una opción</option>
                <option value="pastilla">Pastilla</option>
                <option value="capsula">Cápsula</option>
                <option value="jarabe">Jarabe</option>
                <option value="inyectable">Inyectable</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Dosis</label>
                <input
                  type="number" required min="0.1" step="any" value={dosis} onChange={(e) => setDosis(e.target.value)}
                  className="w-full p-3 rounded-lg border-2 border-green-400 bg-green-50 text-green-900 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all"
                  placeholder="Ej. 500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Unidad</label>
                <select
                  required value={unidad} onChange={(e) => setUnidad(e.target.value)} disabled={!tipo}
                  className="w-full p-3 rounded-lg border-2 border-green-400 bg-green-50 text-green-900 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>{tipo ? 'Elige unidad' : 'Bloqueado'}</option>
                  {obtenerOpcionesUnidad().map(opcion => (
                    <option key={opcion} value={opcion}>{opcion}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-6 py-3 px-4 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-lg shadow-sm transform hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Guardar Medicamento
            </button>
          </form>
        </div>

        <div className="flex flex-col items-center justify-center h-full">
          {medicamentos.length === 0 ? (
            <div className="text-gray-500 text-center p-8 border-2 border-dashed border-gray-300 rounded-2xl w-full">
              <span className="text-4xl block mb-2">Lista</span>
              <p>No has registrado ningún medicamento.<br/>Registra un medicamento en el panel izquierdo.</p>
            </div>
          ) : (
            <div className="w-full max-w-sm fade-in space-y-4">
              
              <CardTemplate
                imagen={obtenerImagenPorTipo(medicamentos[indiceActual].tipo)}
                titulo={medicamentos[indiceActual].nombre}
                descripcion={`Dosis: ${medicamentos[indiceActual].dosis} ${medicamentos[indiceActual].unidad} (${medicamentos[indiceActual].tipo})`}
                textoBoton={`${indiceActual + 1} de ${medicamentos.length}`} 
                alHacerClic={() => {}} 
                modoOscuro={false}
              />

              <div className="flex justify-between px-2">
                <button
                  onClick={irAnterior}
                  disabled={indiceActual === 0}
                  className="py-2 px-6 bg-gray-200 text-gray-700 font-bold rounded-lg disabled:opacity-30 hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  Anterior
                </button>
                <button
                  onClick={irSiguiente}
                  disabled={indiceActual === medicamentos.length - 1}
                  className="py-2 px-6 bg-gray-200 text-gray-700 font-bold rounded-lg disabled:opacity-30 hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  Siguiente
                </button>
              </div>

              <div className="pt-2 px-2">
                <button
                  onClick={() => setMostrarModalEliminar(true)}
                  className="w-full py-2 px-4 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg border border-red-200 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
              
            </div>
          )}
        </div>
      </div>

      {mostrarModalEliminar && medicamentos.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 fade-in">
          <div className="w-full max-w-sm flex flex-col items-center">
            
            <h3 className="text-2xl font-bold text-white mb-6 text-center drop-shadow-md">
              ¿Eliminar definitivamente?
            </h3>
            
            <CardTemplate
              imagen={obtenerImagenPorTipo(medicamentos[indiceActual].tipo)}
              titulo={medicamentos[indiceActual].nombre}
              descripcion={`Se borrará del inventario: ${medicamentos[indiceActual].dosis} ${medicamentos[indiceActual].unidad}`}
              textoBoton="Sí, eliminar medicamento"
              alHacerClic={confirmarEliminacion} 
              modoOscuro={false} 
            />

            <button 
              onClick={() => setMostrarModalEliminar(false)}
              className="mt-6 py-2 px-6 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-gray-900 transition-colors cursor-pointer"
            >
              Cancelar y regresar
            </button>

          </div>
        </div>
      )}
    </>
  )
}

export default Med;