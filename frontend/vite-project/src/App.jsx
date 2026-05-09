import { useState } from 'react'
import './App.css'
import GalleryPage from '../component/GalleryPage'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <GalleryPage></GalleryPage>
    </>
  )
}

export default App
