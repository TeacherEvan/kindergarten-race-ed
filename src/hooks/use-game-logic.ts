import { useState, useEffect, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { eventTracker } from '../lib/event-tracker'

export interface GameObject {
  id: string
  type: string
  emoji: string
  x: number
  y: number
  speed: number
  size: number
}

export interface GameState {
  player1Progress: number
  player2Progress: number
  currentTarget: string
  targetEmoji: string
  level: number
  gameStarted: boolean
  winner: number | null
  targetChangeTime: number
}

export interface GameCategory {
  name: string
  items: { emoji: string; name: string }[]
  requiresSequence?: boolean
  sequenceIndex?: number
}

export const GAME_CATEGORIES: GameCategory[] = [
  {
    name: "Fruits & Vegetables",
    items: [
      { emoji: "🍎", name: "apple" },
      { emoji: "🍌", name: "banana" },
      { emoji: "🍇", name: "grapes" },
      { emoji: "🍓", name: "strawberry" },
      { emoji: "🥕", name: "carrot" },
      { emoji: "🥒", name: "cucumber" },
      { emoji: "🍅", name: "tomato" },
      { emoji: "🥬", name: "lettuce" }
    ]
  },
  {
    name: "Numbers & Shapes",
    items: [
      { emoji: "1️⃣", name: "one" },
      { emoji: "2️⃣", name: "two" },
      { emoji: "3️⃣", name: "three" },
      { emoji: "4️⃣", name: "four" },
      { emoji: "5️⃣", name: "five" },
      { emoji: "🔵", name: "circle" },
      { emoji: "🟦", name: "square" },
      { emoji: "🔺", name: "triangle" }
    ]
  },
  {
    name: "Alphabet Challenge",
    items: [
      { emoji: "🅰️", name: "A" },
      { emoji: "🅱️", name: "B" },
      { emoji: "🔤", name: "C" },
      { emoji: "🔡", name: "D" },
      { emoji: "🔠", name: "E" }
    ],
    requiresSequence: true,
    sequenceIndex: 0
  }
]

export const useGameLogic = () => {
  const [gameObjects, setGameObjects] = useState<GameObject[]>([])
  const [gameState, setGameState] = useKV<GameState>('kindergarten-race-state', {
    player1Progress: 0,
    player2Progress: 0,
    currentTarget: "",
    targetEmoji: "",
    level: 0,
    gameStarted: false,
    winner: null,
    targetChangeTime: Date.now() + 10000
  })

  const currentCategory = GAME_CATEGORIES[gameState.level] || GAME_CATEGORIES[0]

  const generateRandomTarget = useCallback(() => {
    if (currentCategory.requiresSequence) {
      const sequenceIndex = currentCategory.sequenceIndex || 0
      const targetItem = currentCategory.items[sequenceIndex % currentCategory.items.length]
      return { name: targetItem.name, emoji: targetItem.emoji }
    } else {
      const randomItem = currentCategory.items[Math.floor(Math.random() * currentCategory.items.length)]
      return { name: randomItem.name, emoji: randomItem.emoji }
    }
  }, [currentCategory])

  const spawnObject = useCallback(() => {
    try {
      const randomItem = currentCategory.items[Math.floor(Math.random() * currentCategory.items.length)]
      const newObject: GameObject = {
        id: `obj-${Date.now()}-${Math.random()}`,
        type: randomItem.name,
        emoji: randomItem.emoji,
        x: Math.random() * 80 + 10, // 10% to 90% of screen width
        y: -100,
        speed: Math.random() * 1.5 + 0.5, // Slower: 0.5-2 speed (was 1-3)
        size: 60
      }
      
      setGameObjects(prev => [...prev, newObject])
      
      // Track object spawn
      eventTracker.trackObjectSpawn(randomItem.name, { x: newObject.x, y: newObject.y })
    } catch (error) {
      eventTracker.trackError(error as Error, 'spawnObject')
    }
  }, [currentCategory])

  const updateObjects = useCallback(() => {
    try {
      setGameObjects(prev => 
        prev
          .map(obj => ({ ...obj, y: obj.y + obj.speed * 1.5 })) // Slower movement (was * 2)
          .filter(obj => obj.y < window.innerHeight + 100)
      )
    } catch (error) {
      eventTracker.trackError(error as Error, 'updateObjects')
    }
  }, [])

  const handleObjectTap = useCallback((objectId: string, playerSide: 'left' | 'right') => {
    const tapStartTime = performance.now()
    
    try {
      const tappedObject = gameObjects.find(obj => obj.id === objectId)
      if (!tappedObject) {
        eventTracker.trackWarning('Tapped object not found', { objectId, playerSide })
        return
      }

      const isCorrect = currentCategory.requiresSequence 
        ? tappedObject.type === gameState.currentTarget
        : tappedObject.emoji === gameState.targetEmoji

      const tapLatency = performance.now() - tapStartTime
      eventTracker.trackObjectTap(objectId, isCorrect, playerSide, tapLatency)

      if (isCorrect) {
        const oldState = { ...gameState }
        
        setGameState(prev => {
          const newState = { ...prev }
          
          if (playerSide === 'left') {
            newState.player1Progress = Math.min(prev.player1Progress + 10, 100)
          } else {
            newState.player2Progress = Math.min(prev.player2Progress + 10, 100)
          }

          // Check for winner
          if (newState.player1Progress >= 100) {
            newState.winner = 1
            eventTracker.trackGameStateChange(oldState, newState, 'player1_wins')
          } else if (newState.player2Progress >= 100) {
            newState.winner = 2
            eventTracker.trackGameStateChange(oldState, newState, 'player2_wins')
          }

          // Advance sequence for alphabet level
          if (currentCategory.requiresSequence && isCorrect) {
            const nextIndex = (currentCategory.sequenceIndex || 0) + 1
            GAME_CATEGORIES[gameState.level].sequenceIndex = nextIndex
            
            if (nextIndex < currentCategory.items.length) {
              const nextTarget = generateRandomTarget()
              newState.currentTarget = nextTarget.name
              newState.targetEmoji = nextTarget.emoji
              eventTracker.trackGameStateChange(oldState, newState, 'sequence_advance')
            }
          }

          return newState
        })

        // Remove the tapped object
        setGameObjects(prev => prev.filter(obj => obj.id !== objectId))
      }
    } catch (error) {
      eventTracker.trackError(error as Error, 'handleObjectTap')
    }
  }, [gameObjects, gameState.currentTarget, gameState.targetEmoji, currentCategory, generateRandomTarget, setGameState, gameState])

  const startGame = useCallback(() => {
    try {
      const target = generateRandomTarget()
      const oldState = { ...gameState }
      
      setGameState(prev => ({
        ...prev,
        gameStarted: true,
        currentTarget: target.name,
        targetEmoji: target.emoji,
        targetChangeTime: Date.now() + 10000,
        winner: null,
        player1Progress: 0,
        player2Progress: 0
      }))
      
      eventTracker.trackGameStateChange(oldState, gameState, 'game_start')
    } catch (error) {
      eventTracker.trackError(error as Error, 'startGame')
    }
  }, [generateRandomTarget, setGameState, gameState])

  const nextLevel = useCallback(() => {
    const newLevel = Math.min(gameState.level + 1, GAME_CATEGORIES.length - 1)
    GAME_CATEGORIES[newLevel].sequenceIndex = 0 // Reset sequence
    
    const target = generateRandomTarget()
    setGameState(prev => ({
      ...prev,
      level: newLevel,
      gameStarted: true,
      currentTarget: target.name,
      targetEmoji: target.emoji,
      targetChangeTime: Date.now() + 10000,
      winner: null,
      player1Progress: 0,
      player2Progress: 0
    }))
    setGameObjects([])
  }, [gameState.level, generateRandomTarget, setGameState])

  const resetGame = useCallback(() => {
    GAME_CATEGORIES.forEach(cat => { cat.sequenceIndex = 0 })
    const target = generateRandomTarget()
    setGameState({
      player1Progress: 0,
      player2Progress: 0,
      currentTarget: target.name,
      targetEmoji: target.emoji,
      level: 0,
      gameStarted: false,
      winner: null,
      targetChangeTime: Date.now() + 10000
    })
    setGameObjects([])
  }, [generateRandomTarget, setGameState])

  // Update target every 10 seconds (except for sequence mode)
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner || currentCategory.requiresSequence) return

    const interval = setInterval(() => {
      if (Date.now() >= gameState.targetChangeTime) {
        const target = generateRandomTarget()
        setGameState(prev => ({
          ...prev,
          currentTarget: target.name,
          targetEmoji: target.emoji,
          targetChangeTime: Date.now() + 10000
        }))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [gameState.gameStarted, gameState.winner, gameState.targetChangeTime, currentCategory.requiresSequence, generateRandomTarget, setGameState])

  // Spawn objects - More frequent spawning for increased density
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner) return

    const interval = setInterval(spawnObject, 800) // Faster spawning: 800ms (was 1500ms)
    return () => clearInterval(interval)
  }, [gameState.gameStarted, gameState.winner, spawnObject])

  // Update object positions
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner) return

    const interval = setInterval(updateObjects, 16) // ~60fps
    return () => clearInterval(interval)
  }, [gameState.gameStarted, gameState.winner, updateObjects])

  return {
    gameObjects,
    gameState,
    currentCategory,
    handleObjectTap,
    startGame,
    nextLevel,
    resetGame
  }
}