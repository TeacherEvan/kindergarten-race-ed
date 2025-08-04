import { memo, useMemo } from 'react'
import { GameObject } from '../hooks/use-game-logic'

interface FallingObjectProps {
  object: GameObject
  onTap: (objectId: string, playerSide: 'left' | 'right') => void
  playerSide: 'left' | 'right'
}

export const FallingObject = memo(({ object, onTap, playerSide }: FallingObjectProps) => {
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onTap(object.id, playerSide)
  }

  // Memoize style calculations to prevent recalculation on every render
  const objectStyle = useMemo(() => ({
    left: `${object.x}%`,
    top: `${object.y}px`,
    fontSize: `${object.size}px`,
    transform: `scale(var(--object-scale, 1))`,
    lineHeight: 1,
    zIndex: 10
  }), [object.x, object.y, object.size])

  return (
    <div
      className="absolute cursor-pointer select-none hover:scale-110 transition-transform duration-150 will-change-transform"
      style={objectStyle}
      onClick={handleClick}
      onTouchStart={handleClick}
    >
      <div className="drop-shadow-lg hover:drop-shadow-xl transition-all duration-150">
        {object.emoji}
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.object.id === nextProps.object.id &&
    prevProps.object.x === nextProps.object.x &&
    prevProps.object.y === nextProps.object.y &&
    prevProps.playerSide === nextProps.playerSide
  )
})