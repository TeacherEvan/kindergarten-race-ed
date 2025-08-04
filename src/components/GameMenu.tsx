import { memo } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface GameMenuProps {
  onStartGame: () => void
  onNextLevel?: () => void
  onResetGame: () => void
  gameStarted: boolean
  winner: number | null
  level: number
  categoryName: string
  maxLevel: number
}

export const GameMenu = memo(({ 
  onStartGame, 
  onNextLevel, 
  onResetGame, 
  gameStarted, 
  winner, 
  level, 
  categoryName,
  maxLevel 
}: GameMenuProps) => {
  if (gameStarted && !winner) return null

  return (
    <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="p-8 max-w-md mx-4 text-center bg-card shadow-2xl border-4 border-primary/20">
        {!gameStarted ? (
          <>
            <div className="text-6xl mb-4">🏁</div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              Kindergarten Race
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Ready to race? Tap the correct objects to move your turtle forward!
            </p>
            <div className="mb-6">
              <div className="text-sm font-semibold text-accent mb-2">
                Current Level: {level + 1}
              </div>
              <div className="text-lg font-medium text-foreground">
                {categoryName}
              </div>
            </div>
            <Button 
              onClick={onStartGame}
              size="lg"
              className="text-xl px-8 py-4 font-bold"
            >
              🚀 Start Race!
            </Button>
          </>
        ) : winner ? (
          <>
            <div className="text-8xl mb-4 celebrate">🎉</div>
            <h2 className="text-3xl font-bold text-success mb-2">
              Player {winner} Wins!
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Great job! What would you like to do next?
            </p>
            <div className="space-y-3">
              {level < maxLevel - 1 && onNextLevel && (
                <Button 
                  onClick={onNextLevel}
                  size="lg"
                  className="w-full text-lg font-bold"
                  variant="default"
                >
                  🎯 Next Level
                </Button>
              )}
              <Button 
                onClick={onResetGame}
                size="lg"
                className="w-full text-lg font-bold"
                variant="secondary"
              >
                🔄 Play Again
              </Button>
            </div>
          </>
        ) : null}
      </Card>
    </div>
  )
})