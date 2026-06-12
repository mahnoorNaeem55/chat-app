import { useState, useEffect } from 'react'
import { db, auth } from './firebase'
import {
  collection, addDoc, onSnapshot,
  serverTimestamp, doc, getDoc, setDoc
} from 'firebase/firestore'
import { signOut } from 'firebase/auth'

function ChatRoomList({ onJoinRoom, darkMode, setDarkMode }) {
  const [rooms, setRooms] = useState([])
  const [newRoom, setNewRoom] = useState('')
  const [unreadRooms, setUnreadRooms] = useState({})

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (rooms.length === 0) return
    const unsubscribers = rooms.map(room => {
      return onSnapshot(collection(db, 'rooms', room.id, 'messages'), async (snapshot) => {
        const lastReadRef = doc(db, 'users', auth.currentUser.uid, 'lastRead', room.id)
        const lastReadSnap = await getDoc(lastReadRef)
        const lastReadTime = lastReadSnap.exists() ? lastReadSnap.data().timestamp?.toMillis() : 0
        const now = Date.now()
        const fiveMinutesAgo = now - 5 * 60 * 1000

        const unread = snapshot.docs.filter(d => {
          const msgTime = d.data().createdAt?.toMillis()
          const notMine = d.data().uid !== auth.currentUser.uid
          if (!lastReadSnap.exists()) {
            return msgTime && notMine && msgTime > fiveMinutesAgo
          }
          return msgTime && msgTime > lastReadTime && notMine
        }).length

        setUnreadRooms(prev => ({ ...prev, [room.id]: unread }))
      })
    })
    return () => unsubscribers.forEach(unsub => unsub())
  }, [rooms])

  const handleJoinRoom = async (room) => {
    const lastReadRef = doc(db, 'users', auth.currentUser.uid, 'lastRead', room.id)
    await setDoc(lastReadRef, { timestamp: serverTimestamp() })
    setUnreadRooms(prev => ({ ...prev, [room.id]: 0 }))
    onJoinRoom(room)
  }

  const createRoom = async () => {
    if (!newRoom.trim()) return
    await addDoc(collection(db, 'rooms'), {
      name: newRoom.trim(),
      createdAt: serverTimestamp()
    })
    setNewRoom('')
  }

  // Warm soft light / deep dark teal theme
  const bg = darkMode
    ? 'linear-gradient(135deg, #042f2e 0%, #064e3b 50%, #065f46 100%)'
    : 'linear-gradient(135deg, #4a9e8e 0%, #3a8a7a 50%, #2d7268 100%)'
  const cardBg = darkMode ? '#0f2d2b' : 'white'
  const headerBg = darkMode
    ? 'linear-gradient(135deg, #134e4a, #0f766e)'
    : 'linear-gradient(135deg, #4a9e8e, #5bb5a2)'
  const roomBg = darkMode ? 'rgba(255,255,255,0.05)' : '#f4faf8'
  const roomBorder = darkMode ? 'rgba(255,255,255,0.08)' : '#c8e6e0'
  const roomText = darkMode ? 'white' : '#3a8a7a'
  const subText = darkMode ? 'rgba(255,255,255,0.4)' : '#8ec4bc'
  const inputBg = darkMode ? 'rgba(255,255,255,0.08)' : '#f4faf8'
  const inputBorder = darkMode ? 'rgba(255,255,255,0.15)' : '#c8e6e0'
  const inputColor = darkMode ? 'white' : '#3a8a7a'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: bg,
      padding: '32px 16px',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Background blobs */}
      <div style={{ position: 'absolute', top: '-100px', left: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }}></div>
      <div style={{ position: 'absolute', bottom: '-100px', right: '-80px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }}></div>
      <div style={{ position: 'absolute', top: '60px', right: '60px', width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }}></div>
      <div style={{ position: 'absolute', bottom: '80px', left: '60px', width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }}></div>

      {/* Card */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '340px',
        borderRadius: '28px',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
        zIndex: 10
      }}>

        {/* Header */}
        <div style={{
          background: headerBg,
          padding: '32px 32px 52px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative'
        }}>
          {/* Wave at bottom of header */}
          <div style={{
            position: 'absolute',
            bottom: '-2px',
            left: 0,
            right: 0,
            height: '40px',
            background: cardBg,
            borderRadius: '50% 50% 0 0 / 100% 100% 0 0'
          }}></div>

          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '10px',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* Logo */}
          <div style={{ position: 'relative', width: '64px', height: '64px', marginBottom: '14px' }}>
            <div style={{ position: 'absolute', top: 0, left: '6px', width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }}></div>
            <div style={{ position: 'absolute', bottom: 0, right: '6px', width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }}></div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '24px' }}>💬</div>
          </div>

          <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 'bold', marginBottom: '4px' }}>Chat Rooms</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', textAlign: 'center' }}>
            Hey, {auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0]}! Pick a room 👋
          </p>
        </div>

        {/* Content */}
        <div style={{ background: cardBg, padding: '24px' }}>

          {/* Create room input */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="New room name..."
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createRoom()}
              style={{
                flex: 1,
                border: `1.5px solid ${inputBorder}`,
                borderRadius: '12px',
                padding: '10px 14px',
                background: inputBg,
                color: inputColor,
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              onClick={createRoom}
              style={{
                background: 'linear-gradient(135deg, #4a9e8e, #5bb5a2)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(74,158,142,0.25)'
              }}
            >
              + Add
            </button>
          </div>

          {/* Room list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: rooms.length > 3 ? 'auto' : 'visible', overflowX: 'hidden', padding: '2px' }}>
            {rooms.length === 0 && (
              <p style={{ color: subText, fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>No rooms yet — create one!</p>
            )}
            {rooms.map(room => (
              <button
                key={room.id}
                onClick={() => handleJoinRoom(room)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: roomBg,
                  border: `1.5px solid ${roomBorder}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #4a9e8e, #5bb5a2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(74,158,142,0.2)'
                  }}>
                    💬
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: roomText, fontWeight: 'bold', fontSize: '15px', textTransform: 'capitalize', margin: 0 }}>{room.name}</p>
                    <p style={{ color: subText, fontSize: '11px', margin: '2px 0 0' }}>Tap to join →</p>
                  </div>
                  {unreadRooms[room.id] > 0 ? (
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: '#ef4444',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '11px', fontWeight: 'bold'
                    }}>
                      {unreadRooms[room.id] > 9 ? '9+' : unreadRooms[room.id]}
                    </div>
                  ) : (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80' }}></div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Sign out */}
          <button
            onClick={() => signOut(auth)}
            style={{
              width: '100%',
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'transparent',
              border: '1.5px solid rgba(239,68,68,0.3)',
              color: '#ef4444',
              fontWeight: '600',
              padding: '12px',
              borderRadius: '14px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatRoomList