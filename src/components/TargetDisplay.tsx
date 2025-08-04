import { memo } from 'react'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { GameCategory } from '../hooks/use-game-logic'

interface TargetDisplayProps {
  currentTarget: string
  targetEmoji: string
  category: GameCategory
  timeRemaining?: number
}

export const TargetDisplay = memo(({ currentTarget, targetEmoji, category, timeRemaining }: TargetDisplayProps) => {
  return (
    <Card className="bg-accent text-accent-foreground p-6 shadow-lg border-4 border-accent/30">
      <div className="text-center">
        <Badge variant="secondary" className="mb-3 text-sm font-semibold">
          {category.name}
        </Badge>
        
        <div className="text-center mb-3">
          <div className="text-6xl mb-2 bounce-in" key={targetEmoji}>
            {targetEmoji}
          </div>
          <div className="text-xl font-bold">
            Find: {currentTarget}
          </div>
        </div>

        {category.requiresSequence && (
          <div className="text-sm font-medium opacity-90">
            📝 Tap in alphabetical order!
          </div>
        )}

        {timeRemaining !== undefined && timeRemaining > 0 && !category.requiresSequence && (
          <div className="mt-3">
            <div className="text-sm font-medium opacity-90">
              New target in: {Math.ceil(timeRemaining / 1000)}s
            </div>
            <div 
              className="h-2 bg-accent-foreground/20 rounded-full mt-1 overflow-hidden"
            >
              <div 
                className="h-full bg-accent-foreground/60 rounded-full transition-all duration-1000"
                style={{ width: `${(timeRemaining / 10000) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  )
})