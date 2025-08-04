import { memo } from 'react'
import { GameObject } from '../hooks/use-game-logic'

interface FallingObjectProps {
  object: GameObject
  onTap: (objectId: string, playerSide: 'left' | 'right') => void
  playerSide: 'left' | 'right'
}

export const FallingObject = memo(({ object, onTap, playerSide }: FallingObjectProps) => {
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    onTap(object.id, playerSide)
  }

  return (
    <div
      className="absolute cursor-pointer select-none falling-object hover:scale-110 transition-transform duration-150"
      style={{
        left: `${object.x}%`,
        top: `${object.y}px`,
        fontSize: `calc(${object.size}px * var(--object-scale, 1))`, // Responsive object size
        lineHeight: 1,
        zIndex: 10,
        animationDuration: `calc(${(window.innerHeight + 200) / (object.speed * 1.5) / 60}s * var(--fall-speed-scale, 1))` // Responsive animation speed
      }}
      onClick={handleClick}
      onTouchStart={handleClick}
    >
      <div className="drop-shadow-lg hover:drop-shadow-xl transition-all duration-150">
        {object.emoji}
      </div>
    </div>
  )
})