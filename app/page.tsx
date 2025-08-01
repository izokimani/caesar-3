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

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Add state for mouse hover
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null)

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

  // Add mouse move handler
  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    const tileWidth = 30
    const tileHeight = 15
    const centerX = canvas.width / 2
    const centerY = 50

    const worldX = mouseX - centerX
    const worldY = mouseY - centerY

    const gridX = Math.floor((worldX / (tileWidth / 2) + worldY / (tileHeight / 2)) / 2)
    const gridY = Math.floor((worldY / (tileHeight / 2) - worldX / (tileWidth / 2)) / 2)

    if (gridX >= 0 && gridX < 60 && gridY >= 0 && gridY < 40) {
      setHoveredTile({ x: gridX, y: gridY })
    } else {
      setHoveredTile(null)
    }

    setMousePos({ x: mouseX, y: mouseY })
  }, [])

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const clickX = event.clientX - rect.left
      const clickY = event.clientY - rect.top

      const tileWidth = 30
      const tileHeight = 15
      const centerX = canvas.width / 2
      const centerY = 50

      // Convert screen coordinates to world coordinates
      const worldX = clickX - centerX
      const worldY = clickY - centerY

      // Convert world coordinates to grid coordinates using proper isometric math
      const gridX = Math.floor((worldX / (tileWidth / 2) + worldY / (tileHeight / 2)) / 2)
      const gridY = Math.floor((worldY / (tileHeight / 2) - worldX / (tileWidth / 2)) / 2)

      // Ensure coordinates are within bounds
      if (gridX >= 0 && gridX < 60 && gridY >= 0 && gridY < 40) {
        setCityGrid((prev) => {
          const newGrid = [...prev]
          const tile = newGrid[gridY][gridX]

          if (gameState.selectedTool === "road") {
            tile.hasRoad = true
          } else if (gameState.selectedTool === "clear_land") {
            tile.building = undefined
            tile.hasRoad = false
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
              } else {
                addNotification("insufficient_funds")
              }
            }
          }

          return newGrid
        })
      }
    },
    [gameState.selectedTool, gameState.denarii, addNotification],
  )

  const togglePause = () => {
    setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }))
  }

  const openAdvisor = (advisor: string) => {
    setCurrentAdvisor(advisor)
    setShowAdvisorDialog(true)
  }

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {/* Top Menu Bar - Caesar 3 Style */}
      <div className="bg-gradient-to-r from-amber-800 to-amber-600 text-white px-4 py-1 flex items-center justify-between text-sm border-b-2 border-amber-900">
        <div className="flex items-center space-x-6">
          <span className="font-bold cursor-pointer hover:text-yellow-200" onClick={() => addNotification("population_growth")}>📁 File</span>
          <span className="cursor-pointer hover:text-yellow-200" onClick={() => setShowSettingsDialog(true)}>⚙️ Options</span>
          <span className="cursor-pointer hover:text-yellow-200" onClick={() => setShowHelpDialog(true)}>❓ Help</span>
          <span onClick={() => openAdvisor("chief")} className="cursor-pointer hover:text-yellow-200">
            👨‍💼 Advisors
          </span>
        </div>

        <div className="flex items-center space-x-6">
          <span>{RESOURCE_ICONS.denarii} {gameState.denarii}</span>
          <span>{RESOURCE_ICONS.population} {gameState.population}</span>
          <span>{RESOURCE_ICONS.food} {gameState.food}</span>
          <span>{RESOURCE_ICONS.favor} {gameState.favor}%</span>
          <span>{gameState.isPaused ? "⏸️ PAUSED" : `${RESOURCE_ICONS.month} ${gameState.month} AD ${gameState.year}`}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Game Area */}
        <div className="flex-1 relative bg-green-800">
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            className="w-full h-full cursor-crosshair"
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
          />

          {/* Game Controls Overlay */}
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            <Button
              size="sm"
              variant={gameState.isPaused ? "default" : "secondary"}
              onClick={togglePause}
              className="bg-amber-700 hover:bg-amber-600 text-white"
            >
              {gameState.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              className="bg-amber-700 hover:bg-amber-600 text-white"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? "🔇" : "🔊"}
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              className="bg-amber-700 hover:bg-amber-600 text-white"
              onClick={() => setShowSettingsDialog(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Notifications */}
          <div className="absolute top-16 left-4 space-y-2">
            {notifications.map((notification, index) => (
              <div
                key={notification.timestamp}
                className="bg-amber-100 border-2 border-amber-800 rounded-lg px-3 py-2 text-sm text-amber-900 shadow-lg animate-pulse"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{notification.icon}</span>
                  <span>{notification.message}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Mouse Position Info */}
          {hoveredTile && (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded text-sm">
              <div>📍 Tile: ({hoveredTile.x}, {hoveredTile.y})</div>
              <div>🏗️ Tool: {gameState.selectedTool}</div>
              <div>
                {cityGrid[hoveredTile.y]?.[hoveredTile.x]?.terrain === "grass" && "🌱 Grass"}
                {cityGrid[hoveredTile.y]?.[hoveredTile.x]?.terrain === "water" && "🌊 Water"}
                {cityGrid[hoveredTile.y]?.[hoveredTile.x]?.terrain === "fertile" && "🌾 Fertile"}
                {cityGrid[hoveredTile.y]?.[hoveredTile.x]?.terrain === "forest" && "🌲 Forest"}
                {cityGrid[hoveredTile.y]?.[hoveredTile.x]?.terrain === "rock" && "🗿 Rock"}
              </div>
              {cityGrid[hoveredTile.y]?.[hoveredTile.x]?.building && (
                <div>🏠 Building: {cityGrid[hoveredTile.y]?.[hoveredTile.x]?.building?.type}</div>
              )}
              {cityGrid[hoveredTile.y]?.[hoveredTile.x]?.hasRoad && <div>🛤️ Road</div>}
            </div>
          )}
        </div>

        {/* Right Sidebar - Building Tools */}
        <div className="w-48 bg-gradient-to-b from-amber-100 to-amber-200 border-l-2 border-amber-800 flex flex-col">
          {/* Category Tabs */}
          <div className="bg-amber-800 text-white p-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-amber-700 text-white rounded px-2 py-1 text-sm"
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
          <div className="flex-1 p-2 overflow-y-auto">
            <div className="grid grid-cols-3 gap-1">
              {BUILDING_CATEGORIES[selectedCategory as keyof typeof BUILDING_CATEGORIES]?.map((building) => (
                <button
                  key={building.id}
                  onClick={() => setGameState((prev) => ({ ...prev, selectedTool: building.id }))}
                  disabled={gameState.denarii < building.cost}
                  className={`
                    aspect-square border-2 rounded flex flex-col items-center justify-center text-xs p-1
                    ${
                      gameState.selectedTool === building.id
                        ? "border-amber-800 bg-amber-300"
                        : gameState.denarii < building.cost
                          ? "border-gray-400 bg-gray-200 opacity-50 cursor-not-allowed"
                          : "border-amber-600 bg-amber-50 hover:bg-amber-100"
                    }
                  `}
                  title={`${building.name} - ${building.cost} Denarii`}
                >
                  <span className="text-lg">{building.icon}</span>
                  <span className="text-xs text-center leading-tight mt-1">{building.name}</span>
                  <span className="text-xs text-amber-700">
                    {building.cost} {gameState.denarii >= building.cost ? "💰" : "❌"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="p-2 border-t border-amber-600 space-y-2">
            <Button
              onClick={() => setShowFestivalDialog(true)}
              className="w-full bg-purple-700 hover:bg-purple-600 text-white text-xs"
              size="sm"
            >
              <Church className="w-4 h-4 mr-1" />
              🎉 Hold Festival
            </Button>
            <Button
              onClick={() => openAdvisor("trade")}
              className="w-full bg-blue-700 hover:bg-blue-600 text-white text-xs"
              size="sm"
            >
              <Ship className="w-4 h-4 mr-1" />
              🚢 Trade
            </Button>
            <Button
              onClick={() => openAdvisor("military")}
              className="w-full bg-red-700 hover:bg-red-600 text-white text-xs"
              size="sm"
            >
              <Swords className="w-4 h-4 mr-1" />
              ⚔️ Military
            </Button>
          </div>
        </div>
      </div>

      {/* Festival Dialog - Roman Style */}
      <Dialog open={showFestivalDialog} onOpenChange={setShowFestivalDialog}>
        <DialogContent className="max-w-2xl bg-gradient-to-b from-amber-50 to-amber-100 border-4 border-amber-800">
          <div
            className="absolute inset-0 opacity-20 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/festival-bg.jpg')" }}
          />
          <div className="relative z-10">
            <DialogHeader>
              <DialogTitle className="text-2xl text-amber-900 text-center font-bold">
                🎉 Hold festival to {ROMAN_GODS.find((g) => g.id === selectedGod)?.name} 🎊
              </DialogTitle>
            </DialogHeader>

            {/* God Selection */}
            <div className="flex justify-center space-x-4 my-6">
              {ROMAN_GODS.map((god) => (
                <button
                  key={god.id}
                  onClick={() => setSelectedGod(god.id)}
                  className={`
                    w-16 h-16 rounded-lg border-4 flex items-center justify-center text-2xl
                    ${
                      selectedGod === god.id
                        ? "border-amber-800 bg-amber-200"
                        : "border-amber-600 bg-amber-50 hover:bg-amber-100"
                    }
                  `}
                  title={`${god.name} - ${god.domain}`}
                >
                  {god.portrait}
                </button>
              ))}
            </div>

            {/* Festival Options */}
            <div className="space-y-3">
              <button 
                className="w-full flex justify-between items-center p-3 bg-amber-50 rounded border-2 border-amber-600 hover:bg-amber-100"
                onClick={() => {
                  if (gameState.denarii >= 145) {
                    setGameState(prev => ({ ...prev, denarii: prev.denarii - 145 }))
                    addNotification("festival_success")
                    setShowFestivalDialog(false)
                  } else {
                    addNotification("insufficient_funds")
                  }
                }}
              >
                <span className="font-semibold">🎭 Small festival</span>
                <span>145 💰</span>
              </button>
              <button 
                className="w-full flex justify-between items-center p-3 bg-amber-50 rounded border-2 border-amber-600 hover:bg-amber-100"
                onClick={() => {
                  if (gameState.denarii >= 291) {
                    setGameState(prev => ({ ...prev, denarii: prev.denarii - 291 }))
                    addNotification("festival_success")
                    setShowFestivalDialog(false)
                  } else {
                    addNotification("insufficient_funds")
                  }
                }}
              >
                <span className="font-semibold">🎪 Large festival</span>
                <span>291 💰</span>
              </button>
              <button 
                className="w-full flex justify-between items-center p-3 bg-amber-100 rounded border-2 border-amber-800 hover:bg-amber-200"
                onClick={() => {
                  if (gameState.denarii >= 500) {
                    setGameState(prev => ({ ...prev, denarii: prev.denarii - 500 }))
                    addNotification("festival_success")
                    setShowFestivalDialog(false)
                  } else {
                    addNotification("insufficient_funds")
                  }
                }}
              >
                <div>
                  <span className="font-semibold">🏛️ Grand festival</span>
                  <div className="text-sm text-gray-600">Arrange a festival in honor of this god</div>
                </div>
                <span>500 💰</span>
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
            <div className="text-center mt-4">
              <Button onClick={() => setShowHelpDialog(false)} className="bg-amber-700 hover:bg-amber-600">
                ✅ Got it!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
