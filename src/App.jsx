import { useEffect, useState } from 'react'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Login from './Login'
import ChatRoomList from './ChatRoomList'
import ChatRoom from './ChatRoom'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentRoom, setCurrentRoom] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d1b2e]">
        <div className="text-white text-lg animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      {!user ? (
        <Login />
      ) : currentRoom ? (
        <ChatRoom room={currentRoom} onBack={() => setCurrentRoom(null)} />
      ) : (
        <ChatRoomList onJoinRoom={(room) => setCurrentRoom(room)} />
      )}
    </div>
  )
}

export default App