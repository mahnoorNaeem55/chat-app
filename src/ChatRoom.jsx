import EmojiPicker from 'emoji-picker-react'
import { useState, useEffect, useRef } from 'react'
import { db, auth } from './firebase'
import {
  collection, addDoc, onSnapshot,
  serverTimestamp, query, orderBy,
  doc, setDoc, deleteDoc, getDoc
} from 'firebase/firestore'
import { ArrowLeft, Smile, Send, Pencil, Trash2, Reply, X } from 'lucide-react'

function ChatRoom({ room, onBack, darkMode }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [onlineUsers, setOnlineUsers] = useState([])
  const [showUsers, setShowUsers] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [hoveredMsgId, setHoveredMsgId] = useState(null)
  const [replyTo, setReplyTo] = useState(null)
  const [typingUsers, setTypingUsers] = useState([])
  const typingTimeoutRef = useRef(null)
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
    const unsub = onSnapshot(collection(db, 'rooms', room.id, 'typing'), (snapshot) => {
      const now = Date.now()
      const typing = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(t => t.id !== auth.currentUser.uid && t.timestamp && (now - t.timestamp.toMillis() < 3000))
      setTypingUsers(typing)
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

  const editMessage = async (messageId) => {
    if (!editText.trim()) return
    const messageRef = doc(db, 'rooms', room.id, 'messages', messageId)
    await setDoc(messageRef, { text: editText.trim(), edited: true }, { merge: true })
    setEditingId(null)
    setEditText('')
  }

  const addReaction = async (messageId, emoji) => {
    const messageRef = doc(db, 'rooms', room.id, 'messages', messageId)
    const freshDoc = await getDoc(messageRef)
    const freshData = freshDoc.data()
    const reactions = { ...(freshData?.reactions || {}) }
    const userReactions = reactions[emoji] || []
    if (userReactions.includes(auth.currentUser.uid)) {
      reactions[emoji] = userReactions.filter(uid => uid !== auth.currentUser.uid)
      if (reactions[emoji].length === 0) delete reactions[emoji]
    } else {
      reactions[emoji] = [...userReactions, auth.currentUser.uid]
    }
    await setDoc(messageRef, { reactions }, { merge: true })
  }

  const updateTypingStatus = async (isTyping) => {
    const typingRef = doc(db, 'rooms', room.id, 'typing', auth.currentUser.uid)
    if (isTyping) {
      await setDoc(typingRef, {
        displayName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
        timestamp: serverTimestamp()
      })
    } else {
      await deleteDoc(typingRef)
    }
  }

  const handleTyping = (value) => {
    setNewMessage(value)
    updateTypingStatus(true)

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false)
    }, 2000)
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    await addDoc(collection(db, 'rooms', room.id, 'messages'), {
      text: newMessage.trim(),
      createdAt: serverTimestamp(),
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
      replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, displayName: replyTo.displayName } : null
    })
    setNewMessage('')
    setReplyTo(null)
    updateTypingStatus(false)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
  }

  // Theme colors — warm soft light / deep dark teal
  const bg = darkMode ? '#042f2e' : '#f2f8f6'
  const headerBg = darkMode
    ? 'linear-gradient(135deg, #134e4a, #0f766e)'
    : 'linear-gradient(135deg, #4a9e8e, #5bb5a2)'
  const msgAreaBg = darkMode ? '#042f2e' : '#f2f8f6'
  const inputBarBg = darkMode ? '#0f2d2b' : 'white'
  const inputBg = darkMode ? 'rgba(255,255,255,0.08)' : '#f4faf8'
  const inputBorder = darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #c8e6e0'
  const inputColor = darkMode ? 'white' : '#3a8a7a'
  const myMsgBg = darkMode
    ? 'linear-gradient(135deg, #0f766e, #0d9488)'
    : 'linear-gradient(135deg, #4a9e8e, #5bb5a2)'
  const otherMsgBg = darkMode ? 'rgba(255,255,255,0.08)' : 'white'
  const otherMsgColor = darkMode ? 'white' : '#3a8a7a'
  const otherMsgBorder = darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #c8e6e0'
  const actionBarBg = darkMode ? '#134e4a' : 'white'
  const iconColor = darkMode ? 'rgba(255,255,255,0.7)' : '#4a9e8e'
  const dropdownBg = darkMode ? '#0f2d2b' : '#f4faf8'
  const timestampColor = darkMode ? 'rgba(255,255,255,0.35)' : '#8ec4bc'
  const nameColor = darkMode ? 'rgba(255,255,255,0.5)' : '#4a9e8e'
  const replyAccent = darkMode ? '#0d9488' : '#4a9e8e'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: bg, overflow: 'hidden' }}>

      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: headerBg, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, boxShadow: '0 4px 20px rgba(74,158,142,0.25)' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', width: '38px', height: '38px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ArrowLeft size={20} color="white" />
        </button>
        <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 0, left: '4px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }}></div>
          <div style={{ position: 'absolute', bottom: 0, right: '4px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></div>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '14px' }}>💬</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', textTransform: 'capitalize' }}>{room.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>{onlineUsers.length} online now</div>
        </div>
        <button
          onClick={() => setShowUsers(!showUsers)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '12px', padding: '6px 12px', cursor: 'pointer', color: 'white', fontSize: '12px' }}
        >
          {onlineUsers.slice(0, 3).map((u, i) => (
            <div key={i} style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', color: 'white', marginLeft: i > 0 ? '-6px' : 0, border: '2px solid rgba(74,158,142,0.4)' }}>
              {u.displayName?.[0]?.toUpperCase()}
            </div>
          ))}
          <span style={{ marginLeft: '4px' }}>{onlineUsers.length}</span>
        </button>
      </div>

      {/* Online users dropdown */}
      {showUsers && (
        <div style={{ background: dropdownBg, padding: '10px 16px', borderBottom: `1px solid ${inputBorder}`, flexShrink: 0 }}>
          <div style={{ color: nameColor, fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Online in this room</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {onlineUsers.map((u) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: darkMode ? 'rgba(255,255,255,0.08)' : 'white', padding: '4px 12px', borderRadius: '20px', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#c8e6e0'}` }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80' }}></div>
                <span style={{ color: darkMode ? 'white' : '#3a8a7a', fontSize: '12px' }}>{u.displayName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: msgAreaBg }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p style={{ color: nameColor, fontSize: '14px' }}>No messages yet — say hello! 👋</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.uid === auth.currentUser.uid
          const isHovered = hoveredMsgId === msg.id
          return (
            <div
              key={msg.id}
              style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginTop: '8px' }}
              onMouseEnter={() => setHoveredMsgId(msg.id)}
              onMouseLeave={() => setHoveredMsgId(null)}
            >
              <span style={{ color: nameColor, fontSize: '11px', marginBottom: '4px', padding: '0 4px', fontWeight: '500' }}>{msg.displayName}</span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>

                {/* Action bar */}
                <div style={{
                  position: 'absolute',
                  top: '-44px',
                  left: isMe ? 'auto' : '0',
                  right: isMe ? '0' : 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.2s',
                  background: actionBarBg,
                  borderRadius: '20px',
                  padding: '5px 10px',
                  boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(74,158,142,0.15)',
                  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#c8e6e0'}`,
                  zIndex: 10,
                  whiteSpace: 'nowrap'
                }}>
                  {['👍', '❤️', '😂', '😮', '😢'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => addReaction(msg.id, emoji)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '2px 4px', transition: 'transform 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {emoji}
                    </button>
                  ))}

                  <div style={{ width: '1px', height: '20px', background: darkMode ? 'rgba(255,255,255,0.15)' : '#c8e6e0', margin: '0 4px' }}></div>

                  <button
                    onClick={() => setReplyTo({ id: msg.id, text: msg.text, displayName: msg.displayName })}
                    title="Reply"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', transition: 'transform 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Reply size={15} color={iconColor} />
                  </button>

                  {isMe && (
                    <>
                      <button
                        onClick={() => { setEditingId(msg.id); setEditText(msg.text) }}
                        title="Edit"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', transition: 'transform 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <Pencil size={14} color={iconColor} />
                      </button>
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        title="Delete"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', transition: 'transform 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </>
                  )}
                </div>

                {/* Message bubble */}
                <div style={{
                  maxWidth: '280px',
                  padding: '10px 16px',
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isMe ? myMsgBg : otherMsgBg,
                  color: isMe ? 'white' : otherMsgColor,
                  fontSize: '14px',
                  border: isMe ? 'none' : otherMsgBorder,
                  boxShadow: isMe ? '0 4px 12px rgba(74,158,142,0.25)' : '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  {/* Reply preview */}
                  {msg.replyTo && (
                    <div style={{
                      background: isMe ? 'rgba(255,255,255,0.15)' : darkMode ? 'rgba(255,255,255,0.08)' : '#e8f5f2',
                      borderLeft: `3px solid ${isMe ? 'rgba(255,255,255,0.6)' : replyAccent}`,
                      borderRadius: '6px',
                      padding: '4px 8px',
                      marginBottom: '6px',
                      fontSize: '12px',
                      opacity: 0.9
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '2px', color: isMe ? 'white' : replyAccent }}>{msg.replyTo.displayName}</div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px', color: isMe ? 'rgba(255,255,255,0.8)' : '#3a8a7a' }}>{msg.replyTo.text}</div>
                    </div>
                  )}

                  {editingId === msg.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') editMessage(msg.id)
                          if (e.key === 'Escape') { setEditingId(null); setEditText('') }
                        }}
                        style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '8px', padding: '4px 8px', color: 'white', fontSize: '14px', outline: 'none', width: '100%' }}
                      />
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => { setEditingId(null); setEditText('') }}
                          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', padding: '2px 8px', color: 'white', fontSize: '11px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => editMessage(msg.id)}
                          style={{ background: 'white', border: 'none', borderRadius: '6px', padding: '2px 8px', color: '#4a9e8e', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span>
                      {msg.text}
                      {msg.edited && <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '6px' }}>(edited)</span>}
                    </span>
                  )}
                </div>
              </div>

              {/* Reactions display */}
              {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {Object.entries(msg.reactions).map(([emoji, uids]) => (
                    uids.length > 0 && (
                      <button
                        key={emoji}
                        onClick={() => addReaction(msg.id, emoji)}
                        title={uids.includes(auth.currentUser.uid) ? 'Click to remove' : 'Click to react'}
                        style={{
                          background: uids.includes(auth.currentUser.uid)
                            ? 'rgba(74,158,142,0.12)'
                            : darkMode ? 'rgba(255,255,255,0.08)' : 'white',
                          border: uids.includes(auth.currentUser.uid)
                            ? '1px solid #4a9e8e'
                            : darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #c8e6e0',
                          borderRadius: '12px', padding: '2px 8px', cursor: 'pointer',
                          fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                      >
                        {emoji} <span style={{ color: darkMode ? 'white' : '#3a8a7a', fontSize: '11px' }}>{uids.length}</span>
                      </button>
                    )
                  ))}
                </div>
              )}

              <span style={{ color: timestampColor, fontSize: '11px', marginTop: '2px', padding: '0 4px' }}>
                {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ background: inputBarBg, padding: '12px 16px 24px', flexShrink: 0, borderTop: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #c8e6e0' }}>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '0 4px' }}>
            <div style={{ display: 'flex', gap: '3px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: replyAccent, animation: 'typingBounce 1.4s infinite ease-in-out' }}></div>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: replyAccent, animation: 'typingBounce 1.4s infinite ease-in-out 0.2s' }}></div>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: replyAccent, animation: 'typingBounce 1.4s infinite ease-in-out 0.4s' }}></div>
            </div>
            <span style={{ color: nameColor, fontSize: '12px', fontStyle: 'italic' }}>
              {typingUsers.map(u => u.displayName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}

        {/* Reply preview */}
        {replyTo && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: darkMode ? 'rgba(255,255,255,0.08)' : '#e8f5f2',
            borderLeft: `3px solid ${replyAccent}`,
            borderRadius: '10px',
            padding: '8px 12px',
            marginBottom: '10px'
          }}>
            <div>
              <div style={{ color: replyAccent, fontSize: '11px', fontWeight: 'bold' }}>Replying to {replyTo.displayName}</div>
              <div style={{ color: darkMode ? 'rgba(255,255,255,0.6)' : '#3a8a7a', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>{replyTo.text}</div>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 4px' }}
            >
              <X size={16} color={darkMode ? 'rgba(255,255,255,0.5)' : replyAccent} />
            </button>
          </div>
        )}

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
            style={{ background: inputBg, border: inputBorder, borderRadius: '12px', padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <Smile size={20} color={iconColor} />
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            style={{ flex: 1, background: inputBg, border: inputBorder, borderRadius: '12px', padding: '12px 16px', color: inputColor, fontSize: '14px', outline: 'none' }}
          />
          <button
            onClick={sendMessage}
            style={{
              background: 'linear-gradient(135deg, #4a9e8e, #5bb5a2)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(74,158,142,0.3)'
            }}
          >
            <Send size={18} color="white" />
          </button>
        </div>
      </div>

    </div>
  )
}

export default ChatRoom