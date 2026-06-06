import { useEffect, useState } from 'react'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Login from './Login'
import ChatRoomList from './ChatRoomList'
import ChatRoom from './ChatRoom'
import { ThemeContext } from './ThemeContext'



function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentRoom, setCurrentRoom] = useState(null)
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0d1b2e' }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Loading...</div>
      </div>
    )
  }

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      <div>
        {!user ? (
          <Login darkMode={darkMode} setDarkMode={setDarkMode} />
        ) : currentRoom ? (
          <ChatRoom room={currentRoom} onBack={() => setCurrentRoom(null)} darkMode={darkMode} setDarkMode={setDarkMode} />
        ) : (
          <ChatRoomList onJoinRoom={(room) => setCurrentRoom(room)} darkMode={darkMode} setDarkMode={setDarkMode} />
        )}
      </div>
    </ThemeContext.Provider>
  )
}

export default App