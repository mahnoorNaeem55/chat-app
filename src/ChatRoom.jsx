import EmojiPicker from 'emoji-picker-react'
import { useState, useEffect, useRef } from 'react'
import { db, auth } from './firebase'
import {
  collection, addDoc, onSnapshot,
  serverTimestamp, query, orderBy,
  doc, setDoc, deleteDoc
} from 'firebase/firestore'

function ChatRoom({ room, onBack, darkMode }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [onlineUsers, setOnlineUsers] = useState([])
  const [showUsers, setShowUsers] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const bottomRef = useRef(null)
  const isFirstLoad = useRef(true)
  const audioContext = useRef(null)

  const playNotification = () => {
    try {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      const ctx = audioContext.current
      if (ctx.state === 'suspended') ctx.resume()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.frequency.setValueAtTime(587, ctx.currentTime)
      oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.1)
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.4)
    } catch(e) {
      console.log('Audio error:', e)
    }
  }

  useEffect(() => {
    const presenceRef = doc(db, 'rooms', room.id, 'presence', auth.currentUser.uid)
    setDoc(presenceRef, {
      displayName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
      email: auth.currentUser.email,
      joinedAt: serverTimestamp()
    })
    return () => { deleteDoc(presenceRef) }
  }, [room.id])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'rooms', room.id, 'presence'), (snapshot) => {
      setOnlineUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsub()
  }, [room.id])

  useEffect(() => {
    const q = query(collection(db, 'rooms', room.id, 'messages'), orderBy('createdAt'))
    const unsub = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      if (!isFirstLoad.current) {
        const lastMsg = newMessages[newMessages.length - 1]
        if (lastMsg && lastMsg.uid !== auth.currentUser.uid) {
          playNotification()
        }
      }
      isFirstLoad.current = false
      setMessages(newMessages)
    })
    return () => unsub()
  }, [room.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const deleteMessage = async (messageId) => {
    await deleteDoc(doc(db, 'rooms', room.id, 'messages', messageId))
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    await addDoc(collection(db, 'rooms', room.id, 'messages'), {
      text: newMessage.trim(),
      createdAt: serverTimestamp(),
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0]
    })
    setNewMessage('')
  }

  // Theme colors
  const bg = darkMode ? '#0d1b2e' : '#f0f4f8'
  const msgAreaBg = darkMode ? 'transparent' : '#f8fafc'
  const inputBarBg = darkMode ? '#1a3a5c' : '#ffffff'
  const inputBg = darkMode ? 'rgba(255,255,255,0.1)' : '#f1f5f9'
  const inputBorder = darkMode ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0'
  const inputColor = darkMode ? 'white' : '#0d1b2e'
  const otherMsgBg = darkMode ? 'rgba(255,255,255,0.1)' : 'white'
  const otherMsgColor = darkMode ? 'white' : '#0d1b2e'
  const otherMsgBorder = darkMode ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: bg, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ background: '#1a3a5c', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
        <button onClick={onBack} style={{ color: 'white', fontSize: '20px', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', width: '38px', height: '38px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>←</button>
        <div style={{ position: 'relative', width: '32px', height: '32px', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 0, left: '4px', width: '20px', height: '20px', borderRadius: '50%', background: '#e8845a' }}></div>
          <div style={{ position: 'absolute', bottom: 0, right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: '#4ab8b8' }}></div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', textTransform: 'capitalize' }}>{room.name}</div>
          <div style={{ color: '#4ade80', fontSize: '11px' }}>{onlineUsers.length} online now</div>
        </div>
        <button
          onClick={() => setShowUsers(!showUsers)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', color: 'white', fontSize: '12px' }}
        >
          {onlineUsers.slice(0, 3).map((u, i) => (
            <div key={i} style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #60a5fa, #4ab8b8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', color: 'white', marginLeft: i > 0 ? '-6px' : 0, border: '2px solid #1a3a5c' }}>
              {u.displayName?.[0]?.toUpperCase()}
            </div>
          ))}
          <span style={{ marginLeft: '4px' }}>{onlineUsers.length}</span>
        </button>
      </div>

      {/* Online users dropdown */}
      {showUsers && (
        <div style={{ background: '#163354', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
          <div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Online in this room</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {onlineUsers.map((u) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80' }}></div>
                <span style={{ color: 'white', fontSize: '12px' }}>{u.displayName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: msgAreaBg }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>No messages yet — say hello! 👋</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.uid === auth.currentUser.uid
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              <span style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px', padding: '0 4px' }}>{msg.displayName}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isMe && (
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '12px', opacity: 0.7, padding: '2px 6px' }}
                    title="Delete message"
                  >
                    🗑
                  </button>
                )}
                <div style={{
                  maxWidth: '280px', padding: '10px 16px',
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isMe ? '#2563eb' : otherMsgBg,
                  color: isMe ? 'white' : otherMsgColor,
                  fontSize: '14px',
                  border: isMe ? 'none' : otherMsgBorder
                }}>
                  {msg.text}
                </div>
              </div>
              <span style={{ color: '#6b7280', fontSize: '11px', marginTop: '4px', padding: '0 4px' }}>
                {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background: inputBarBg, padding: '12px 16px 24px', flexShrink: 0, borderTop: darkMode ? 'none' : '1px solid #e2e8f0' }}>
        {showEmoji && (
          <div style={{ marginBottom: '8px' }}>
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                setNewMessage(prev => prev + emojiData.emoji)
                setShowEmoji(false)
              }}
              width="100%"
              height={350}
              theme={darkMode ? 'dark' : 'light'}
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            style={{ background: inputBg, border: inputBorder, borderRadius: '12px', padding: '12px', cursor: 'pointer', fontSize: '20px', flexShrink: 0 }}
          >
            😄
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            style={{ flex: 1, background: inputBg, border: inputBorder, borderRadius: '12px', padding: '12px 16px', color: inputColor, fontSize: '14px', outline: 'none' }}
          />
          <button
            onClick={sendMessage}
            style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 20px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', flexShrink: 0 }}
          >
            Send 📤
          </button>
        </div>
      </div>

    </div>
  )
}

export default ChatRoom