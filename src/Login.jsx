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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4a9e8e 0%, #3a8a7a 50%, #2d7268 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Wavy background blobs */}
      <div style={{ position: 'absolute', top: '-120px', left: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}></div>
      <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }}></div>
      <div style={{ position: 'absolute', bottom: '-100px', right: '-80px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}></div>
      <div style={{ position: 'absolute', bottom: '-40px', left: '-60px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>
      <div style={{ position: 'absolute', top: '40%', left: '10%', width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }}></div>
      <div style={{ position: 'absolute', top: '20%', right: '15%', width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }}></div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '360px',
        borderRadius: '28px',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
        position: 'relative',
        zIndex: 10
      }}>

        {/* Top header with wave */}
        <div style={{
          background: 'linear-gradient(135deg, #4a9e8e, #5bb5a2)',
          padding: '36px 32px 48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative'
        }}>
          {/* Wave shape */}
          <div style={{
            position: 'absolute',
            bottom: '-2px',
            left: 0,
            right: 0,
            height: '40px',
            background: 'white',
            borderRadius: '50% 50% 0 0 / 100% 100% 0 0'
          }}></div>

          {/* Logo blobs */}
          <div style={{ position: 'relative', width: '64px', height: '64px', marginBottom: '16px' }}>
            <div style={{ position: 'absolute', top: 0, left: '6px', width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)' }}></div>
            <div style={{ position: 'absolute', bottom: 0, right: '6px', width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)' }}></div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '24px' }}>💬</div>
          </div>

          <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 'bold', marginBottom: '6px', textAlign: 'center' }}>
            {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back!'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', textAlign: 'center' }}>
            {isForgotPassword ? 'Enter your email to reset' : isSignUp ? 'Sign up to start chatting' : 'Sign in to continue chatting'}
          </p>
        </div>

        {/* Form area */}
        <div style={{ background: 'white', padding: '32px 28px 28px' }}>

          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '12px', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '12px', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #bbf7d0' }}>
              {success}
            </div>
          )}

          {/* Display name */}
          {isSignUp && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f4faf8', border: '1.5px solid #c8e6e0', borderRadius: '14px', padding: '12px 16px', marginBottom: '14px' }}>
              <span style={{ fontSize: '16px' }}>👤</span>
              <input
                type="text"
                placeholder="Your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#3a8a7a', fontSize: '14px', width: '100%' }}
              />
            </div>
          )}

          {/* Email */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f4faf8', border: '1.5px solid #c8e6e0', borderRadius: '14px', padding: '12px 16px', marginBottom: '14px' }}>
            <span style={{ fontSize: '16px' }}>✉️</span>
            <input
              type="email"
              placeholder="yourname@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#3a8a7a', fontSize: '14px', width: '100%' }}
            />
          </div>

          {/* Password */}
          {!isForgotPassword && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f4faf8', border: '1.5px solid #c8e6e0', borderRadius: '14px', padding: '12px 16px', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px' }}>🔒</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#3a8a7a', fontSize: '14px', width: '100%', letterSpacing: '2px' }}
              />
            </div>
          )}

          {/* Forgot password */}
          {!isSignUp && !isForgotPassword && (
            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <span
                onClick={() => { setIsForgotPassword(true); setError(''); setSuccess('') }}
                style={{ color: '#4a9e8e', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
              >
                Forgot password?
              </span>
            </div>
          )}

          {!isForgotPassword && <div style={{ marginBottom: '20px' }}></div>}

          {/* Main button */}
          <button
            onClick={handleSubmit}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #4a9e8e, #5bb5a2)',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              padding: '14px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '12px',
              boxShadow: '0 4px 15px rgba(74,158,142,0.35)',
              transition: 'transform 0.1s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {isForgotPassword ? 'Send Reset Email' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          {/* Toggle */}
          {!isForgotPassword && (
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess('') }}
              style={{ width: '100%', background: 'transparent', border: '1.5px solid #c8e6e0', color: '#4a9e8e', borderRadius: '14px', padding: '12px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Create Account'}
            </button>
          )}

          {/* Back to login */}
          {isForgotPassword && (
            <button
              onClick={() => { setIsForgotPassword(false); setError(''); setSuccess('') }}
              style={{ width: '100%', background: 'transparent', border: '1.5px solid #c8e6e0', color: '#4a9e8e', borderRadius: '14px', padding: '12px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
            >
              ← Back to Sign In
            </button>
          )}

          <p style={{ color: '#9ca3af', fontSize: '11px', textAlign: 'center', marginTop: '20px' }}>
            By signing in you agree to our{' '}
            <span style={{ color: '#4a9e8e', cursor: 'pointer' }}>Terms</span>
            {' '}&amp;{' '}
            <span style={{ color: '#4a9e8e', cursor: 'pointer' }}>Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login