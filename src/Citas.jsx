import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import CardTemplate from './CardTemplate'

const Citas = ({ session }) => {
  const [citas, setCitas] = useState([])
  const [tipo, setTipo] = useState('')
  const [fecha, setFecha] = useState('')
  const [motivo, setMotivo] = useState('')
  const [indiceActual, setIndiceActual] = useState(0)

  const [mostrarModalCancelar, setMostrarModalCancelar] = useState(false)
  const [mostrarModalExito, setMostrarModalExito] = useState(false)

  const hoy = new Date().toISOString().split('T')[0]

  const cargarCitas = async () => {
    if (!session?.user) return;
    const { data, error } = await supabase
      .from('citas')
      .select('*')
      .eq('user_id', session.user.id)
      .order('fecha', { ascending: true })

    if (!error && data) setCitas(data)
  }

  useEffect(() => {
    cargarCitas()
  }, [session])

  const agendarCita = async (e) => {
    e.preventDefault()
    if (!tipo || !fecha || !session?.user) return

    const { error } = await supabase
      .from('citas')
      .insert([{ tipo, fecha, motivo, user_id: session.user.id }])

    if (!error) {
      setTipo('')
      setFecha('')
      setMotivo('')
      cargarCitas()
      setIndiceActual(0)
      setMostrarModalExito(true)
    } else {
      if (error.code === '23505') {
        alert(`Lo sentimos, ya no hay disponibilidad para una ${tipo} en esta fecha. Por favor, elige otro día.`)
      } else {
        alert("Error al agendar: " + error.message)
      }
    }
  }

  const confirmarCancelacion = async () => {
    const idEliminar = citas[indiceActual].id

    const { error } = await supabase
      .from('citas')
      .delete()
      .eq('id', idEliminar)

    if (!error) {
      if (indiceActual > 0 && indiceActual === citas.length - 1) {
        setIndiceActual(indiceActual - 1)
      }
      setMostrarModalCancelar(false) 
      cargarCitas()
    } else {
      alert("Error al cancelar: " + error.message)
    }
  }

  const obtenerImagenCita = (tipoCita) => {
    return tipoCita === 'estudio' 
      ? 'https://cdn-icons-png.flaticon.com/512/2286/2286329.png' 
      : 'https://cdn-icons-png.flaticon.com/512/8883/8883840.png'
  }

  const irAnterior = () => {
    if (indiceActual > 0) setIndiceActual(indiceActual - 1)
  }
  const irSiguiente = () => {
    if (indiceActual < citas.length - 1) setIndiceActual(indiceActual + 1)
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start mt-4 relative">
        
        <div className="bg-white p-8 rounded-2xl shadow-md border-t-4 border-t-green-400">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Agendar Nueva Cita</h2>
          
          <form onSubmit={agendarCita} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Tipo de Cita</label>
                <select
                  required value={tipo} onChange={(e) => setTipo(e.target.value)}
                  className="w-full p-3 rounded-lg border-2 border-green-400 bg-green-50 text-green-900 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all text-sm cursor-pointer"
                >
                  <option value="" disabled>Seleccionar...</option>
                  <option value="consulta">Consulta</option>
                  <option value="estudio">Estudio</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Fecha</label>
                <input
                  type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)}
                  min={hoy} 
                  className="w-full p-3 rounded-lg border-2 border-green-400 bg-green-50 text-green-900 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all text-sm cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Motivo (Opcional)</label>
              <input
                type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Chequeo mensual, Radiografía..."
                className="w-full p-3 rounded-lg border-2 border-green-400 bg-green-50 text-green-900 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all placeholder-green-700/40"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-6 py-3 px-4 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-lg shadow-sm transform hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Confirmar Cita
            </button>
          </form>
        </div>

        <div className="flex flex-col items-center justify-center h-full">
          {citas.length === 0 ? (
            <div className="text-gray-500 text-center p-8 border-2 border-dashed border-gray-300 rounded-2xl w-full">
              <span className="text-4xl block mb-2 font-bold">Lista de citas</span>
              <p>No tienes citas programadas.<br/>Agenda una en el panel izquierdo.</p>
            </div>
          ) : (
            <div className="w-full max-w-sm fade-in space-y-4">
              
              <CardTemplate
                imagen={obtenerImagenCita(citas[indiceActual].tipo)}
                titulo={`Cita de ${citas[indiceActual].tipo}`}
                descripcion={`Fecha: ${citas[indiceActual].fecha} ${citas[indiceActual].motivo ? `| Motivo: ${citas[indiceActual].motivo}` : ''}`}
                textoBoton={`Cita ${indiceActual + 1} de ${citas.length}`}
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
                  disabled={indiceActual === citas.length - 1}
                  className="py-2 px-6 bg-gray-200 text-gray-700 font-bold rounded-lg disabled:opacity-30 hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  Siguiente
                </button>
              </div>
              <div className="pt-2 px-2">
                <button
                  onClick={() => setMostrarModalCancelar(true)}
                  className="w-full py-2 px-4 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg border border-red-200 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  Cancelar Cita
                </button>
              </div>
              
            </div>
          )}
        </div>

      </div>

      {mostrarModalCancelar && citas.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 fade-in">
          <div className="w-full max-w-sm flex flex-col items-center">
            
            <h3 className="text-2xl font-bold text-white mb-6 text-center drop-shadow-md">
              ¿Cancelar esta cita?
            </h3>
            
            <CardTemplate
              imagen={obtenerImagenCita(citas[indiceActual].tipo)}
              titulo={`Cita de ${citas[indiceActual].tipo}`}
              descripcion={`Fecha: ${citas[indiceActual].fecha} ${citas[indiceActual].motivo ? `| Motivo: ${citas[indiceActual].motivo}` : ''}`}
              textoBoton="Sí, cancelar cita"
              alHacerClic={confirmarCancelacion} 
              modoOscuro={false} 
            />

            <button 
              onClick={() => setMostrarModalCancelar(false)}
              className="mt-6 py-2 px-6 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-gray-900 transition-colors cursor-pointer"
            >
              Regresar
            </button>

          </div>
        </div>
      )}

      {mostrarModalExito && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 fade-in">
          <div className="w-full max-w-sm flex flex-col items-center">
            
            <h3 className="text-2xl font-bold text-white mb-6 text-center drop-shadow-md">
              ¡Registro Completado!
            </h3>
            
            <CardTemplate
              imagen="https://cdn-icons-png.flaticon.com/512/10828/10828522.png"
              titulo="¡Cita Agendada!"
              descripcion="Tu cita médica ha sido guardada con éxito en la base de datos y ya se encuentra listada en tu panel."
              textoBoton="Entendido"
              alHacerClic={() => setMostrarModalExito(false)}
              modoOscuro={false} 
            />

          </div>
        </div>
      )}
    </>
  )
}

export default Citas;
