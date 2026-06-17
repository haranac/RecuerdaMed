import React, { useState, useEffect } from 'react'
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe()
  }, [])

  const manejarAuth = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    const correoIngresado = email;
    const passwordIngresado = password;

    setEmail('')
    setPassword('')

    if (isRegistrando) {
      const { error } = await supabase.auth.signUp({ email: correoIngresado, password: passwordIngresado })
      if (error) setErrorMsg(error.message)
      else alert('¡Registro exitoso! Confirma tu correo para iniciar sesión.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: correoIngresado, password: passwordIngresado })
      if (error) {
        if (error.message === 'Correo no verificado') {
          setErrorMsg('Por favor, confirma tu correo electrónico en tu bandeja de entrada antes de iniciar sesión.')
        } else {
          setErrorMsg(error.message)
        }
      }
    }
  }

  if (!session) {
    return (
      <div className={`min-h-screen flex flex-col justify-center items-center p-6 font-sans transition-colors duration-300 relative ${
        modoOscuro ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        
        <BotonModoOscuro modoOscuro={modoOscuro} setModoOscuro={setModoOscuro}/>

        <div className={`p-8 rounded-xl shadow-md border w-full max-w-md transition-colors duration-300 ${
          modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <h1 className={`text-3xl font-extrabold text-center tracking-tight mb-2 transition-colors ${
            modoOscuro ? 'text-white' : 'text-gray-900'
          }`}>
            RecuerdaMed
          </h1>
          <p className={`text-center mb-8 transition-colors ${
            modoOscuro ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {isRegistrando ? 'Crea tu cuenta' : 'Inicia sesión en tu cuenta'}
          </p>
          
          {errorMsg && (
            <div className="p-4 mb-6 text-sm text-red-900 bg-red-50 border border-red-200 rounded-xl font-medium shadow-sm flex items-center gap-2 animate-pulse">
              <span className="text-base">ERROR:</span>
              <p>{errorMsg}</p>
            </div>
          )}
          
          <form onSubmit={manejarAuth} className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold mb-1 transition-colors ${modoOscuro ? 'text-gray-300' : 'text-gray-700'}`}>
                Correo Electrónico
              </label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-lg border-2 border-green-400 bg-green-50 text-green-900 placeholder-green-600/50 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all"
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-1 transition-colors ${modoOscuro ? 'text-gray-300' : 'text-gray-700'}`}>
                Contraseña
              </label>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-lg border-2 border-green-400 bg-green-50 text-green-900 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all"
              />
            </div>
            <button 
              type="submit" 
              className="w-full mt-4 py-3 px-4 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-lg shadow-sm transform hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              {isRegistrando ? 'Registrarme' : 'Entrar'}
            </button>
          </form>

          <button 
            onClick={() => setIsRegistrando(!isRegistrando)}
            className={`w-full mt-4 text-sm font-semibold underline transition-colors cursor-pointer ${
              modoOscuro ? 'text-green-400 hover:text-green-300' : 'text-green-700 hover:text-green-800'
            }`}
          >
            {isRegistrando ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>
      </div>
    )
  }

  return <RecuerdaMed session={session} modoOscuro={modoOscuro} setModoOscuro={setModoOscuro} />
}

export default App;