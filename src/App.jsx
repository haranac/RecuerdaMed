import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import RecuerdaMed from './RecuerdaMed'
import BotonModoOscuro from './BotonModoOscuro'

const App = () => {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegistrando, setIsRegistrando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [modoOscuro, setModoOscuro] = useState(false)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    let componenteActivo = true

    const obtenerSession = async () => {
      const {
        data: { session },
        error
      } = await supabase.auth.getSession()

      if (!componenteActivo) return

      if (error) {
        console.error('Error obteniendo la sesión:', error)
        setErrorMsg('No fue posible recuperar la sesión.')
        return
      }

      setSession(session)
    }

    obtenerSession()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nuevaSession) => {
      if (componenteActivo) {
        setSession(nuevaSession)
      }
    })

    return () => {
      componenteActivo = false
      subscription.unsubscribe()
    }
  }, [])

  const manejarAuth = async (e) => {
    e.preventDefault()

    if (cargando) return

    setErrorMsg('')
    setCargando(true)

    const correoIngresado = email.trim().toLowerCase()
    const passwordIngresado = password

    try {
      if (isRegistrando) {
        const { data, error } = await supabase.auth.signUp({
          email: correoIngresado,
          password: passwordIngresado,
          options: {
            emailRedirectTo: window.location.origin
          }
        })

        /*
         * Supabase puede responder de distintas maneras cuando
         * el correo ya está registrado:
         *
         * 1. Puede devolver un error "User already registered".
         * 2. Puede devolver un usuario oculto sin identidades.
         */

        if (error) {
          const mensajeError = error.message?.toLowerCase() || ''

          const correoYaRegistrado =
            error.code === 'user_already_exists' ||
            error.code === 'email_exists' ||
            mensajeError.includes('already registered') ||
            mensajeError.includes('already exists')

          if (correoYaRegistrado) {
            setErrorMsg(
              'Este correo ya está registrado. Intenta iniciar sesión.'
            )
            return
          }

          throw error
        }

        const identidades = data.user?.identities

        const usuarioSinIdentidades =
          Array.isArray(identidades) && identidades.length === 0

        if (usuarioSinIdentidades) {
          setErrorMsg(
            'Este correo ya está registrado. Intenta iniciar sesión.'
          )
          return
        }

        setEmail('')
        setPassword('')
        setIsRegistrando(false)

        alert(
          'Cuenta creada correctamente. Revisa tu correo electrónico para confirmar el registro.'
        )

        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: correoIngresado,
        password: passwordIngresado
      })

      if (error) {
        if (error.code === 'email_not_confirmed') {
          setErrorMsg(
            'Debes confirmar tu correo electrónico antes de iniciar sesión.'
          )
          return
        }

        if (error.code === 'invalid_credentials') {
          setErrorMsg('El correo o la contraseña son incorrectos.')
          return
        }

        throw error
      }

      setEmail('')
      setPassword('')
    } catch (error) {
      console.error('Error de autenticación:', error)

      switch (error.code) {
        case 'weak_password':
          setErrorMsg(
            'La contraseña es demasiado débil. Utiliza una contraseña más segura.'
          )
          break

        case 'email_address_invalid':
          setErrorMsg('El correo electrónico no es válido.')
          break

        case 'over_email_send_rate_limit':
          setErrorMsg(
            'Se han solicitado demasiados correos. Espera unos minutos e inténtalo nuevamente.'
          )
          break

        case 'signup_disabled':
          setErrorMsg('El registro de nuevos usuarios está deshabilitado.')
          break

        default:
          setErrorMsg(
            error.message || 'Ocurrió un error durante la autenticación.'
          )
      }
    } finally {
      setCargando(false)
    }
  }

  const cambiarModoAuth = () => {
    setIsRegistrando((valorActual) => !valorActual)
    setErrorMsg('')
    setPassword('')
  }

  if (!session) {
    return (
      <div
        className={`min-h-screen flex flex-col justify-center items-center p-6 font-sans transition-colors duration-300 relative ${
          modoOscuro ? 'bg-gray-900' : 'bg-gray-50'
        }`}
      >
        <BotonModoOscuro
          modoOscuro={modoOscuro}
          setModoOscuro={setModoOscuro}
        />

        <div
          className={`p-8 rounded-xl shadow-md border w-full max-w-md transition-colors duration-300 ${
            modoOscuro
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-100'
          }`}
        >
          <h1
            className={`text-3xl font-extrabold text-center tracking-tight mb-2 transition-colors ${
              modoOscuro ? 'text-white' : 'text-gray-900'
            }`}
          >
            RecuerdaMed
          </h1>

          <p
            className={`text-center mb-8 transition-colors ${
              modoOscuro ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            {isRegistrando
              ? 'Crea tu cuenta'
              : 'Inicia sesión en tu cuenta'}
          </p>

          {errorMsg && (
            <div className="p-4 mb-6 text-sm text-red-900 bg-red-50 border border-red-200 rounded-xl font-medium shadow-sm flex items-center gap-2">
              <span className="text-base font-bold">ERROR:</span>
              <p>{errorMsg}</p>
            </div>
          )}

          <form onSubmit={manejarAuth} className="space-y-4">
            <div>
              <label
                className={`block text-sm font-semibold mb-1 transition-colors ${
                  modoOscuro ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Correo electrónico
              </label>

              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                disabled={cargando}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-lg border-2 border-green-400 bg-green-50 text-green-900 placeholder-green-600/50 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all disabled:opacity-60"
              />
            </div>

            <div>
              <label
                className={`block text-sm font-semibold mb-1 transition-colors ${
                  modoOscuro ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Contraseña
              </label>

              <input
                type="password"
                required
                minLength={6}
                autoComplete={
                  isRegistrando ? 'new-password' : 'current-password'
                }
                value={password}
                disabled={cargando}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-lg border-2 border-green-400 bg-green-50 text-green-900 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full mt-4 py-3 px-4 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-lg shadow-sm transform hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {cargando
                ? 'Procesando...'
                : isRegistrando
                  ? 'Registrarme'
                  : 'Entrar'}
            </button>
          </form>

          <button
            type="button"
            disabled={cargando}
            onClick={cambiarModoAuth}
            className={`w-full mt-4 text-sm font-semibold underline transition-colors cursor-pointer disabled:opacity-60 ${
              modoOscuro
                ? 'text-green-400 hover:text-green-300'
                : 'text-green-700 hover:text-green-800'
            }`}
          >
            {isRegistrando
              ? '¿Ya tienes cuenta? Inicia sesión aquí'
              : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <RecuerdaMed
      session={session}
      modoOscuro={modoOscuro}
      setModoOscuro={setModoOscuro}
    />
  )
}
export default App
