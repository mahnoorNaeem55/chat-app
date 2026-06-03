import { db } from './firebase'
import { collection, getDocs } from 'firebase/firestore'
import { useEffect } from 'react'

function App() {
  useEffect(() => {
    const test = async () => {
      const querySnapshot = await getDocs(collection(db, 'test'))
      console.log('Firebase connected! ✅')
    }
    test()
  }, [])

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <h1 className="text-white text-3xl font-bold">Chat App 🔥</h1>
    </div>
  )
}

export default App