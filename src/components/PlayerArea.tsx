import { memo } from 'react'
import { Card } from './ui/card'
import { Progress } from './ui/progress'

interface PlayerAreaProps {
  playerNumber: 1 | 2
  progress: number
  children: React.ReactNode
  isWinner: boolean
}

export const PlayerArea = memo(({ playerNumber, progress, children, isWinner }: PlayerAreaProps) => {
  const playerColor = playerNumber === 1 ? 'primary' : 'secondary'
  const borderColor = playerNumber === 1 ? 'border-primary' : 'border-secondary'

  return (
    <Card className={`relative h-full ${borderColor} border-4 game-area overflow-hidden`}>
      {/* Player Header */}
      <div className={`absolute top-4 left-4 right-4 z-20 ${isWinner ? 'celebrate' : ''}`}>
        <div className={`bg-${playerColor} text-${playerColor}-foreground px-4 py-2 rounded-full text-center font-bold text-lg shadow-lg`}>
          Player {playerNumber}
        </div>
        <div className="mt-2">
          <Progress 
            value={progress} 
            className="h-3 bg-white/50" 
          />
          <div className="text-center text-sm font-semibold mt-1 text-foreground/80">
            {Math.round(progress)}%
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="absolute inset-0 pt-24">
        {children}
      </div>

      {/* Turtle Character */}
      <div 
        className={`absolute left-1/2 transform -translate-x-1/2 text-6xl transition-all duration-500 ${progress > 95 ? 'turtle-hop' : ''}`}
        style={{ 
          bottom: `${Math.max(4, progress * 0.75)}%`,
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
        }}
      >
        🐢
      </div>

      {/* Finish Line */}
      <div className="absolute top-24 left-0 right-0 h-2 bg-gradient-to-r from-success via-accent to-success opacity-80 shadow-sm">
        <div className="h-full bg-white/20 animate-pulse"></div>
      </div>

      {/* Winner Overlay */}
      {isWinner && (
        <div className="absolute inset-0 bg-success/20 flex items-center justify-center z-30">
          <div className="text-center bounce-in">
            <div className="text-8xl mb-4">🏆</div>
            <div className={`text-3xl font-bold text-${playerColor} drop-shadow-lg`}>
              Winner!
            </div>
          </div>
        </div>
      )}
    </Card>
  )
})