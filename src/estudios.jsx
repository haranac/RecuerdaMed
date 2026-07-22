import React, { useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient'

const BUCKET = 'estudios'
const TAMANIO_MAXIMO = 6 * 1024 * 1024

const TIPOS_PERMITIDOS = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
]

const Estudios = ({ session, modoOscuro }) => {
  const [estudios, setEstudios] = useState([])
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaEstudio, setFechaEstudio] = useState('')
  const [archivo, setArchivo] = useState(null)

  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [eliminandoId, setEliminandoId] = useState(null)

  const [mensaje, setMensaje] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const inputArchivoRef = useRef(null)

  const cargarEstudios = async () => {
    if (!session?.user?.id) {
      setCargando(false)
      return
    }

    setCargando(true)
    setErrorMsg('')

    const { data, error } = await supabase
      .from('estudios_medicos')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      setErrorMsg(`No fue posible cargar los estudios: ${error.message}`)
      setEstudios([])
    } else {
      setEstudios(data || [])
    }

    setCargando(false)
  }

  useEffect(() => {
    cargarEstudios()
  }, [session?.user?.id])

  const limpiarFormulario = () => {
    setNombre('')
    setDescripcion('')
    setFechaEstudio('')
    setArchivo(null)

    if (inputArchivoRef.current) {
      inputArchivoRef.current.value = ''
    }
  }

  const validarArchivo = (archivoSeleccionado) => {
    if (!archivoSeleccionado) {
      return 'Selecciona una imagen o un archivo PDF.'
    }

    if (!TIPOS_PERMITIDOS.includes(archivoSeleccionado.type)) {
      return 'El archivo debe ser PDF, JPG, JPEG, PNG o WEBP.'
    }

    if (archivoSeleccionado.size > TAMANIO_MAXIMO) {
      return 'El archivo no debe superar los 6 MB.'
    }

    return null
  }

  const manejarSeleccionArchivo = (e) => {
    setErrorMsg('')
    setMensaje('')

    const archivoSeleccionado = e.target.files?.[0] || null

    if (!archivoSeleccionado) {
      setArchivo(null)
      return
    }

    const errorValidacion = validarArchivo(archivoSeleccionado)

    if (errorValidacion) {
      setErrorMsg(errorValidacion)
      setArchivo(null)
      e.target.value = ''
      return
    }

    setArchivo(archivoSeleccionado)
  }

  const subirEstudio = async (e) => {
    e.preventDefault()

    setErrorMsg('')
    setMensaje('')

    if (!session?.user?.id) {
      setErrorMsg('No existe una sesión activa.')
      return
    }

    if (!nombre.trim()) {
      setErrorMsg('Escribe un nombre para el estudio.')
      return
    }

    const errorValidacion = validarArchivo(archivo)

    if (errorValidacion) {
      setErrorMsg(errorValidacion)
      return
    }

    setSubiendo(true)

    let archivoPath = ''

    try {
      const nombreOriginal = archivo.name
      const partesNombre = nombreOriginal.split('.')
      const extension =
        partesNombre.length > 1
          ? partesNombre.pop().toLowerCase()
          : archivo.type === 'application/pdf'
            ? 'pdf'
            : 'jpg'

      archivoPath =
        `${session.user.id}/${crypto.randomUUID()}.${extension}`

      const { error: errorStorage } = await supabase.storage
        .from(BUCKET)
        .upload(archivoPath, archivo, {
          contentType: archivo.type,
          cacheControl: '3600',
          upsert: false
        })

      if (errorStorage) {
        throw new Error(
          `No fue posible subir el archivo: ${errorStorage.message}`
        )
      }

      const { error: errorBaseDatos } = await supabase
        .from('estudios_medicos')
        .insert([
          {
            user_id: session.user.id,
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || null,
            fecha_estudio: fechaEstudio || null,
            nombre_archivo: archivo.name,
            archivo_path: archivoPath,
            mime_type: archivo.type,
            tamanio: archivo.size
          }
        ])

      if (errorBaseDatos) {
        await supabase.storage
          .from(BUCKET)
          .remove([archivoPath])

        throw new Error(
          `No fue posible guardar la información: ${errorBaseDatos.message}`
        )
      }

      limpiarFormulario()
      await cargarEstudios()

      setMensaje('El estudio médico fue guardado correctamente.')
    } catch (error) {
      setErrorMsg(
        error.message || 'Ocurrió un error inesperado al subir el estudio.'
      )
    } finally {
      setSubiendo(false)
    }
  }

  const abrirEstudio = async (estudio) => {
    setErrorMsg('')
    setMensaje('')

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(estudio.archivo_path, 300)

    if (error) {
      setErrorMsg(`No fue posible abrir el archivo: ${error.message}`)
      return
    }

    if (!data?.signedUrl) {
      setErrorMsg('No fue posible generar el enlace del archivo.')
      return
    }

    window.open(
      data.signedUrl,
      '_blank',
      'noopener,noreferrer'
    )
  }

  const eliminarEstudio = async (estudio) => {
    const confirmar = window.confirm(
      `¿Deseas eliminar el estudio "${estudio.nombre}"?`
    )

    if (!confirmar) return

    setErrorMsg('')
    setMensaje('')
    setEliminandoId(estudio.id)

    try {
      const { error: errorStorage } = await supabase.storage
        .from(BUCKET)
        .remove([estudio.archivo_path])

      if (errorStorage) {
        throw new Error(
          `No fue posible eliminar el archivo: ${errorStorage.message}`
        )
      }

      const { error: errorBaseDatos } = await supabase
        .from('estudios_medicos')
        .delete()
        .eq('id', estudio.id)
        .eq('user_id', session.user.id)

      if (errorBaseDatos) {
        throw new Error(
          `El archivo fue eliminado, pero no se pudo eliminar el registro: ${errorBaseDatos.message}`
        )
      }

      setMensaje('El estudio médico fue eliminado correctamente.')
      await cargarEstudios()
    } catch (error) {
      setErrorMsg(
        error.message || 'Ocurrió un error al eliminar el estudio.'
      )
    } finally {
      setEliminandoId(null)
    }
  }

  const formatearTamanio = (bytes) => {
    if (!bytes) return '0 KB'

    const megabytes = bytes / (1024 * 1024)

    if (megabytes >= 1) {
      return `${megabytes.toFixed(2)} MB`
    }

    return `${(bytes / 1024).toFixed(1)} KB`
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha registrada'

    const partes = fecha.split('-')

    if (partes.length !== 3) return fecha

    return `${partes[2]}/${partes[1]}/${partes[0]}`
  }

  const obtenerIcono = (mimeType) => {
    return mimeType === 'application/pdf' ? '📄' : '🖼️'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
      {/* Formulario */}
      <section
        className={`p-8 rounded-2xl shadow-md border-t-4 border-t-green-400 transition-colors ${
          modoOscuro
            ? 'bg-gray-800'
            : 'bg-white'
        }`}
      >
        <h2
          className={`text-2xl font-extrabold mb-2 ${
            modoOscuro
              ? 'text-white'
              : 'text-gray-900'
          }`}
        >
          Subir estudio médico
        </h2>

        <p
          className={`text-sm mb-6 ${
            modoOscuro
              ? 'text-gray-400'
              : 'text-gray-500'
          }`}
        >
          Guarda análisis, radiografías, recetas, resultados o documentos
          médicos.
        </p>

        {errorMsg && (
          <div className="mb-5 p-4 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm font-medium">
            {errorMsg}
          </div>
        )}

        {mensaje && (
          <div className="mb-5 p-4 rounded-lg border border-green-300 bg-green-50 text-green-700 text-sm font-medium">
            {mensaje}
          </div>
        )}

        <form onSubmit={subirEstudio} className="space-y-5">
          <div>
            <label
              className={`block text-sm font-semibold mb-1 ${
                modoOscuro
                  ? 'text-gray-200'
                  : 'text-gray-700'
              }`}
            >
              Nombre del estudio
            </label>

            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Radiografía de tórax"
              className="w-full p-3 rounded-lg border-2 border-green-400 bg-green-50 text-green-900 placeholder-green-700/40 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all"
            />
          </div>

          <div>
            <label
              className={`block text-sm font-semibold mb-1 ${
                modoOscuro
                  ? 'text-gray-200'
                  : 'text-gray-700'
              }`}
            >
              Fecha del estudio
            </label>

            <input
              type="date"
              value={fechaEstudio}
              onChange={(e) => setFechaEstudio(e.target.value)}
              className="w-full p-3 rounded-lg border-2 border-green-400 bg-green-50 text-green-900 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all cursor-pointer"
            />
          </div>

          <div>
            <label
              className={`block text-sm font-semibold mb-1 ${
                modoOscuro
                  ? 'text-gray-200'
                  : 'text-gray-700'
              }`}
            >
              Descripción
            </label>

            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Estudio solicitado durante una consulta general"
              rows="3"
              className="w-full p-3 rounded-lg border-2 border-green-400 bg-green-50 text-green-900 placeholder-green-700/40 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all resize-none"
            />
          </div>

          <div>
            <label
              className={`block text-sm font-semibold mb-1 ${
                modoOscuro
                  ? 'text-gray-200'
                  : 'text-gray-700'
              }`}
            >
              Imagen o archivo PDF
            </label>

            <input
              ref={inputArchivoRef}
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
              onChange={manejarSeleccionArchivo}
              className={`w-full p-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                modoOscuro
                  ? 'border-gray-500 bg-gray-700 text-gray-200'
                  : 'border-green-400 bg-green-50 text-green-900'
              }`}
            />

            <p
              className={`text-xs mt-2 ${
                modoOscuro
                  ? 'text-gray-400'
                  : 'text-gray-500'
              }`}
            >
              Formatos permitidos: PDF, JPG, PNG y WEBP. Máximo 6 MB.
            </p>

            {archivo && (
              <div
                className={`mt-3 p-3 rounded-lg text-sm ${
                  modoOscuro
                    ? 'bg-gray-700 text-gray-200'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <p className="font-semibold break-all">
                  {archivo.name}
                </p>

                <p className="text-xs mt-1">
                  {formatearTamanio(archivo.size)}
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={subiendo}
            className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-yellow-900 font-bold rounded-lg shadow-sm transform hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            {subiendo
              ? 'Subiendo estudio...'
              : 'Guardar estudio'}
          </button>
        </form>
      </section>

      {/* Lista de estudios */}
      <section>
        <h2
          className={`text-2xl font-extrabold mb-2 ${
            modoOscuro
              ? 'text-white'
              : 'text-gray-900'
          }`}
        >
          Mis estudios médicos
        </h2>

        <p
          className={`text-sm mb-6 ${
            modoOscuro
              ? 'text-gray-400'
              : 'text-gray-500'
          }`}
        >
          Consulta o elimina los documentos guardados en tu cuenta.
        </p>

        {cargando ? (
          <div
            className={`text-center p-10 border-2 border-dashed rounded-2xl ${
              modoOscuro
                ? 'border-gray-600 text-gray-400'
                : 'border-gray-300 text-gray-500'
            }`}
          >
            <p className="font-semibold">Cargando estudios...</p>
          </div>
        ) : estudios.length === 0 ? (
          <div
            className={`text-center p-10 border-2 border-dashed rounded-2xl ${
              modoOscuro
                ? 'border-gray-600 text-gray-400'
                : 'border-gray-300 text-gray-500'
            }`}
          >
            <span className="text-5xl block mb-4">📂</span>

            <p className="font-semibold">
              No tienes estudios registrados.
            </p>

            <p className="text-sm mt-2">
              Selecciona un archivo en el formulario para guardar el primero.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {estudios.map((estudio) => (
              <article
                key={estudio.id}
                className={`p-5 rounded-2xl shadow-sm border transition-colors ${
                  modoOscuro
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex gap-4 items-start">
                  <div
                    className={`w-14 h-14 shrink-0 flex items-center justify-center rounded-xl text-3xl ${
                      modoOscuro
                        ? 'bg-gray-700'
                        : 'bg-green-50'
                    }`}
                  >
                    {obtenerIcono(estudio.mime_type)}
                  </div>

                  <div className="flex-grow min-w-0">
                    <h3
                      className={`font-bold text-lg break-words ${
                        modoOscuro
                          ? 'text-white'
                          : 'text-gray-900'
                      }`}
                    >
                      {estudio.nombre}
                    </h3>

                    <p
                      className={`text-sm break-all mt-1 ${
                        modoOscuro
                          ? 'text-gray-300'
                          : 'text-gray-600'
                      }`}
                    >
                      {estudio.nombre_archivo}
                    </p>

                    <div
                      className={`text-xs mt-2 ${
                        modoOscuro
                          ? 'text-gray-400'
                          : 'text-gray-500'
                      }`}
                    >
                      <p>
                        Fecha: {formatearFecha(estudio.fecha_estudio)}
                      </p>

                      <p>
                        Tamaño: {formatearTamanio(estudio.tamanio)}
                      </p>
                    </div>

                    {estudio.descripcion && (
                      <p
                        className={`text-sm mt-3 ${
                          modoOscuro
                            ? 'text-gray-300'
                            : 'text-gray-600'
                        }`}
                      >
                        {estudio.descripcion}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => abrirEstudio(estudio)}
                    className="py-2 px-4 bg-green-100 hover:bg-green-200 text-green-800 font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Ver archivo
                  </button>

                  <button
                    type="button"
                    onClick={() => eliminarEstudio(estudio)}
                    disabled={eliminandoId === estudio.id}
                    className="py-2 px-4 bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed text-red-700 font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    {eliminandoId === estudio.id
                      ? 'Eliminando...'
                      : 'Eliminar'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Estudios