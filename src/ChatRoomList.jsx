import { useState, useEffect } from 'react'
import { db, auth } from './firebase'
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { signOut } from 'firebase/auth'

function ChatRoomList({ onJoinRoom }) {
  const [rooms, setRooms] = useState([])
  const [newRoom, setNewRoom] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsub()
  }, [])

  const createRoom = async () => {
    if (!newRoom.trim()) return
    await addDoc(collection(db, 'rooms'), {
      name: newRoom.trim(),
      createdAt: serverTimestamp()
    })
    setNewRoom('')
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#0d1b2e] overflow-hidden py-8">

      {/* Background circles */}
      <div className="absolute top-[-80px] left-[-80px] w-64 h-64 rounded-full bg-[#1a3a5c] opacity-60"></div>
      <div className="absolute bottom-[-80px] right-[-80px] w-64 h-64 rounded-full bg-[#1a3a5c] opacity-60"></div>
      <div className="absolute top-16 right-16 w-4 h-4 rounded-full bg-blue-400 opacity-50"></div>
      <div className="absolute bottom-24 left-16 w-3 h-3 rounded-full bg-blue-300 opacity-40"></div>

      {/* Card */}
      <div className="relative bg-white/10 backdrop-blur-md border border-white/20 w-full max-w-xs mx-4 rounded-3xl shadow-2xl overflow-hidden z-10">

        {/* Header */}
        <div className="bg-[#1a3a5c] px-8 pt-8 pb-6 flex flex-col items-center">
          <div className="relative w-16 h-16 mb-3">
            <div className="absolute top-0 left-2 w-10 h-10 rounded-full bg-[#e8845a] opacity-90"></div>
            <div className="absolute bottom-0 right-2 w-10 h-10 rounded-full bg-[#4ab8b8] opacity-80"></div>
          </div>
          <h2 className="text-white text-xl font-bold mb-1">Chat Rooms 💬</h2>
          <p className="text-gray-400 text-xs text-center">
            Hey, {auth.currentUser?.displayName?.split(' ')[0]}! Pick a room to join
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 bg-white/80 backdrop-blur-sm">

          {/* Create room input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="New room name..."
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createRoom()}
              className="flex-1 border border-white/40 rounded-xl px-4 py-2 bg-white/70 backdrop-blur-sm text-gray-700 text-sm outline-none focus:border-blue-400"
            />
            <button
              onClick={createRoom}
              className="bg-[#0d1b2e] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#1a3a5c] transition"
            >
              + Add
            </button>
          </div>

          {/* Room list */}
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
            {rooms.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">No rooms yet — create one!</p>
            )}
            {rooms.map(room => (
  <button
    key={room.id}
    onClick={() => onJoinRoom(room)}
    className="w-full text-left px-4 py-4 rounded-2xl bg-white border border-gray-100 hover:bg-blue-50 hover:border-blue-300 transition shadow-sm group"
  >
    <div className="flex items-center gap-3">
     <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a3a5c] to-[#0d1b2e] flex items-center justify-center text-lg shadow-md group-hover:scale-110 transition duration-300">
  💬
</div>
      <div>
        <p className="text-[#0d1b2e] font-bold text-base capitalize tracking-wide">{room.name}</p>
<p className="text-gray-400 text-xs font-medium">Tap to join →</p>
      </div>
      <span className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
    </div>
  </button>
))}
          </div>

          {/* Sign out */}
          <button
  onClick={() => signOut(auth)}
  className="w-full mt-4 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 font-semibold py-3 rounded-xl transition duration-200"
>
  Sign Out
</button>
        </div>
      </div>
    </div>
  )
}

export default ChatRoomList