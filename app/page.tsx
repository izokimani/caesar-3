"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Church, Swords, Ship, Play, Pause, Volume2, Settings } from "lucide-react"

// Game state interface
interface GameState {
  population: number
  denarii: number
  food: number
  favor: number
  month: number
  year: number
  isPaused: boolean
  selectedTool: string
}

interface CityTile {
  x: number
  y: number
  terrain: "grass" | "water" | "fertile" | "rock" | "forest"
  building?: {
    type: string
    level: number
  }
  hasRoad: boolean
}

// Building categories matching Caesar 3
const BUILDING_CATEGORIES = {
  housing: [
    { id: "clear_land", name: "Clear Land", icon: "🧹", cost: 0 },
    { id: "road", name: "Road", icon: "🛤️", cost: 2 },
  ],
  water: [
    { id: "well", name: "Well", icon: "🕳️", cost: 15 },
    { id: "fountain", name: "Fountain", icon: "⛲", cost: 25 },
    { id: "reservoir", name: "Reservoir", icon: "🏛️", cost: 80 },
    { id: "aqueduct", name: "Aqueduct", icon: "🌉", cost: 8 },
  ],
  health: [
    { id: "barber", name: "Barber", icon: "✂️", cost: 25 },
    { id: "bathhouse", name: "Bath House", icon: "🛁", cost: 50 },
    { id: "doctor", name: "Doctor", icon: "⚕️", cost: 30 },
    { id: "hospital", name: "Hospital", icon: "🏥", cost: 75 },
  ],
  education: [
    { id: "school", name: "School", icon: "🏫", cost: 50 },
    { id: "academy", name: "Academy", icon: "🎓", cost: 100 },
    { id: "library", name: "Library", icon: "📚", cost: 75 },
  ],
  entertainment: [
    { id: "theater", name: "Theater", icon: "🎭", cost: 80 },
    { id: "amphitheater", name: "Amphitheater", icon: "🏟️", cost: 150 },
    { id: "colosseum", name: "Colosseum", icon: "🏛️", cost: 300 },
    { id: "hippodrome", name: "Hippodrome", icon: "🏇", cost: 500 },
    { id: "actor_colony", name: "Actor Colony", icon: "🎪", cost: 60 },
    { id: "gladiator_school", name: "Gladiator School", icon: "⚔️", cost: 100 },
  ],
  religion: [
    { id: "small_temple", name: "Small Temple", icon: "⛪", cost: 50 },
    { id: "large_temple", name: "Large Temple", icon: "🏛️", cost: 150 },
    { id: "oracle", name: "Oracle", icon: "🔮", cost: 200 },
  ],
  commerce: [
    { id: "market", name: "Market", icon: "🏪", cost: 40 },
    { id: "granary", name: "Granary", icon: "🏬", cost: 100 },
    { id: "warehouse", name: "Warehouse", icon: "🏭", cost: 70 },
    { id: "dock", name: "Dock", icon: "⚓", cost: 120 },
  ],
  industry: [
    { id: "wheat_farm", name: "Wheat Farm", icon: "🌾", cost: 40 },
    { id: "vegetable_farm", name: "Vegetable Farm", icon: "🥬", cost: 40 },
    { id: "fruit_farm", name: "Fruit Farm", icon: "🍎", cost: 40 },
    { id: "olive_farm", name: "Olive Farm", icon: "🫒", cost: 45 },
    { id: "vine_farm", name: "Vine Farm", icon: "🍇", cost: 45 },
    { id: "pig_farm", name: "Pig Farm", icon: "🐷", cost: 50 },
    { id: "clay_pit", name: "Clay Pit", icon: "🧱", cost: 50 },
    { id: "iron_mine", name: "Iron Mine", icon: "⛏️", cost: 75 },
    { id: "timber_yard", name: "Timber Yard", icon: "🪵", cost: 40 },
    { id: "pottery_workshop", name: "Pottery Workshop", icon: "🏺", cost: 40 },
    { id: "furniture_workshop", name: "Furniture Workshop", icon: "🪑", cost: 50 },
    { id: "oil_workshop", name: "Oil Workshop", icon: "🫗", cost: 40 },
    { id: "wine_workshop", name: "Wine Workshop", icon: "🍷", cost: 45 },
    { id: "weapons_workshop", name: "Weapons Workshop", icon: "⚔️", cost: 60 },
  ],
  government: [
    { id: "forum", name: "Forum", icon: "🏛️", cost: 75 },
    { id: "senate", name: "Senate", icon: "🏛️", cost: 250 },
    { id: "governors_house", name: "Governor's House", icon: "🏰", cost: 150 },
    { id: "governors_villa", name: "Governor's Villa", icon: "🏰", cost: 400 },
    { id: "governors_palace", name: "Governor's Palace", icon: "🏰", cost: 700 },
  ],
  security: [
    { id: "prefecture", name: "Prefecture", icon: "🚨", cost: 30 },
    { id: "engineer_post", name: "Engineer Post", icon: "🔧", cost: 30 },
  ],
  military: [
    { id: "walls", name: "Walls", icon: "🧱", cost: 8 },
    { id: "tower", name: "Tower", icon: "🗼", cost: 50 },
    { id: "gatehouse", name: "Gatehouse", icon: "🚪", cost: 80 },
    { id: "barracks", name: "Barracks", icon: "🏰", cost: 150 },
    { id: "fort", name: "Fort", icon: "🏰", cost: 200 },
    { id: "military_academy", name: "Military Academy", icon: "🎖️", cost: 120 },
  ],
  beautification: [
    { id: "garden", name: "Garden", icon: "🌸", cost: 12 },
    { id: "plaza", name: "Plaza", icon: "🏛️", cost: 15 },
    { id: "statue", name: "Statue", icon: "🗿", cost: 60 },
  ],
}

// Roman gods for festivals
const ROMAN_GODS = [
  { id: "ceres", name: "Ceres", domain: "Agriculture", portrait: "👩‍🌾" },
  { id: "neptune", name: "Neptune", domain: "Sea", portrait: "🧜‍♂️" },
  { id: "mercury", name: "Mercury", domain: "Commerce", portrait: "👨‍💼" },
  { id: "mars", name: "Mars", domain: "War", portrait: "⚔️" },
  { id: "venus", name: "Venus", domain: "Love", portrait: "💕" },
]

// Game notifications and events
const GAME_EVENTS = [
  { id: "population_growth", message: "🏘️ Population grows! New citizens arrive.", icon: "👥" },
  { id: "food_shortage", message: "🍽️ Food shortage! Citizens are hungry.", icon: "⚠️" },
  { id: "wealth_increase", message: "💰 Treasury grows! Trade prospers.", icon: "💎" },
  { id: "building_complete", message: "🏗️ Construction complete!", icon: "✅" },
  { id: "festival_success", message: "🎉 Festival successful! People rejoice.", icon: "🎊" },
  { id: "invasion_warning", message: "⚔️ Barbarians approach!", icon: "🛡️" },
  { id: "disease_outbreak", message: "🤒 Disease spreads through the city.", icon: "🏥" },
  { id: "fire_outbreak", message: "🔥 Fire breaks out!", icon: "🚒" },
  { id: "insufficient_funds", message: "💸 Insufficient funds! Need more denarii.", icon: "❌" },
]

// Resource icons for UI
const RESOURCE_ICONS = {
  denarii: "💰",
  population: "👥",
  food: "🍽️",
  favor: "👑",
  month: "📅",
  year: "🗓️",
}

export default function CaesarGame() {
  const [gameState, setGameState] = useState<GameState>({
    population: 150,
    denarii: 8000,
    food: 16,
    favor: 55,
    month: 1,
    year: 106,
    isPaused: false,
    selectedTool: "clear_land",
  })

  const [cityGrid, setCityGrid] = useState<CityTile[][]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("housing")
  const [showFestivalDialog, setShowFestivalDialog] = useState(false)
  const [selectedGod, setSelectedGod] = useState<string>("neptune")
  const [showAdvisorDialog, setShowAdvisorDialog] = useState(false)
  const [currentAdvisor, setCurrentAdvisor] = useState<string>("")
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, icon: string, timestamp: number}>>([])
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  // Add mobile and UX state
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [gameError, setGameError] = useState<string | null>(null)
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)
  const [showSaveLoad, setShowSaveLoad] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Add state for mouse hover
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null)

  // Add UX state
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipContent, setTooltipContent] = useState("")
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [lastAction, setLastAction] = useState("")
  const [showLastAction, setShowLastAction] = useState(false)

  // Mobile detection and setup
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Simulate loading
    const loadTimer = setTimeout(() => setIsLoading(false), 2000)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      clearTimeout(loadTimer)
    }
  }, [])

  // Add notification function
  const addNotification = useCallback((eventId: string) => {
    const event = GAME_EVENTS.find(e => e.id === eventId)
    if (event) {
      const timestamp = Date.now()
      setNotifications(prev => [...prev, {
        ...event,
        timestamp
      }])
      
      // Auto-remove notification after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.timestamp !== timestamp))
      }, 5000)
    }
  }, [])

  // Show last action feedback
  const showActionFeedback = useCallback((action: string) => {
    setLastAction(action)
    setShowLastAction(true)
    setTimeout(() => setShowLastAction(false), 2000)
  }, [])

  // Keyboard shortcuts will be added after function declarations

  // Initialize isometric city grid
  useEffect(() => {
    const grid: CityTile[][] = []
    for (let y = 0; y < 40; y++) {
      const row: CityTile[] = []
      for (let x = 0; x < 60; x++) {
        let terrain: CityTile["terrain"] = "grass"

        // Create water areas
        if ((x > 45 && y > 20) || (x < 10 && y > 30)) terrain = "water"
        // Create fertile areas
        if (x > 15 && x < 35 && y > 10 && y < 25 && Math.random() < 0.7) terrain = "fertile"
        // Add some forests and rocks
        if (Math.random() < 0.05) terrain = "forest"
        if (Math.random() < 0.03) terrain = "rock"

        row.push({
          x,
          y,
          terrain,
          hasRoad: false,
        })
      }
      grid.push(row)
    }
    setCityGrid(grid)
  }, [])

  // Render isometric city view
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || cityGrid.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const tileWidth = 30
    const tileHeight = 15

    // Clear canvas with a green background
    ctx.fillStyle = "#4a7c59"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw isometric tiles
    cityGrid.forEach((row, y) => {
      row.forEach((tile, x) => {
        // Convert grid coordinates to isometric screen coordinates
        const screenX = (x - y) * (tileWidth / 2) + canvas.width / 2
        const screenY = (x + y) * (tileHeight / 2) + 50

        // Skip tiles outside visible area
        if (
          screenX < -tileWidth ||
          screenX > canvas.width + tileWidth ||
          screenY < -tileHeight ||
          screenY > canvas.height + tileHeight
        ) {
          return
        }

        // Draw tile based on terrain
        ctx.save()
        ctx.translate(screenX, screenY)

        // Draw diamond-shaped tile
        ctx.beginPath()
        ctx.moveTo(0, -tileHeight / 2)
        ctx.lineTo(tileWidth / 2, 0)
        ctx.lineTo(0, tileHeight / 2)
        ctx.lineTo(-tileWidth / 2, 0)
        ctx.closePath()

        // Color based on terrain
        switch (tile.terrain) {
          case "grass":
            ctx.fillStyle = "#6b8e23"
            break
          case "water":
            ctx.fillStyle = "#4682b4"
            break
          case "fertile":
            ctx.fillStyle = "#9acd32"
            break
          case "forest":
            ctx.fillStyle = "#228b22"
            break
          case "rock":
            ctx.fillStyle = "#696969"
            break
        }

        ctx.fill()
        ctx.strokeStyle = "#5a5a5a"
        ctx.lineWidth = 0.5
        ctx.stroke()

        // Draw roads
        if (tile.hasRoad) {
          ctx.fillStyle = "#8b7355"
          ctx.fill()
        }

        // Draw buildings with emojis
        if (tile.building) {
          const buildingData = Object.values(BUILDING_CATEGORIES)
            .flat()
            .find((b) => b.id === tile.building?.type)

          if (buildingData) {
            ctx.font = "16px Arial"
            ctx.textAlign = "center"
            ctx.fillText(buildingData.icon, 0, -2)
          }
        }

        // Draw hover preview
        if (hoveredTile && hoveredTile.x === x && hoveredTile.y === y && gameState.selectedTool !== "clear_land") {
          const selectedBuilding = Object.values(BUILDING_CATEGORIES)
            .flat()
            .find((b) => b.id === gameState.selectedTool)

          if (selectedBuilding) {
            ctx.globalAlpha = 0.7
            ctx.fillStyle = "#ffff00"
            ctx.fill()
            ctx.globalAlpha = 1.0

            ctx.font = "16px Arial"
            ctx.textAlign = "center"
            ctx.fillText(selectedBuilding.icon, 0, -2)
          }
        }

        ctx.restore()
      })
    })
  }, [cityGrid, hoveredTile, gameState.selectedTool])

  // Helper function to convert screen coordinates to grid coordinates
  const screenToGrid = useCallback((screenX: number, screenY: number) => {
    const tileWidth = 30
    const tileHeight = 15
    const centerX = 1200 / 2  // canvas.width / 2
    const centerY = 50

    // Adjust for the center offset
    const adjustedX = screenX - centerX
    const adjustedY = screenY - centerY

    // Invert the isometric projection formula:
    // screenX = (x - y) * (tileWidth / 2) + centerX
    // screenY = (x + y) * (tileHeight / 2) + centerY
    // 
    // Solving for x and y:
    // x = (adjustedX / (tileWidth / 2) + adjustedY / (tileHeight / 2)) / 2
    // y = (adjustedY / (tileHeight / 2) - adjustedX / (tileWidth / 2)) / 2
    const gridX = Math.floor((adjustedX / (tileWidth / 2) + adjustedY / (tileHeight / 2)) / 2)
    const gridY = Math.floor((adjustedY / (tileHeight / 2) - adjustedX / (tileWidth / 2)) / 2)

    return { x: gridX, y: gridY }
  }, [])

  // Touch and mouse handlers
  const getPointerPosition = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    
    let clientX: number, clientY: number
    if ('touches' in event) {
      if (event.touches.length === 0) return null
      clientX = event.touches[0].clientX
      clientY = event.touches[0].clientY
    } else {
      clientX = event.clientX
      clientY = event.clientY
    }

    const x = clientX - rect.left
    const y = clientY - rect.top

    // Scale coordinates to match canvas coordinates
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const scaledX = x * scaleX
    const scaledY = y * scaleY

    return { x, y, scaledX, scaledY }
  }, [])

  // Add mouse move handler
  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPointerPosition(event)
    if (!pos) return

    const { x: gridX, y: gridY } = screenToGrid(pos.scaledX, pos.scaledY)

    if (gridX >= 0 && gridX < 60 && gridY >= 0 && gridY < 40) {
      setHoveredTile({ x: gridX, y: gridY })
    } else {
      setHoveredTile(null)
    }

    setMousePos({ x: pos.x, y: pos.y })
  }, [screenToGrid, getPointerPosition])

  // Touch handlers for mobile
  const handleCanvasTouchStart = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    const pos = getPointerPosition(event)
    if (!pos) return

    const { x: gridX, y: gridY } = screenToGrid(pos.scaledX, pos.scaledY)

    if (gridX >= 0 && gridX < 60 && gridY >= 0 && gridY < 40) {
      setHoveredTile({ x: gridX, y: gridY })
    }
  }, [screenToGrid, getPointerPosition])

  const handleCanvasTouchMove = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    const pos = getPointerPosition(event)
    if (!pos) return

    const { x: gridX, y: gridY } = screenToGrid(pos.scaledX, pos.scaledY)

    if (gridX >= 0 && gridX < 60 && gridY >= 0 && gridY < 40) {
      setHoveredTile({ x: gridX, y: gridY })
    } else {
      setHoveredTile(null)
    }
  }, [screenToGrid, getPointerPosition])

  // Generic place building function
  const placeBuildingAtPosition = useCallback((gridX: number, gridY: number) => {
    // Ensure coordinates are within bounds
    if (gridX >= 0 && gridX < 60 && gridY >= 0 && gridY < 40) {
      setCityGrid((prev) => {
        const newGrid = [...prev]
        const tile = newGrid[gridY][gridX]

        if (gameState.selectedTool === "road") {
          tile.hasRoad = true
          showActionFeedback("Road built!")
        } else if (gameState.selectedTool === "clear_land") {
          tile.building = undefined
          tile.hasRoad = false
          showActionFeedback("Land cleared!")
        } else {
          // Place building
          const buildingData = Object.values(BUILDING_CATEGORIES)
            .flat()
            .find((b) => b.id === gameState.selectedTool)
          
          if (buildingData) {
            if (gameState.denarii >= buildingData.cost) {
              tile.building = {
                type: gameState.selectedTool,
                level: 1,
              }
              
              // Deduct cost and add notification
              setGameState(prev => ({
                ...prev,
                denarii: prev.denarii - buildingData.cost
              }))
              
              addNotification("building_complete")
              showActionFeedback(`${buildingData.name} built!`)
            } else {
              addNotification("insufficient_funds")
              showActionFeedback("Insufficient funds!")
            }
          }
        }

        return newGrid
      })
    }
  }, [gameState.selectedTool, gameState.denarii, addNotification, showActionFeedback])

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getPointerPosition(event)
      if (!pos) return

      const { x: gridX, y: gridY } = screenToGrid(pos.scaledX, pos.scaledY)
      placeBuildingAtPosition(gridX, gridY)
    },
    [getPointerPosition, screenToGrid, placeBuildingAtPosition],
  )

  const handleCanvasTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      event.preventDefault()
      if (event.changedTouches.length === 0) return
      
      const touch = event.changedTouches[0]
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top

      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const scaledX = x * scaleX
      const scaledY = y * scaleY

      const { x: gridX, y: gridY } = screenToGrid(scaledX, scaledY)
      placeBuildingAtPosition(gridX, gridY)
    },
    [screenToGrid, placeBuildingAtPosition],
  )

  const togglePause = () => {
    setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }))
  }

  const openAdvisor = (advisor: string) => {
    setCurrentAdvisor(advisor)
    setShowAdvisorDialog(true)
  }

  // Save/Load functionality
  const saveGame = useCallback(() => {
    try {
      const gameData = {
        gameState,
        cityGrid,
        timestamp: Date.now()
      }
      localStorage.setItem('caesar-game-save', JSON.stringify(gameData))
      showActionFeedback("Game saved!")
      addNotification("building_complete")
    } catch (error) {
      console.error('Failed to save game:', error)
      showActionFeedback("Save failed!")
      setGameError("Failed to save game")
    }
  }, [gameState, cityGrid, showActionFeedback, addNotification])

  const loadGame = useCallback(() => {
    try {
      const saved = localStorage.getItem('caesar-game-save')
      if (saved) {
        const gameData = JSON.parse(saved)
        setGameState(gameData.gameState)
        setCityGrid(gameData.cityGrid)
        showActionFeedback("Game loaded!")
        addNotification("building_complete")
        setShowSaveLoad(false)
      } else {
        showActionFeedback("No saved game found")
      }
    } catch (error) {
      console.error('Failed to load game:', error)
      showActionFeedback("Load failed!")
      setGameError("Failed to load game")
    }
  }, [showActionFeedback, addNotification])

  const clearSave = useCallback(() => {
    try {
      localStorage.removeItem('caesar-game-save')
      showActionFeedback("Save cleared!")
    } catch (error) {
      console.error('Failed to clear save:', error)
      showActionFeedback("Clear failed!")
    }
  }, [showActionFeedback])

  // Tutorial functions
  const startTutorial = useCallback(() => {
    setShowTutorial(true)
    setTutorialStep(0)
    showActionFeedback("Tutorial started!")
  }, [showActionFeedback])

  const nextTutorialStep = useCallback(() => {
    if (tutorialStep < 4) {
      setTutorialStep(tutorialStep + 1)
    } else {
      setShowTutorial(false)
      setTutorialStep(0)
      showActionFeedback("Tutorial completed!")
    }
  }, [tutorialStep, showActionFeedback])

  const skipTutorial = useCallback(() => {
    setShowTutorial(false)
    setTutorialStep(0)
    showActionFeedback("Tutorial skipped!")
  }, [showActionFeedback])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return // Don't handle shortcuts when typing in input fields
      }

      switch (event.key.toLowerCase()) {
        case ' ':
          event.preventDefault()
          togglePause()
          showActionFeedback(gameState.isPaused ? "Game Paused" : "Game Resumed")
          break
        case 'escape':
          setShowFestivalDialog(false)
          setShowAdvisorDialog(false)
          setShowSettingsDialog(false)
          setShowHelpDialog(false)
          break
        case 'f':
          if (!showFestivalDialog) {
            setShowFestivalDialog(true)
            showActionFeedback("Festival Dialog Opened")
          }
          break
        case 'a':
          if (!showAdvisorDialog) {
            openAdvisor("chief")
            showActionFeedback("Advisor Dialog Opened")
          }
          break
        case 'h':
          if (!showHelpDialog) {
            setShowHelpDialog(true)
            showActionFeedback("Help Dialog Opened")
          }
          break
        case 's':
          if (!showSettingsDialog) {
            setShowSettingsDialog(true)
            showActionFeedback("Settings Dialog Opened")
          }
          break
        case 'm':
          setIsMuted(!isMuted)
          showActionFeedback(isMuted ? "Sound Unmuted" : "Sound Muted")
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          const categories = Object.keys(BUILDING_CATEGORIES)
          const index = parseInt(event.key) - 1
          if (index < categories.length) {
            setSelectedCategory(categories[index])
            showActionFeedback(`Switched to ${categories[index]} category`)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState.isPaused, showFestivalDialog, showAdvisorDialog, showSettingsDialog, showHelpDialog, isMuted, selectedCategory, togglePause, openAdvisor, showActionFeedback])

  // Loading screen
  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6 animate-float">🏛️</div>
          <h1 className="text-4xl font-bold text-white mb-4 text-glow">CAESAR III</h1>
          <p className="text-amber-200 mb-8">Loading your empire...</p>
          <div className="w-64 h-2 bg-amber-800 rounded-full mx-auto">
            <div className="h-full bg-gradient-to-r from-amber-400 to-amber-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  // Error screen
  if (gameError) {
    return (
      <div className="h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-4xl font-bold text-white mb-4">Game Error</h1>
          <p className="text-red-200 mb-8">{gameError}</p>
          <Button onClick={() => setGameError(null)} className="bg-red-600 hover:bg-red-500">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen bg-black flex flex-col overflow-hidden ${isMobile ? 'mobile-layout' : ''}`}>
      {/* Top Menu Bar - Caesar 3 Style */}
      <div className="roman-gradient text-white px-3 md:px-6 py-2 md:py-4 flex items-center justify-between text-sm border-b-4 border-amber-950 shadow-roman-lg relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm0 0c0 11.046 8.954 20 20 20s20-8.954 20-20-8.954-20-20-20-20 8.954-20 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-8 relative z-10">
          <div className="flex items-center space-x-2 md:space-x-3 animate-float">
            <span className="text-2xl md:text-3xl text-glow">🏛️</span>
            <div>
              <span className="text-roman text-lg md:text-2xl tracking-wider text-glow">CAESAR III</span>
              {!isMobile && <div className="text-xs text-amber-200 opacity-80">The Emoji Asset Library</div>}
            </div>
          </div>
          
          {isMobile ? (
            /* Mobile menu button */
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-amber-700/50 transition-all duration-300 btn-roman"
              aria-label="Menu"
            >
              <span className="text-lg">☰</span>
            </button>
          ) : (
            /* Desktop menu */
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => setShowSaveLoad(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-amber-700/50 transition-all duration-300 hover:scale-105 btn-roman"
              >
                <span className="text-lg">📁</span>
                <span className="font-semibold">Save/Load</span>
              </button>
              <button 
                onClick={() => setShowSettingsDialog(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-amber-700/50 transition-all duration-300 hover:scale-105 btn-roman"
              >
                <span className="text-lg">⚙️</span>
                <span className="font-semibold">Options</span>
              </button>
              <button 
                onClick={startTutorial}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-amber-700/50 transition-all duration-300 hover:scale-105 btn-roman"
              >
                <span className="text-lg">🎓</span>
                <span className="font-semibold">Tutorial</span>
              </button>
              <button 
                onClick={() => setShowHelpDialog(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-amber-700/50 transition-all duration-300 hover:scale-105 btn-roman"
              >
                <span className="text-lg">❓</span>
                <span className="font-semibold">Help</span>
              </button>
              <button 
                onClick={() => openAdvisor("chief")}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-amber-700/50 transition-all duration-300 hover:scale-105 btn-roman"
              >
                <span className="text-lg">👨‍💼</span>
                <span className="font-semibold">Advisors</span>
              </button>
            </div>
          )}
        </div>

        <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-8'} relative z-10`}>
          <div className={`flex items-center ${isMobile ? 'space-x-2 px-3 py-2' : 'space-x-6 px-6 py-3'} bg-amber-800/80 backdrop-blur-sm rounded-xl border-2 border-amber-600 shadow-roman ${!isMobile && 'animate-pulse-glow'}`}>
            {!isMobile ? (
              /* Desktop resource display */
              <>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl animate-float">{RESOURCE_ICONS.denarii}</span>
                  <div>
                    <span className="font-bold text-xl text-glow">{gameState.denarii.toLocaleString()}</span>
                    <div className="text-xs text-amber-200">Denarii</div>
                  </div>
                </div>
                <div className="w-px h-8 bg-amber-600"></div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl animate-float">{RESOURCE_ICONS.population}</span>
                  <div>
                    <span className="font-bold text-xl text-glow">{gameState.population.toLocaleString()}</span>
                    <div className="text-xs text-amber-200">Population</div>
                  </div>
                </div>
                <div className="w-px h-8 bg-amber-600"></div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl animate-float">{RESOURCE_ICONS.food}</span>
                  <div>
                    <span className="font-bold text-xl text-glow">{gameState.food}</span>
                    <div className="text-xs text-amber-200">Food</div>
                  </div>
                </div>
                <div className="w-px h-8 bg-amber-600"></div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl animate-float">{RESOURCE_ICONS.favor}</span>
                  <div>
                    <span className="font-bold text-xl text-glow">{gameState.favor}%</span>
                    <div className="text-xs text-amber-200">Favor</div>
                  </div>
                </div>
              </>
            ) : (
              /* Mobile resource display - compact */
              <>
                <div className="flex items-center space-x-1">
                  <span className="text-lg">{RESOURCE_ICONS.denarii}</span>
                  <span className="font-bold text-sm">{gameState.denarii.toLocaleString()}</span>
                </div>
                <div className="w-px h-6 bg-amber-600"></div>
                <div className="flex items-center space-x-1">
                  <span className="text-lg">{RESOURCE_ICONS.population}</span>
                  <span className="font-bold text-sm">{gameState.population}</span>
                </div>
                <div className="w-px h-6 bg-amber-600"></div>
                <div className="flex items-center space-x-1">
                  <span className="text-lg">{RESOURCE_ICONS.food}</span>
                  <span className="font-bold text-sm">{gameState.food}</span>
                </div>
              </>
            )}
          </div>
          
          {!isMobile && (
            <div className="flex items-center space-x-3 bg-amber-800/80 backdrop-blur-sm px-6 py-3 rounded-xl border-2 border-amber-600 shadow-roman">
              <span className="text-2xl animate-float">{RESOURCE_ICONS.month}</span>
              <div>
                <span className="font-bold text-xl text-glow">{gameState.month} AD {gameState.year}</span>
                <div className="text-xs text-amber-200">Current Date</div>
              </div>
              {gameState.isPaused && (
                <div className="ml-3 px-3 py-1 bg-red-600/80 rounded-lg animate-pulse">
                  <span className="text-red-100 font-bold text-sm">⏸️ PAUSED</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobile && showMobileMenu && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute top-16 left-0 right-0 bg-gradient-to-b from-amber-50 to-amber-100 border-b-4 border-amber-800 shadow-2xl p-4 space-y-3">
            <button 
              onClick={() => { setShowSaveLoad(true); setShowMobileMenu(false); }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-amber-600 text-white font-semibold shadow-lg hover:bg-amber-500 transition-all"
            >
              <span className="text-xl">📁</span>
              <span>Save/Load Game</span>
            </button>
            <button 
              onClick={() => { setShowSettingsDialog(true); setShowMobileMenu(false); }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-amber-600 text-white font-semibold shadow-lg hover:bg-amber-500 transition-all"
            >
              <span className="text-xl">⚙️</span>
              <span>Settings</span>
            </button>
            <button 
              onClick={() => { startTutorial(); setShowMobileMenu(false); }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-amber-600 text-white font-semibold shadow-lg hover:bg-amber-500 transition-all"
            >
              <span className="text-xl">🎓</span>
              <span>Tutorial</span>
            </button>
            <button 
              onClick={() => { setShowHelpDialog(true); setShowMobileMenu(false); }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-amber-600 text-white font-semibold shadow-lg hover:bg-amber-500 transition-all"
            >
              <span className="text-xl">❓</span>
              <span>Help</span>
            </button>
            <button 
              onClick={() => { openAdvisor("chief"); setShowMobileMenu(false); }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-amber-600 text-white font-semibold shadow-lg hover:bg-amber-500 transition-all"
            >
              <span className="text-xl">👨‍💼</span>
              <span>Advisors</span>
            </button>
          </div>
        </div>
      )}

      <div className={`flex flex-1 overflow-hidden ${isMobile ? 'flex-col' : ''}`}>
        {/* Main Game Area */}
        <div className="flex-1 relative bg-green-800">
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            className="w-full h-full cursor-crosshair touch-none"
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onTouchStart={handleCanvasTouchStart}
            onTouchMove={handleCanvasTouchMove}
            onTouchEnd={handleCanvasTouchEnd}
          />

          {/* Game Controls Overlay */}
          <div className="absolute top-6 left-6 flex items-center space-x-3">
            <div className="bg-black/80 backdrop-blur-md rounded-xl p-4 border-2 border-amber-600 shadow-roman-lg animate-fade-in-up">
              <div className="flex items-center space-x-3">
                <Button
                  size="sm"
                  variant={gameState.isPaused ? "default" : "secondary"}
                  onClick={togglePause}
                  className="bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white shadow-lg transition-all duration-300 hover:scale-110"
                >
                  {gameState.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white shadow-lg transition-all duration-300 hover:scale-110"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  <span className="text-lg">{isMuted ? "🔇" : "🔊"}</span>
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white shadow-lg transition-all duration-300 hover:scale-110"
                  onClick={() => setShowSettingsDialog(true)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-center mt-2 text-xs text-amber-200 opacity-80">
                Press <kbd className="bg-amber-800 px-1 rounded text-xs">Space</kbd> to pause
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="absolute top-24 left-6 space-y-3">
            {notifications.map((notification, index) => (
              <div
                key={notification.timestamp}
                className="bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-600 rounded-xl px-4 py-3 text-sm text-amber-900 shadow-xl backdrop-blur-sm animate-slide-in"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  animationDuration: '0.5s'
                }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{notification.icon}</span>
                  <span className="font-semibold">{notification.message}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Mouse Position Info */}
          {hoveredTile && (
            <div className="absolute bottom-6 left-6 bg-black bg-opacity-90 backdrop-blur-sm text-white px-4 py-3 rounded-xl border border-amber-600 shadow-xl">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📍</span>
                  <span className="font-semibold">Tile ({hoveredTile.x}, {hoveredTile.y})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🏗️</span>
                  <span className="font-semibold">Tool: {gameState.selectedTool}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {cityGrid[hoveredTile.y]?.[hoveredTile.x]?.terrain === "grass" && "🌱"}
                    {cityGrid[hoveredTile.y]?.[hoveredTile.x]?.terrain === "water" && "🌊"}
                    {cityGrid[hoveredTile.y]?.[hoveredTile.x]?.terrain === "fertile" && "🌾"}
                    {cityGrid[hoveredTile.y]?.[hoveredTile.x]?.terrain === "forest" && "🌲"}
                    {cityGrid[hoveredTile.y]?.[hoveredTile.x]?.terrain === "rock" && "🗿"}
                  </span>
                  <span className="font-semibold capitalize">
                    {cityGrid[hoveredTile.y]?.[hoveredTile.x]?.terrain}
                  </span>
                </div>
                {cityGrid[hoveredTile.y]?.[hoveredTile.x]?.building && (
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🏠</span>
                    <span className="font-semibold">Building: {cityGrid[hoveredTile.y]?.[hoveredTile.x]?.building?.type}</span>
                  </div>
                )}
                {cityGrid[hoveredTile.y]?.[hoveredTile.x]?.hasRoad && (
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🛤️</span>
                    <span className="font-semibold">Road</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Building Tools */}
        <div className={`${isMobile ? 'h-48 border-t-4 border-amber-800 border-l-0' : 'w-56 border-l-4 border-amber-800'} bg-gradient-to-b from-amber-50 via-amber-100 to-amber-200 flex flex-col shadow-roman-lg custom-scrollbar`}>
          {/* Category Tabs */}
          <div className="roman-gradient text-white p-4 border-b-2 border-amber-700 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.523-4.477-10-10-10s-10 4.477-10 10 4.477 10 10 10 10-4.477 10-10zm0 0c0 5.523 4.477 10 10 10s10-4.477 10-10-4.477-10-10-10-10 4.477-10 10z'/%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-3 text-center text-glow">🏗️ Building Tools</h3>
              <div className="text-center text-amber-200 text-sm mb-3">
                Press <kbd className="bg-amber-800 px-1 rounded text-xs">1-9</kbd> to switch categories
              </div>
                          <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  showActionFeedback(`Switched to ${e.target.value} category`)
                }}
                className="w-full bg-amber-700 text-white rounded-lg px-3 py-2 text-sm border border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
              {Object.keys(BUILDING_CATEGORIES).map((category) => (
                <option key={category} value={category}>
                  {category === "housing" && "🏠 "}
                  {category === "water" && "💧 "}
                  {category === "health" && "🏥 "}
                  {category === "education" && "📚 "}
                  {category === "entertainment" && "🎭 "}
                  {category === "religion" && "⛪ "}
                  {category === "commerce" && "🏪 "}
                  {category === "industry" && "🏭 "}
                  {category === "government" && "🏛️ "}
                  {category === "security" && "🚨 "}
                  {category === "military" && "⚔️ "}
                  {category === "beautification" && "🌸 "}
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Building Icons Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-3 gap-2">
              {BUILDING_CATEGORIES[selectedCategory as keyof typeof BUILDING_CATEGORIES]?.map((building) => (
                <button
                  key={building.id}
                  onClick={() => {
                    setGameState((prev) => ({ ...prev, selectedTool: building.id }))
                    showActionFeedback(`Selected ${building.name}`)
                  }}
                  onMouseEnter={(e) => {
                    setTooltipContent(`${building.name} - ${building.cost} Denarii${gameState.denarii < building.cost ? ' (Insufficient funds)' : ''}`)
                    setTooltipPosition({ x: e.clientX, y: e.clientY })
                    setShowTooltip(true)
                  }}
                  onMouseLeave={() => setShowTooltip(false)}
                  disabled={gameState.denarii < building.cost}
                  className={`
                    aspect-square border-2 rounded-lg flex flex-col items-center justify-center text-xs p-2 transition-all duration-200 shadow-md
                    ${
                      gameState.selectedTool === building.id
                        ? "border-amber-800 bg-gradient-to-br from-amber-300 to-amber-400 shadow-lg scale-105"
                        : gameState.denarii < building.cost
                          ? "border-gray-400 bg-gray-200 opacity-50 cursor-not-allowed"
                          : "border-amber-600 bg-gradient-to-br from-amber-50 to-amber-100 hover:bg-gradient-to-br hover:from-amber-100 hover:to-amber-200 hover:scale-105 hover:shadow-lg"
                    }
                  `}
                  title={`${building.name} - ${building.cost} Denarii`}
                >
                  <span className="text-xl mb-1">{building.icon}</span>
                  <span className="text-xs text-center leading-tight font-semibold">{building.name}</span>
                  <span className={`text-xs mt-1 font-bold ${
                    gameState.denarii >= building.cost ? "text-green-700" : "text-red-600"
                  }`}>
                    {building.cost} {gameState.denarii >= building.cost ? "💰" : "❌"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="p-4 border-t-2 border-amber-600 space-y-3 bg-gradient-to-t from-amber-200 to-amber-100">
            <Button
              onClick={() => setShowFestivalDialog(true)}
              className="w-full bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white text-sm font-semibold shadow-lg transition-all duration-200 hover:scale-105"
              size="sm"
            >
              <Church className="w-4 h-4 mr-2" />
              🎉 Hold Festival
            </Button>
            <Button
              onClick={() => openAdvisor("trade")}
              className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white text-sm font-semibold shadow-lg transition-all duration-200 hover:scale-105"
              size="sm"
            >
              <Ship className="w-4 h-4 mr-2" />
              🚢 Trade
            </Button>
            <Button
              onClick={() => openAdvisor("military")}
              className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white text-sm font-semibold shadow-lg transition-all duration-200 hover:scale-105"
              size="sm"
            >
              <Swords className="w-4 h-4 mr-2" />
              ⚔️ Military
            </Button>
          </div>
        </div>
      </div>

      {/* Festival Dialog - Roman Style */}
      <Dialog open={showFestivalDialog} onOpenChange={setShowFestivalDialog}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 border-4 border-amber-800 shadow-2xl rounded-2xl">
          <div className="relative z-10">
            <DialogHeader>
              <DialogTitle className="text-3xl text-amber-900 text-center font-bold mb-2">
                🎉 Hold Festival to {ROMAN_GODS.find((g) => g.id === selectedGod)?.name} 🎊
              </DialogTitle>
              <p className="text-center text-amber-700 text-sm">Choose a god and festival type to please the Roman pantheon</p>
            </DialogHeader>

            {/* God Selection */}
            <div className="my-6">
              <h3 className="text-lg font-semibold text-amber-800 mb-4 text-center">Choose a Roman God</h3>
              <div className="flex justify-center space-x-4">
                {ROMAN_GODS.map((god) => (
                  <button
                    key={god.id}
                    onClick={() => setSelectedGod(god.id)}
                    className={`
                      w-20 h-20 rounded-xl border-4 flex flex-col items-center justify-center text-3xl transition-all duration-200 shadow-lg
                      ${
                        selectedGod === god.id
                          ? "border-amber-800 bg-gradient-to-br from-amber-200 to-amber-300 scale-110 shadow-xl"
                          : "border-amber-600 bg-gradient-to-br from-amber-50 to-amber-100 hover:bg-gradient-to-br hover:from-amber-100 hover:to-amber-200 hover:scale-105"
                      }
                    `}
                    title={`${god.name} - ${god.domain}`}
                  >
                    <span>{god.portrait}</span>
                    <span className="text-xs font-semibold text-amber-800 mt-1">{god.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Festival Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-amber-800 mb-3 text-center">Festival Types</h3>
              <button 
                className="w-full flex justify-between items-center p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border-2 border-amber-600 hover:from-amber-100 hover:to-amber-200 transition-all duration-200 shadow-md hover:shadow-lg"
                onClick={() => {
                  if (gameState.denarii >= 145) {
                    setGameState(prev => ({ ...prev, denarii: prev.denarii - 145 }))
                    addNotification("festival_success")
                    showActionFeedback("Small Festival held!")
                    setShowFestivalDialog(false)
                  } else {
                    addNotification("insufficient_funds")
                    showActionFeedback("Insufficient funds!")
                  }
                }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🎭</span>
                  <div>
                    <span className="font-bold text-lg">Small Festival</span>
                    <div className="text-sm text-amber-700">A modest celebration</div>
                  </div>
                </div>
                <span className="font-bold text-lg text-amber-800">145 💰</span>
              </button>
              <button 
                className="w-full flex justify-between items-center p-4 bg-gradient-to-r from-amber-100 to-amber-200 rounded-xl border-2 border-amber-600 hover:from-amber-200 hover:to-amber-300 transition-all duration-200 shadow-md hover:shadow-lg"
                onClick={() => {
                  if (gameState.denarii >= 291) {
                    setGameState(prev => ({ ...prev, denarii: prev.denarii - 291 }))
                    addNotification("festival_success")
                    showActionFeedback("Large Festival held!")
                    setShowFestivalDialog(false)
                  } else {
                    addNotification("insufficient_funds")
                    showActionFeedback("Insufficient funds!")
                  }
                }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🎪</span>
                  <div>
                    <span className="font-bold text-lg">Large Festival</span>
                    <div className="text-sm text-amber-700">A grand celebration</div>
                  </div>
                </div>
                <span className="font-bold text-lg text-amber-800">291 💰</span>
              </button>
              <button 
                className="w-full flex justify-between items-center p-4 bg-gradient-to-r from-amber-200 to-amber-300 rounded-xl border-2 border-amber-800 hover:from-amber-300 hover:to-amber-400 transition-all duration-200 shadow-lg hover:shadow-xl"
                onClick={() => {
                  if (gameState.denarii >= 500) {
                    setGameState(prev => ({ ...prev, denarii: prev.denarii - 500 }))
                    addNotification("festival_success")
                    showActionFeedback("Grand Festival held!")
                    setShowFestivalDialog(false)
                  } else {
                    addNotification("insufficient_funds")
                    showActionFeedback("Insufficient funds!")
                  }
                }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🏛️</span>
                  <div>
                    <span className="font-bold text-lg">Grand Festival</span>
                    <div className="text-sm text-amber-700">The most magnificent celebration</div>
                  </div>
                </div>
                <span className="font-bold text-lg text-amber-800">500 💰</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowFestivalDialog(false)}
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                ❌ Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Advisor Dialog */}
      <Dialog open={showAdvisorDialog} onOpenChange={setShowAdvisorDialog}>
        <DialogContent className="max-w-3xl bg-gradient-to-b from-amber-50 to-amber-100 border-4 border-amber-800">
          <DialogHeader>
            <DialogTitle className="text-2xl text-amber-900 text-center font-bold">
              {currentAdvisor === "chief" && "👨‍💼 Chief Advisor"}
              {currentAdvisor === "trade" && "🚢 Trade Advisor"}
              {currentAdvisor === "military" && "⚔️ Military Advisor"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 text-center">
            {currentAdvisor === "chief" && (
              <div>
                <p className="text-lg mb-4">🏛️ Your city prospers, Caesar! The people are content. 👑</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>{RESOURCE_ICONS.population} Population: {gameState.population}</div>
                  <div>{RESOURCE_ICONS.denarii} Treasury: {gameState.denarii} Denarii</div>
                  <div>{RESOURCE_ICONS.food} Food Stores: {gameState.food} months</div>
                  <div>{RESOURCE_ICONS.favor} Caesar's Favor: {gameState.favor}%</div>
                </div>
              </div>
            )}

            {currentAdvisor === "trade" && (
              <div>
                <p className="text-lg mb-4">🚢 Trade routes bring prosperity to Rome! 💰</p>
                <p>Open trade routes with neighboring cities to import goods you need and export your surplus. 📦</p>
              </div>
            )}

            {currentAdvisor === "military" && (
              <div>
                <p className="text-lg mb-4">⚔️ The legions stand ready to defend Rome! 🛡️</p>
                <p>
                  Build barracks and forts to train soldiers. Walls and towers will protect your city from barbarian
                  attacks. 🏰
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-md bg-gradient-to-b from-amber-50 to-amber-100 border-4 border-amber-800">
          <DialogHeader>
            <DialogTitle className="text-2xl text-amber-900 text-center font-bold">
              ⚙️ Game Settings
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">🔊 Sound</span>
              <Button
                size="sm"
                variant={isMuted ? "outline" : "default"}
                onClick={() => setIsMuted(!isMuted)}
                className={isMuted ? "border-red-600 text-red-600" : "bg-green-600"}
              >
                {isMuted ? "🔇 Muted" : "🔊 On"}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">🎮 Game Speed</span>
              <select className="bg-amber-700 text-white rounded px-2 py-1">
                <option>Normal</option>
                <option>Fast</option>
                <option>Slow</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">🎨 Graphics</span>
              <select className="bg-amber-700 text-white rounded px-2 py-1">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-2xl bg-gradient-to-b from-amber-50 to-amber-100 border-4 border-amber-800">
          <DialogHeader>
            <DialogTitle className="text-2xl text-amber-900 text-center font-bold">
              ❓ Help & Instructions
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-bold text-lg mb-2">🏗️ Building</h3>
              <p className="text-sm">Select a building category from the sidebar, then click on the map to place buildings. Each building costs denarii.</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">🛤️ Roads</h3>
              <p className="text-sm">Build roads to connect your buildings and allow citizens to travel between them.</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">🎉 Festivals</h3>
              <p className="text-sm">Hold festivals to please the Roman gods and increase your favor with Caesar.</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">💰 Resources</h3>
              <p className="text-sm">Manage your denarii, population, food, and Caesar's favor to build a prosperous city.</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">⌨️ Keyboard Shortcuts</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><kbd className="bg-gray-200 px-2 py-1 rounded">Space</kbd> - Pause/Resume</div>
                <div><kbd className="bg-gray-200 px-2 py-1 rounded">F</kbd> - Hold Festival</div>
                <div><kbd className="bg-gray-200 px-2 py-1 rounded">A</kbd> - Open Advisors</div>
                <div><kbd className="bg-gray-200 px-2 py-1 rounded">H</kbd> - Help</div>
                <div><kbd className="bg-gray-200 px-2 py-1 rounded">S</kbd> - Settings</div>
                <div><kbd className="bg-gray-200 px-2 py-1 rounded">M</kbd> - Mute/Unmute</div>
                <div><kbd className="bg-gray-200 px-2 py-1 rounded">1-9</kbd> - Building Categories</div>
                <div><kbd className="bg-gray-200 px-2 py-1 rounded">Esc</kbd> - Close Dialogs</div>
              </div>
            </div>
            <div className="text-center mt-4">
              <Button onClick={() => setShowHelpDialog(false)} className="bg-amber-700 hover:bg-amber-600">
                ✅ Got it!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tutorial Dialog */}
      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent className="max-w-2xl bg-gradient-to-b from-amber-50 to-amber-100 border-4 border-amber-800">
          <DialogHeader>
            <DialogTitle className="text-2xl text-amber-900 text-center font-bold">
              🎓 Tutorial - Step {tutorialStep + 1} of 5
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 text-center">
            {tutorialStep === 0 && (
              <div>
                <div className="text-6xl mb-4">👋</div>
                <h3 className="text-xl font-bold mb-3">Welcome to Caesar III!</h3>
                <p>You are the governor of a Roman province. Your mission is to build a thriving city and please Caesar!</p>
              </div>
            )}
            {tutorialStep === 1 && (
              <div>
                <div className="text-6xl mb-4">🏗️</div>
                <h3 className="text-xl font-bold mb-3">Building Basics</h3>
                <p>Use the building sidebar to select structures. Click on the map to place them. Each building costs denarii from your treasury.</p>
              </div>
            )}
            {tutorialStep === 2 && (
              <div>
                <div className="text-6xl mb-4">🛤️</div>
                <h3 className="text-xl font-bold mb-3">Roads and Planning</h3>
                <p>Build roads to connect your buildings. Citizens need roads to travel between their homes, work, and entertainment.</p>
              </div>
            )}
            {tutorialStep === 3 && (
              <div>
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-xl font-bold mb-3">Managing Resources</h3>
                <p>Watch your denarii, population, food, and Caesar's favor. Balance your city's needs to keep everyone happy!</p>
              </div>
            )}
            {tutorialStep === 4 && (
              <div>
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-bold mb-3">You're Ready!</h3>
                <p>Now you know the basics! Hold festivals to please the gods, build entertainment and commerce, and create the greatest Roman city ever!</p>
              </div>
            )}
            
            <div className="flex justify-center space-x-4 mt-6">
              <Button onClick={skipTutorial} variant="outline" className="border-red-600 text-red-600">
                Skip Tutorial
              </Button>
              <Button onClick={nextTutorialStep} className="bg-amber-700 hover:bg-amber-600">
                {tutorialStep < 4 ? 'Next' : 'Start Playing!'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save/Load Dialog */}
      <Dialog open={showSaveLoad} onOpenChange={setShowSaveLoad}>
        <DialogContent className="max-w-md bg-gradient-to-b from-amber-50 to-amber-100 border-4 border-amber-800">
          <DialogHeader>
            <DialogTitle className="text-2xl text-amber-900 text-center font-bold">
              📁 Save & Load Game
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <Button 
              onClick={saveGame}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3"
            >
              💾 Save Current Game
            </Button>
            <Button 
              onClick={loadGame}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3"
            >
              📂 Load Saved Game
            </Button>
            <Button 
              onClick={clearSave}
              variant="outline"
              className="w-full border-red-600 text-red-600 hover:bg-red-50 font-semibold py-3"
            >
              🗑️ Clear Save Data
            </Button>
            
            <div className="text-center mt-4">
              <Button onClick={() => setShowSaveLoad(false)} className="bg-amber-700 hover:bg-amber-600">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tooltip */}
      {showTooltip && (
        <div 
          className="fixed z-50 bg-black bg-opacity-90 text-white px-3 py-2 rounded-lg text-sm shadow-lg pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 40
          }}
        >
          {tooltipContent}
        </div>
      )}

      {/* Action Feedback */}
      {showLastAction && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-amber-800 text-white px-6 py-3 rounded-xl shadow-2xl animate-pulse">
          <div className="text-center">
            <div className="text-2xl mb-1">✨</div>
            <div className="font-bold text-lg">{lastAction}</div>
          </div>
        </div>
      )}
    </div>
  )
}
