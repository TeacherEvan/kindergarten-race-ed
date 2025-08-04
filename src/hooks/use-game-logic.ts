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
      { emoji: "🔴", name: "apple" }, // Using red circle to represent dark red apple, distinct from tomato
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
      // Prevent performance bottlenecks by limiting objects on screen
      if (gameObjects.length > 20) {
        eventTracker.trackWarning('Too many objects on screen, skipping spawn', { 
          currentCount: gameObjects.length 
        })
        return
      }

      // Spawn 2-4 objects at once for better density without performance hit
      const spawnCount = Math.floor(Math.random() * 3) + 2 // 2-4 objects
      const newObjects: GameObject[] = []
      
      for (let i = 0; i < spawnCount; i++) {
        const randomItem = currentCategory.items[Math.floor(Math.random() * currentCategory.items.length)]
        const newObject: GameObject = {
          id: `obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: randomItem.name,
          emoji: randomItem.emoji,
          x: Math.random() * 80 + 10, // 10% to 90% of screen width
          y: -100 - (i * 50), // Stagger vertical positions to avoid overlap
          speed: Math.random() * 1.2 + 0.8, // Optimized speed: 0.8-2.0
          size: 60
        }
        newObjects.push(newObject)
        
        // Track each object spawn
        eventTracker.trackObjectSpawn(randomItem.name, { x: newObject.x, y: newObject.y })
      }
      
      setGameObjects(prev => [...prev, ...newObjects])
    } catch (error) {
      eventTracker.trackError(error as Error, 'spawnObject')
    }
  }, [currentCategory, gameObjects.length])

  const updateObjects = useCallback(() => {
    try {
      setGameObjects(prev => 
        prev
          .map(obj => ({ ...obj, y: obj.y + obj.speed * 1.2 })) // Optimized movement speed
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

      const oldState = { ...gameState }
      
      setGameState(prev => {
        const newState = { ...prev }
        
        if (isCorrect) {
          // Correct tap: move forward
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
          if (currentCategory.requiresSequence) {
            const nextIndex = (currentCategory.sequenceIndex || 0) + 1
            GAME_CATEGORIES[gameState.level].sequenceIndex = nextIndex
            
            if (nextIndex < currentCategory.items.length) {
              const nextTarget = generateRandomTarget()
              newState.currentTarget = nextTarget.name
              newState.targetEmoji = nextTarget.emoji
              eventTracker.trackGameStateChange(oldState, newState, 'sequence_advance')
            }
          }
        } else {
          // Incorrect tap: move backward by the same amount
          if (playerSide === 'left') {
            newState.player1Progress = Math.max(prev.player1Progress - 10, 0)
          } else {
            newState.player2Progress = Math.max(prev.player2Progress - 10, 0)
          }
          
          eventTracker.trackGameStateChange(oldState, newState, 'incorrect_tap_penalty')
        }

        return newState
      })

      // Remove the tapped object regardless of correct/incorrect
      setGameObjects(prev => prev.filter(obj => obj.id !== objectId))
    } catch (error) {
      eventTracker.trackError(error as Error, 'handleObjectTap')
    }
  }, [gameObjects, gameState.currentTarget, gameState.targetEmoji, currentCategory, generateRandomTarget, setGameState, gameState])

  const startGame = useCallback(() => {
    try {
      const target = generateRandomTarget()
      const oldState = { ...gameState }
      
      // Reset performance metrics for accurate tracking
      eventTracker.resetPerformanceMetrics()
      
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
    
    // Reset performance metrics
    eventTracker.resetPerformanceMetrics()
    
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

  // Spawn objects - Optimized for better performance with 350ms intervals
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner) return

    // Use 350ms intervals as requested for optimal performance
    const interval = setInterval(spawnObject, 350)
    return () => clearInterval(interval)
  }, [gameState.gameStarted, gameState.winner, spawnObject])

  // Update object positions using requestAnimationFrame for better performance
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner) return

    let animationId: number
    const animate = () => {
      updateObjects()
      animationId = requestAnimationFrame(animate)
    }
    
    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
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