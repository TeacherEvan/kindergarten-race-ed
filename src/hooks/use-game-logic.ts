import { useState, useEffect, useCallback } from 'react'
// import { useKV } from '@github/spark/hooks'
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

interface UseGameLogicOptions {
  fallSpeedMultiplier?: number
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
      { emoji: "6️⃣", name: "six" },
      { emoji: "7️⃣", name: "seven" },
      { emoji: "8️⃣", name: "eight" },
      { emoji: "9️⃣", name: "nine" },
      { emoji: "🔟", name: "ten" },
      { emoji: "11", name: "eleven" },
      { emoji: "12", name: "twelve" },
      { emoji: "13", name: "thirteen" },
      { emoji: "14", name: "fourteen" },
      { emoji: "15", name: "fifteen" },
      { emoji: "16", name: "sixteen" },
      { emoji: "17", name: "seventeen" },
      { emoji: "18", name: "eighteen" },
      { emoji: "19", name: "nineteen" },
      { emoji: "20", name: "twenty" },
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

export const useGameLogic = (options: UseGameLogicOptions = {}) => {
  const { fallSpeedMultiplier = 1 } = options
  const [gameObjects, setGameObjects] = useState<GameObject[]>([])
  const [gameState, setGameState] = useState<GameState>({
    player1Progress: 0,
    player2Progress: 0,
    currentTarget: "",
    targetEmoji: "",
    level: 0,
    gameStarted: true, // Auto-start the game for better UX
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

  // Initialize target on first load when game auto-starts
  useEffect(() => {
    if (gameState.gameStarted && !gameState.currentTarget) {
      const target = generateRandomTarget()
      setGameState(prev => ({
        ...prev,
        currentTarget: target.name,
        targetEmoji: target.emoji,
        targetChangeTime: Date.now() + 10000
      }))
    }
  }, [gameState.gameStarted, gameState.currentTarget, generateRandomTarget])

  const spawnObject = useCallback(() => {
    try {
      // Pre-check for performance bottlenecks - more strict limit
      if (gameObjects.length > 15) {
        eventTracker.trackWarning('Too many objects on screen, skipping spawn', { 
          currentCount: gameObjects.length 
        })
        return
      }

      // Optimized spawning: fewer objects, less computation
      const spawnCount = Math.floor(Math.random() * 2) + 1 // 1-2 objects only
      const newObjects: GameObject[] = []
      
      // Pre-calculate random values to reduce computation in loop
      const baseId = Date.now()
      const categoryItems = currentCategory.items
      const categoryLength = categoryItems.length
      
      for (let i = 0; i < spawnCount; i++) {
        // Use more efficient random selection
        const randomIndex = Math.floor(Math.random() * categoryLength)
        const randomItem = categoryItems[randomIndex]
        
        const newObject: GameObject = {
          id: `${baseId}-${i}`, // Simpler ID generation
          type: randomItem.name,
          emoji: randomItem.emoji,
          x: Math.random() * 80 + 10,
          y: -100 - (i * 60), // Increased stagger to prevent overlap
          speed: (Math.random() * 0.8 + 0.6) * fallSpeedMultiplier, // Reduced speed variance
          size: 60
        }
        newObjects.push(newObject)
      }
      
      // Single batch update instead of tracking each individually
      setGameObjects(prev => [...prev, ...newObjects])
      
      // Track spawn event once per batch
      eventTracker.trackObjectSpawn(`batch-${spawnCount}`, { count: spawnCount })
    } catch (error) {
      eventTracker.trackError(error as Error, 'spawnObject')
    }
  }, [currentCategory, gameObjects.length, fallSpeedMultiplier])

  const updateObjects = useCallback(() => {
    try {
      setGameObjects(prev => {
        // Filter and update in single pass for better performance
        const updatedObjects: GameObject[] = []
        const screenHeight = window.innerHeight
        const speedMultiplier = 1.2 * fallSpeedMultiplier
        
        for (const obj of prev) {
          const newY = obj.y + obj.speed * speedMultiplier
          
          // Only keep objects that are still visible
          if (newY < screenHeight + 100) {
            updatedObjects.push({ ...obj, y: newY })
          }
        }
        
        return updatedObjects
      })
    } catch (error) {
      eventTracker.trackError(error as Error, 'updateObjects')
    }
  }, [fallSpeedMultiplier])

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
            newState.player1Progress = Math.min(prev.player1Progress + 20, 100)
          } else {
            newState.player2Progress = Math.min(prev.player2Progress + 20, 100)
          }

          // Check for winner
          if (newState.player1Progress >= 100) {
            newState.winner = 1
            eventTracker.trackGameStateChange(oldState, newState, 'player1_wins')
          } else if (newState.player2Progress >= 100) {
            newState.winner = 2
            eventTracker.trackGameStateChange(oldState, newState, 'player2_wins')
          }

          // Change target immediately on correct tap (for non-sequence modes)
          if (!currentCategory.requiresSequence && !newState.winner) {
            const nextTarget = generateRandomTarget()
            newState.currentTarget = nextTarget.name
            newState.targetEmoji = nextTarget.emoji
            newState.targetChangeTime = Date.now() + 10000 // Reset timer
            eventTracker.trackGameStateChange(oldState, newState, 'target_change_on_correct_tap')
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
            newState.player1Progress = Math.max(prev.player1Progress - 20, 0)
          } else {
            newState.player2Progress = Math.max(prev.player2Progress - 20, 0)
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
      gameStarted: true, // Keep auto-start behavior
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

  // Spawn objects - Optimized with longer intervals for better performance
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner) return

    // Increased to 500ms for better performance while maintaining game flow
    const interval = setInterval(spawnObject, 500)
    return () => clearInterval(interval)
  }, [gameState.gameStarted, gameState.winner, spawnObject])

  // Update object positions using optimized timer-based approach
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner) return

    // Use setInterval instead of requestAnimationFrame for less frequent updates
    const interval = setInterval(updateObjects, 16) // ~60fps but more controlled
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