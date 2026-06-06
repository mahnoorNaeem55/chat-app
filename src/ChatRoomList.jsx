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

  const bg = darkMode ? '#0d1b2e' : '#f0f4f8'
  const cardBg = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.95)'
  const headerBg = darkMode ? '#1a3a5c' : '#1a3a5c'
  const roomBg = darkMode ? 'rgba(255,255,255,0.05)' : 'white'
  const roomBorder = darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'
  const roomText = darkMode ? 'white' : '#0d1b2e'
  const subText = darkMode ? 'rgba(255,255,255,0.5)' : '#6b7280'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: bg, padding: '32px 16px', position: 'relative', overflow: 'hidden' }}>

      {/* Background circles */}
      <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '256px', height: '256px', borderRadius: '50%', background: '#1a3a5c', opacity: 0.6 }}></div>
      <div style={{ position: 'absolute', bottom: '-80px', right: '-80px', width: '256px', height: '256px', borderRadius: '50%', background: '#1a3a5c', opacity: 0.6 }}></div>
      <div style={{ position: 'absolute', top: '64px', right: '64px', width: '16px', height: '16px', borderRadius: '50%', background: '#60a5fa', opacity: 0.5 }}></div>
      <div style={{ position: 'absolute', bottom: '96px', left: '64px', width: '12px', height: '12px', borderRadius: '50%', background: '#93c5fd', opacity: 0.4 }}></div>

      {/* Card */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '320px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', zIndex: 10 }}>

        {/* Header */}
        <div style={{ background: headerBg, padding: '32px 32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <div style={{ position: 'relative', width: '64px', height: '64px', marginBottom: '12px' }}>
            <div style={{ position: 'absolute', top: 0, left: '8px', width: '40px', height: '40px', borderRadius: '50%', background: '#e8845a' }}></div>
            <div style={{ position: 'absolute', bottom: 0, right: '8px', width: '40px', height: '40px', borderRadius: '50%', background: '#4ab8b8' }}></div>
          </div>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>Chat Rooms 💬</h2>
          <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center' }}>
            Hey, {auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0]}! Pick a room to join
          </p>
        </div>

        {/* Content */}
        <div style={{ background: cardBg, padding: '24px' }}>

          {/* Create room */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="New room name..."
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createRoom()}
              style={{ flex: 1, border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '8px 16px', background: darkMode ? 'rgba(255,255,255,0.1)' : 'white', color: darkMode ? 'white' : '#0d1b2e', fontSize: '14px', outline: 'none' }}
            />
            <button
              onClick={createRoom}
              style={{ background: '#0d1b2e', color: 'white', border: 'none', borderRadius: '12px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
            >
              + Add
            </button>
          </div>

          {/* Room list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
            {rooms.length === 0 && (
              <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>No rooms yet — create one!</p>
            )}
            {rooms.map(room => (
              <button
                key={room.id}
                onClick={() => handleJoinRoom(room)}
                style={{ width: '100%', textAlign: 'left', padding: '16px', borderRadius: '16px', background: roomBg, border: `1px solid ${roomBorder}`, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #1a3a5c, #0d1b2e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                    💬
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: roomText, fontWeight: 'bold', fontSize: '15px', textTransform: 'capitalize', margin: 0 }}>{room.name}</p>
                    <p style={{ color: subText, fontSize: '11px', margin: 0 }}>Tap to join →</p>
                  </div>
                  {unreadRooms[room.id] > 0 ? (
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 'bold' }}>
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
            style={{ width: '100%', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: darkMode ? 'rgba(239,68,68,0.1)' : '#fff1f2', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontWeight: '600', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatRoomList