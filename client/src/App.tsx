import { Routes, Route, Navigate } from 'react-router-dom'
import MenuScreen from '@/ui/screens/MenuScreen'
import GameScreen from '@/ui/screens/GameScreen'
import GameOverScreen from '@/ui/screens/GameOverScreen'

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
        <Route path="/" element={<MenuScreen />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="/gameover" element={<GameOverScreen />} />
        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
