import { useState } from 'react'
import { auth } from './firebase'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async () => {
    setError('')
    setSuccess('')
    if (!email) return setError('Please enter your email')

    if (isForgotPassword) {
      try {
        await sendPasswordResetEmail(auth, email)
        setSuccess('Password reset email sent! Check your inbox.')
      } catch (err) {
        setError(err.message)
      }
      return
    }

    if (!password) return setError('Please enter your password')
    if (isSignUp && !displayName.trim()) return setError('Please enter a display name')

    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(result.user, { displayName: displayName.trim() })
        await sendEmailVerification(result.user)
        await auth.signOut()
        setSuccess('Account created! Please check your email to verify your account before signing in.')
        setIsSignUp(false)
        return
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password)
        if (!result.user.emailVerified) {
          await auth.signOut()
          setError('Please verify your email before signing in. Check your inbox!')
          return
        }
      }
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#0d1b2e] overflow-hidden py-8">
      <div className="absolute top-[-80px] left-[-80px] w-64 h-64 rounded-full bg-[#1a3a5c] opacity-60"></div>
      <div className="absolute bottom-[-80px] right-[-80px] w-64 h-64 rounded-full bg-[#1a3a5c] opacity-60"></div>
      <div className="absolute top-16 right-16 w-4 h-4 rounded-full bg-blue-400 opacity-50"></div>
      <div className="absolute bottom-24 left-16 w-3 h-3 rounded-full bg-blue-300 opacity-40"></div>

      <div className="relative bg-white/10 backdrop-blur-md border border-white/20 w-full max-w-xs mx-4 rounded-3xl shadow-2xl overflow-hidden z-10">

        <div className="bg-[#1a3a5c] px-8 pt-8 pb-6 flex flex-col items-center">
          <div className="relative w-16 h-16 mb-3">
            <div className="absolute top-0 left-2 w-10 h-10 rounded-full bg-[#e8845a] opacity-90"></div>
            <div className="absolute bottom-0 right-2 w-10 h-10 rounded-full bg-[#4ab8b8] opacity-80"></div>
          </div>
          <h2 className="text-white text-xl font-bold mb-1">
            {isForgotPassword ? 'Reset Password 🔑' : isSignUp ? 'Create Account 🎉' : 'Welcome Back 👋'}
          </h2>
          <p className="text-gray-400 text-xs text-center">
            {isForgotPassword ? 'Enter your email to reset' : isSignUp ? 'Sign up to start chatting' : 'Sign in to continue chatting'}
          </p>
        </div>

        <div className="px-8 py-8 bg-white/80 backdrop-blur-sm">

          {error && (
            <div className="bg-red-100 text-red-600 text-xs px-3 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 text-green-600 text-xs px-3 py-2 rounded-lg mb-4">
              {success}
            </div>
          )}

          {isSignUp && (
            <div className="border border-white/40 rounded-xl px-4 py-3 mb-4 flex items-center gap-3 bg-white/70">
              <span className="text-gray-400">👤</span>
              <input
                type="text"
                placeholder="Your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-transparent outline-none text-gray-700 text-sm w-full"
              />
            </div>
          )}

          <div className="border border-white/40 rounded-xl px-4 py-3 mb-4 flex items-center gap-3 bg-white/70">
            <span className="text-gray-400">✉</span>
            <input
              type="email"
              placeholder="yourname@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent outline-none text-gray-700 text-sm w-full"
            />
          </div>

          {!isForgotPassword && (
            <div className="border border-white/40 rounded-xl px-4 py-3 mb-2 flex items-center gap-3 bg-white/70">
              <span className="text-gray-400">🔒</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="bg-transparent outline-none text-gray-700 text-sm w-full tracking-widest"
              />
            </div>
          )}

          {!isSignUp && !isForgotPassword && (
            <div className="text-right mb-4">
              <span
                onClick={() => { setIsForgotPassword(true); setError(''); setSuccess('') }}
                className="text-blue-500 text-xs cursor-pointer hover:underline"
              >
                Forgot password?
              </span>
            </div>
          )}

          {!isForgotPassword && <div className="mb-6"></div>}

          <button
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-3 bg-[#0d1b2e] hover:bg-[#1a3a5c] text-white font-semibold py-3 rounded-xl transition duration-200 mb-4 shadow-md"
          >
            {isForgotPassword ? 'Send Reset Email' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          {!isForgotPassword && (
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess('') }}
              className="w-full border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition duration-200"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Create Account'}
            </button>
          )}

          {isForgotPassword && (
            <button
              onClick={() => { setIsForgotPassword(false); setError(''); setSuccess('') }}
              className="w-full border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition duration-200"
            >
              ← Back to Sign In
            </button>
          )}

          <p className="text-gray-400 text-xs text-center mt-6">
            By signing in you agree to our <span className="text-blue-500 cursor-pointer">Terms</span> &amp; <span className="text-blue-500 cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login