"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Church, Swords, Ship, Play, Pause, Volume2, Settings } from "lucide-react"

// Enhanced interfaces for detailed population system
interface Citizen {
  id: string
  age: number
  class: "plebeian" | "patrician"
  occupation?: string
  housingId?: string
  mood: number // 0-100
  isMoving: boolean
  position: { x: number; y: number }
  destination?: { x: number; y: number }
  hasCart: boolean // for immigrants
  isHomeless: boolean
  grievances: string[]
}

interface Housing {
  id: string
  level: number // 1-20, determines capacity and citizen class
  capacity: number
  residents: Citizen[]
  hasWater: boolean
  hasFood: boolean
  hasGoods: boolean
  isEvolved: boolean
  canEvolveTo?: number
}

interface Building {
  id: string
  type: string
  level: number
  position: { x: number; y: number }
  employees: Citizen[]
  maxEmployees: number
  hasLaborAccess: boolean
  recruiterActive: boolean
  recruiterPosition?: { x: number; y: number }
  isOperational: boolean
}

interface GameState {
  population: number
  plebeians: number
  patricians: number
  workforce: number
  unemployed: number
  denarii: number
  food: number
  favor: number
  month: number
  year: number
  isPaused: boolean
  selectedTool: string
  cityMood: number // Overall city happiness affects immigration
  birthRate: number
  deathRate: number
  immigrationRate: number
  emigrationRate: number
}

interface CityTile {
  x: number
  y: number
  terrain: "grass" | "water" | "fertile" | "rock" | "forest"
  building?: Building
  housing?: Housing
  hasRoad: boolean
  distanceFromRoad: number
}

// Housing evolution data
const HOUSING_LEVELS = {
  1: { name: "Tent", capacity: 2, class: "plebeian", icon: "⛺" },
  2: { name: "Shack", capacity: 4, class: "plebeian", icon: "🏚️" },
  3: { name: "Hovel", capacity: 6, class: "plebeian", icon: "🏠" },
  4: { name: "Casa", capacity: 8, class: "plebeian", icon: "🏘️" },
  5: { name: "Insulae", capacity: 12, class: "plebeian", icon: "🏢" },
  6: { name: "Atrium House", capacity: 16, class: "plebeian", icon: "🏛️" },
  7: { name: "Domus", capacity: 20, class: "plebeian", icon: "🏰" },
  8: { name: "Small Villa", capacity: 8, class: "patrician", icon: "🏰" },
  9: { name: "Medium Villa", capacity: 12, class: "patrician", icon: "🏛️" },
  10: { name: "Large Villa", capacity: 16, class: "patrician", icon: "🏰" },
}

// Building categories matching Caesar 3
const BUILDING_CATEGORIES = {
  housing: [
    { id: "clear_land", name: "Clear Land", icon: "🧹", cost: 0 },
    { id: "road", name: "Road", icon: "🛤️", cost: 2 },
    { id: "tent", name: "Tent", icon: "⛺", cost: 10 },
  ],
  water: [
    { id: "well", name: "Well", icon: "🕳️", cost: 15, employees: 1 },
    { id: "fountain", name: "Fountain", icon: "⛲", cost: 25, employees: 0 },
    { id: "reservoir", name: "Reservoir", icon: "🏛️", cost: 80, employees: 1 },
    { id: "aqueduct", name: "Aqueduct", icon: "🌉", cost: 8, employees: 0 },
  ],
  health: [
    { id: "barber", name: "Barber", icon: "✂️", cost: 25, employees: 1 },
    { id: "bathhouse", name: "Bath House", icon: "🛁", cost: 50, employees: 2 },
    { id: "doctor", name: "Doctor", icon: "⚕️", cost: 30, employees: 2 },
    { id: "hospital", name: "Hospital", icon: "🏥", cost: 75, employees: 4 },
  ],
  education: [
    { id: "school", name: "School", icon: "🏫", cost: 50, employees: 1 },
    { id: "academy", name: "Academy", icon: "🎓", cost: 100, employees: 2 },
    { id: "library", name: "Library", icon: "📚", cost: 75, employees: 1 },
  ],
  entertainment: [
    { id: "theater", name: "Theater", icon: "🎭", cost: 80, employees: 3 },
    { id: "amphitheater", name: "Amphitheater", icon: "🏟️", cost: 150, employees: 5 },
    { id: "colosseum", name: "Colosseum", icon: "🏛️", cost: 300, employees: 8 },
    { id: "hippodrome", name: "Hippodrome", icon: "🏇", cost: 500, employees: 10 },
    { id: "actor_colony", name: "Actor Colony", icon: "🎪", cost: 60, employees: 2 },
    { id: "gladiator_school", name: "Gladiator School", icon: "⚔️", cost: 100, employees: 3 },
  ],
  religion: [
    { id: "small_temple", name: "Small Temple", icon: "⛪", cost: 50, employees: 2 },
    { id: "large_temple", name: "Large Temple", icon: "🏛️", cost: 150, employees: 4 },
    { id: "oracle", name: "Oracle", icon: "🔮", cost: 200, employees: 1 },
  ],
  commerce: [
    { id: "market", name: "Market", icon: "🏪", cost: 40, employees: 2 },
    { id: "granary", name: "Granary", icon: "🏬", cost: 100, employees: 1 },
    { id: "warehouse", name: "Warehouse", icon: "🏭", cost: 70, employees: 1 },
    { id: "dock", name: "Dock", icon: "⚓", cost: 120, employees: 3 },
  ],
  industry: [
    { id: "wheat_farm", name: "Wheat Farm", icon: "🌾", cost: 40, employees: 2 },
    { id: "vegetable_farm", name: "Vegetable Farm", icon: "🥬", cost: 40, employees: 2 },
    { id: "fruit_farm", name: "Fruit Farm", icon: "🍎", cost: 40, employees: 2 },
    { id: "olive_farm", name: "Olive Farm", icon: "🫒", cost: 45, employees: 2 },
    { id: "vine_farm", name: "Vine Farm", icon: "🍇", cost: 45, employees: 2 },
    { id: "pig_farm", name: "Pig Farm", icon: "🐷", cost: 50, employees: 2 },
    { id: "clay_pit", name: "Clay Pit", icon: "🧱", cost: 50, employees: 3 },
    { id: "iron_mine", name: "Iron Mine", icon: "⛏️", cost: 75, employees: 4 },
    { id: "timber_yard", name: "Timber Yard", icon: "🪵", cost: 40, employees: 3 },
    { id: "pottery_workshop", name: "Pottery Workshop", icon: "🏺", cost: 40, employees: 2 },
    { id: "furniture_workshop", name: "Furniture Workshop", icon: "🪑", cost: 50, employees: 2 },
    { id: "oil_workshop", name: "Oil Workshop", icon: "🫗", cost: 40, employees: 2 },
    { id: "wine_workshop", name: "Wine Workshop", icon: "🍷", cost: 45, employees: 2 },
    { id: "weapons_workshop", name: "Weapons Workshop", icon: "⚔️", cost: 60, employees: 3 },
  ],
  government: [
    { id: "forum", name: "Forum", icon: "🏛️", cost: 75, employees: 2 },
    { id: "senate", name: "Senate", icon: "🏛️", cost: 250, employees: 4 },
    { id: "governors_house", name: "Governor's House", icon: "🏰", cost: 150, employees: 3 },
    { id: "governors_villa", name: "Governor's Villa", icon: "🏰", cost: 400, employees: 5 },
    { id: "governors_palace", name: "Governor's Palace", icon: "🏰", cost: 700, employees: 8 },
  ],
  security: [
    { id: "prefecture", name: "Prefecture", icon: "🚨", cost: 30, employees: 2 },
    { id: "engineer_post", name: "Engineer Post", icon: "🔧", cost: 30, employees: 2 },
  ],
  military: [
    { id: "walls", name: "Walls", icon: "🧱", cost: 8, employees: 0 },
    { id: "tower", name: "Tower", icon: "🗼", cost: 50, employees: 2 },
    { id: "gatehouse", name: "Gatehouse", icon: "🚪", cost: 80, employees: 2 },
    { id: "barracks", name: "Barracks", icon: "🏰", cost: 150, employees: 4 },
    { id: "fort", name: "Fort", icon: "🏰", cost: 200, employees: 6 },
    { id: "military_academy", name: "Military Academy", icon: "🎖️", cost: 120, employees: 3 },
  ],
  beautification: [
    { id: "garden", name: "Garden", icon: "🌸", cost: 12, employees: 0 },
    { id: "plaza", name: "Plaza", icon: "🏛️", cost: 15, employees: 0 },
    { id: "statue", name: "Statue", icon: "🗿", cost: 60, employees: 0 },
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
  { id: "population_growth", message: "🏘️ New immigrants arrive with carts!", icon: "👥" },
  { id: "population_decline", message: "😔 Citizens are leaving the city!", icon: "🚪" },
  { id: "food_shortage", message: "🍽️ Food shortage! Citizens are hungry.", icon: "⚠️" },
  { id: "wealth_increase", message: "💰 Treasury grows! Trade prospers.", icon: "💎" },
  { id: "building_complete", message: "🏗️ Construction complete!", icon: "✅" },
  { id: "festival_success", message: "🎉 Festival successful! People rejoice.", icon: "🎊" },
  { id: "invasion_warning", message: "⚔️ Barbarians approach!", icon: "🛡️" },
  { id: "disease_outbreak", message: "🤒 Disease spreads through the city.", icon: "🏥" },
  { id: "fire_outbreak", message: "🔥 Fire breaks out!", icon: "🚒" },
  { id: "insufficient_funds", message: "💸 Insufficient funds! Need more denarii.", icon: "❌" },
  { id: "housing_evolved", message: "🏠 Housing has evolved to a higher level!", icon: "⬆️" },
  { id: "housing_devolved", message: "🏚️ Housing has devolved due to lack of services!", icon: "⬇️" },
  { id: "unemployment", message: "💼 High unemployment! People need jobs.", icon: "📉" },
  { id: "labor_shortage", message: "👷 Labor shortage! Buildings can't operate.", icon: "⚠️" },
  { id: "homeless_citizens", message: "🎒 Citizens are homeless and may leave!", icon: "😢" },
]

// Resource icons for UI
const RESOURCE_ICONS = {
  denarii: "💰",
  population: "👥",
  plebeians: "👨‍🌾",
  patricians: "👑",
  food: "🍽️",
  favor: "👑",
  workforce: "👷",
  unemployed: "💼",
  month: "📅",
  year: "🗓️",
}

export default function CaesarGame() {
  const [gameState, setGameState] = useState<GameState>({
    population: 28,
    plebeians: 28,
    patricians: 0,
    workforce: 18, // About 2/3 of plebeians aged 22-50
    unemployed: 18,
    denarii: 8000,
    food: 16,
    favor: 55,
    month: 1,
    year: 106,
    isPaused: false,
    selectedTool: "clear_land",
    cityMood: 60,
    birthRate: 0.02,
    deathRate: 0.01,
    immigrationRate: 0.05,
    emigrationRate: 0.01,
  })

  const [citizens, setCitizens] = useState<Citizen[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [cityGrid, setCityGrid] = useState<CityTile[][]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("housing")
  const [showFestivalDialog, setShowFestivalDialog] = useState(false)
  const [selectedGod, setSelectedGod] = useState<string>("neptune")
  const [showAdvisorDialog, setShowAdvisorDialog] = useState(false)
  const [currentAdvisor, setCurrentAdvisor] = useState<string>("")
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, icon: string, timestamp: number}>>([])
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [showPopulationDialog, setShowPopulationDialog] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null)
  const [showCitizenDialog, setShowCitizenDialog] = useState(false)

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

  // Helper functions for population system
  const generateCitizenId = () => `citizen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const generateBuildingId = () => `building_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const generateHousingId = () => `housing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Calculate workforce from plebeians aged 22-50
  const calculateWorkforce = useCallback((citizenList: Citizen[]) => {
    const workingAge = citizenList.filter(c => 
      c.class === "plebeian" && c.age >= 22 && c.age <= 50
    )
    return Math.floor(workingAge.length * 2/3)
  }, [])

  // Initialize population with realistic age distribution
  const initializePopulation = useCallback(() => {
    const initialCitizens: Citizen[] = []
    
    // Create initial population with varied ages
    for (let i = 0; i < 28; i++) {
      const age = Math.floor(Math.random() * 45) + 5 // Ages 5-50
      initialCitizens.push({
        id: generateCitizenId(),
        age,
        class: "plebeian",
        mood: 50 + Math.random() * 30, // 50-80 starting mood
        isMoving: false,
        position: { x: 20 + Math.random() * 20, y: 15 + Math.random() * 10 },
        hasCart: false,
        isHomeless: true, // Start homeless until housing is built
        grievances: [],
      })
    }
    
    setCitizens(initialCitizens)
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

  // Calculate distance from roads for labor access
  const calculateRoadDistance = useCallback((grid: CityTile[][], x: number, y: number): number => {
    if (grid[y]?.[x]?.hasRoad) return 0
    
    let minDistance = Infinity
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const checkY = y + dy
        const checkX = x + dx
        if (checkY >= 0 && checkY < grid.length && checkX >= 0 && checkX < grid[0].length) {
          if (grid[checkY][checkX].hasRoad) {
            const distance = Math.max(Math.abs(dx), Math.abs(dy))
            minDistance = Math.min(minDistance, distance)
          }
        }
      }
    }
    return minDistance === Infinity ? 10 : minDistance
  }, [])

  // Send recruiter to establish labor access
  const sendRecruiter = useCallback((building: Building, grid: CityTile[][]) => {
    // Find nearby housing within 2 spaces of roads
    const nearbyHousing: { x: number; y: number; distance: number }[] = []
    
    for (let dy = -10; dy <= 10; dy++) {
      for (let dx = -10; dx <= 10; dx++) {
        const checkY = building.position.y + dy
        const checkX = building.position.x + dx
        
        if (checkY >= 0 && checkY < grid.length && checkX >= 0 && checkX < grid[0].length) {
          const tile = grid[checkY][checkX]
          if (tile.housing && tile.distanceFromRoad <= 2) {
            const distance = Math.abs(dx) + Math.abs(dy)
            nearbyHousing.push({ x: checkX, y: checkY, distance })
          }
        }
      }
    }
    
    if (nearbyHousing.length > 0) {
      // Sort by distance and pick closest
      nearbyHousing.sort((a, b) => a.distance - b.distance)
      const target = nearbyHousing[0]
      
      // Update building to have labor access
      setBuildings(prev => prev.map(b => 
        b.id === building.id 
          ? { ...b, hasLaborAccess: true, recruiterActive: false }
          : b
      ))
      
      addNotification("building_complete")
      showActionFeedback(`${building.type} has access to labor!`)
    } else {
      showActionFeedback(`${building.type} cannot find nearby housing!`)
    }
  }, [addNotification, showActionFeedback])

  // Population simulation - births, deaths, immigration, emigration
  const simulatePopulation = useCallback(() => {
    if (gameState.isPaused) return

    setCitizens(prev => {
      let newCitizens = [...prev]
      
      // Natural births (based on adults aged 20-40)
      const adults = newCitizens.filter(c => c.age >= 20 && c.age <= 40)
      if (adults.length > 10 && Math.random() < gameState.birthRate) {
        const newborn: Citizen = {
          id: generateCitizenId(),
          age: 0,
          class: "plebeian",
          mood: 80,
          isMoving: false,
          position: { x: 20 + Math.random() * 20, y: 15 + Math.random() * 10 },
          hasCart: false,
          isHomeless: true,
          grievances: [],
        }
        newCitizens.push(newborn)
        addNotification("population_growth")
      }
      
      // Natural deaths (higher chance for older citizens)
      newCitizens = newCitizens.filter(citizen => {
        const deathChance = citizen.age > 50 ? 0.1 : citizen.age > 40 ? 0.02 : 0.005
        return Math.random() > deathChance
      })
      
      // Immigration (based on city mood)
      if (gameState.cityMood > 60 && Math.random() < gameState.immigrationRate) {
        const immigrantCount = Math.floor(Math.random() * 5) + 1
        for (let i = 0; i < immigrantCount; i++) {
          const immigrant: Citizen = {
            id: generateCitizenId(),
            age: Math.floor(Math.random() * 40) + 15,
            class: "plebeian",
            mood: 60 + Math.random() * 20,
            isMoving: true,
            position: { x: 0, y: 20 },
            destination: { x: 30, y: 20 },
            hasCart: true,
            isHomeless: true,
            grievances: [],
          }
          newCitizens.push(immigrant)
        }
        addNotification("population_growth")
      }
      
      // Emigration (based on low mood)
      if (gameState.cityMood < 40) {
        const leavingCitizens = newCitizens.filter(c => c.mood < 30 && Math.random() < gameState.emigrationRate)
        if (leavingCitizens.length > 0) {
          newCitizens = newCitizens.filter(c => !leavingCitizens.includes(c))
          addNotification("population_decline")
        }
      }
      
      // Age citizens monthly
      newCitizens = newCitizens.map(citizen => ({
        ...citizen,
        age: citizen.age + (1/12) // Age by 1 month
      }))
      
      return newCitizens
    })
  }, [gameState.isPaused, gameState.cityMood, gameState.birthRate, gameState.emigrationRate, gameState.immigrationRate, addNotification])

  // Update game state based on population changes
  useEffect(() => {
    const plebeianCount = citizens.filter(c => c.class === "plebeian").length
    const patricianCount = citizens.filter(c => c.class === "patrician").length
    const workforce = calculateWorkforce(citizens)
    const employed = buildings.reduce((total, b) => total + b.employees.length, 0)
    const unemployed = workforce - employed
    
    // Calculate city mood based on various factors
    const homelessCount = citizens.filter(c => c.isHomeless).length
    const unemploymentRate = workforce > 0 ? unemployed / workforce : 0
    const housingShortage = homelessCount > 0
    
    let moodModifier = 0
    if (unemploymentRate > 0.3) moodModifier -= 20
    if (housingShortage) moodModifier -= 15
    if (gameState.food < 5) moodModifier -= 25
    if (gameState.denarii > 5000) moodModifier += 10
    
    const newMood = Math.max(0, Math.min(100, 60 + moodModifier))
    
    setGameState(prev => ({
      ...prev,
      population: citizens.length,
      plebeians: plebeianCount,
      patricians: patricianCount,
      workforce,
      unemployed,
      cityMood: newMood,
    }))
  }, [citizens, buildings, calculateWorkforce, gameState.food, gameState.denarii])

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
          distanceFromRoad: 10,
        })
      }
      grid.push(row)
    }
    setCityGrid(grid)
    
    // Initialize population
    initializePopulation()
  }, [initializePopulation])

  // Update road distances when roads change
  useEffect(() => {
    setCityGrid(prev => prev.map(row => 
      row.map(tile => ({
        ...tile,
        distanceFromRoad: calculateRoadDistance(prev, tile.x, tile.y)
      }))
    ))
  }, [cityGrid.map(row => row.map(tile => tile.hasRoad)).join(''), calculateRoadDistance])

  // Population simulation timer
  useEffect(() => {
    const interval = setInterval(simulatePopulation, 3000) // Every 3 seconds
    return () => clearInterval(interval)
  }, [simulatePopulation])

  // Render isometric city view with citizens
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
            
            // Draw labor access indicator
            if (tile.building.hasLaborAccess) {
              ctx.fillStyle = "#00ff00"
              ctx.fillRect(-2, -8, 4, 2)
            } else if (tile.building.recruiterActive) {
              ctx.fillStyle = "#ffff00"
              ctx.fillRect(-2, -8, 4, 2)
            } else {
              ctx.fillStyle = "#ff0000"
              ctx.fillRect(-2, -8, 4, 2)
            }
          }
        }

        // Draw housing with evolution level
        if (tile.housing) {
          const housingData = HOUSING_LEVELS[tile.housing.level as keyof typeof HOUSING_LEVELS]
          if (housingData) {
            ctx.font = "16px Arial"
            ctx.textAlign = "center"
            ctx.fillText(housingData.icon, 0, -2)
            
            // Draw occupancy indicator
            const occupancyRate = tile.housing.residents.length / tile.housing.capacity
            ctx.fillStyle = occupancyRate > 0.8 ? "#ff0000" : occupancyRate > 0.5 ? "#ffff00" : "#00ff00"
            ctx.fillRect(-3, 6, 6, 2)
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

    // Draw citizens
    citizens.forEach((citizen, index) => {
      const screenX = (citizen.position.x - citizen.position.y) * (tileWidth / 2) + canvas.width / 2
      const screenY = (citizen.position.x + citizen.position.y) * (tileHeight / 2) + 50

      ctx.save()
      ctx.translate(screenX, screenY)
      
      // Draw citizen
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      
      // Different icons based on citizen state
      let citizenIcon = "👨"
      if (citizen.hasCart) citizenIcon = "🛒"
      else if (citizen.isHomeless) citizenIcon = "🎒"
      else if (citizen.class === "patrician") citizenIcon = "👑"
      else if (citizen.occupation) citizenIcon = "👷"
      
      ctx.fillText(citizenIcon, 0, -5)
      
      // Draw mood indicator
      const moodColor = citizen.mood > 70 ? "#00ff00" : citizen.mood > 40 ? "#ffff00" : "#ff0000"
      ctx.fillStyle = moodColor
      ctx.fillRect(-2, -15, 4, 2)
      
      // Draw selection highlight if citizen is selected
      if (selectedCitizen && selectedCitizen.id === citizen.id) {
        ctx.strokeStyle = "#ffff00"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(0, -5, 8, 0, 2 * Math.PI)
        ctx.stroke()
      }
      
      ctx.restore()
    })
      }, [cityGrid, hoveredTile, gameState.selectedTool, citizens, selectedCitizen])

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

  // Add mouse move handler
  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    // Scale mouse coordinates to match canvas coordinates
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const scaledX = mouseX * scaleX
    const scaledY = mouseY * scaleY

    const { x: gridX, y: gridY } = screenToGrid(scaledX, scaledY)

    if (gridX >= 0 && gridX < 60 && gridY >= 0 && gridY < 40) {
      setHoveredTile({ x: gridX, y: gridY })
    } else {
      setHoveredTile(null)
    }

    setMousePos({ x: mouseX, y: mouseY })
  }, [screenToGrid])

    const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const clickX = event.clientX - rect.left
      const clickY = event.clientY - rect.top

      // Scale mouse coordinates to match canvas coordinates
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const scaledX = clickX * scaleX
      const scaledY = clickY * scaleY

      // Check for citizen click first (right-click or with modifier key)
      if (event.button === 2 || event.ctrlKey) {
        event.preventDefault()
        if (handleCitizenClick(scaledX, scaledY)) {
          return // Citizen was clicked, don't place buildings
        }
      }

      const { x: gridX, y: gridY } = screenToGrid(scaledX, scaledY)

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
              tile.housing = undefined
              tile.hasRoad = false
              showActionFeedback("Land cleared!")
            } else if (gameState.selectedTool === "tent") {
              // Place housing
              if (gameState.denarii >= 10) {
                const newHousing: Housing = {
                  id: generateHousingId(),
                  level: 1,
                  capacity: 2,
                  residents: [],
                  hasWater: false,
                  hasFood: false,
                  hasGoods: false,
                  isEvolved: false,
                }
                tile.housing = newHousing
                
                // Assign homeless citizens to this housing
                setCitizens(prev => {
                  const homeless = prev.filter(c => c.isHomeless).slice(0, 2)
                  return prev.map(citizen => {
                    if (homeless.includes(citizen)) {
                      return { ...citizen, isHomeless: false, housingId: newHousing.id, position: { x: gridX, y: gridY } }
                    }
                    return citizen
                  })
                })
                
                setGameState(prev => ({ ...prev, denarii: prev.denarii - 10 }))
                addNotification("building_complete")
                showActionFeedback("Tent built! Homeless citizens move in.")
              } else {
                addNotification("insufficient_funds")
                showActionFeedback("Insufficient funds!")
              }
            } else {
              // Place building
              const buildingData = Object.values(BUILDING_CATEGORIES)
                .flat()
                .find((b) => b.id === gameState.selectedTool)
              
              if (buildingData) {
                if (gameState.denarii >= buildingData.cost) {
                  const newBuilding: Building = {
                    id: generateBuildingId(),
                    type: gameState.selectedTool,
                    level: 1,
                    position: { x: gridX, y: gridY },
                    employees: [],
                    maxEmployees: buildingData.employees || 0,
                    hasLaborAccess: false,
                    recruiterActive: buildingData.employees > 0, // Start recruiting if needs employees
                    recruiterPosition: undefined,
                    isOperational: buildingData.employees === 0, // Buildings with no employees are immediately operational
                  }
                  
                  tile.building = newBuilding
                  setBuildings(prev => [...prev, newBuilding])
                  
                  // Start recruiter process if building needs employees
                  if (buildingData.employees > 0) {
                    setTimeout(() => sendRecruiter(newBuilding, newGrid), 1000)
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
                         },
      [gameState.selectedTool, gameState.denarii, addNotification, screenToGrid, sendRecruiter, handleCitizenClick],
    )

  // Check if click is near a citizen
  const handleCitizenClick = useCallback((clickX: number, clickY: number) => {
    const tileWidth = 30
    const tileHeight = 15
    
    for (const citizen of citizens) {
      const screenX = (citizen.position.x - citizen.position.y) * (tileWidth / 2) + 600 // canvas.width / 2
      const screenY = (citizen.position.x + citizen.position.y) * (tileHeight / 2) + 50
      
      const distance = Math.sqrt((clickX - screenX) ** 2 + (clickY - screenY) ** 2)
      if (distance < 20) { // 20 pixel radius for citizen clicking
        setSelectedCitizen(citizen)
        setShowCitizenDialog(true)
        
        // Generate some realistic grievances based on citizen state
        const grievances: string[] = []
        if (citizen.isHomeless) grievances.push("I have nowhere to live!")
        if (!citizen.occupation && citizen.age >= 22 && citizen.age <= 50) grievances.push("I need work to support my family!")
        if (gameState.food < 10) grievances.push("There's not enough food in the city!")
        if (gameState.cityMood < 50) grievances.push("Life in this city is becoming unbearable!")
        if (citizen.mood < 40) grievances.push("I'm thinking of leaving this place!")
        if (citizen.age > 45) grievances.push("I worry about my health as I age...")
        
        // Update citizen with grievances
        setCitizens(prev => prev.map(c => 
          c.id === citizen.id ? { ...c, grievances } : c
        ))
        
        showActionFeedback(`Talking to ${citizen.class === "patrician" ? "patrician" : "citizen"}`)
        return true
      }
    }
    return false
  }, [citizens, gameState.food, gameState.cityMood, showActionFeedback])

  const togglePause = () => {
    setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }))
  }

  const openAdvisor = (advisor: string) => {
    setCurrentAdvisor(advisor)
    setShowAdvisorDialog(true)
  }

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
          setShowPopulationDialog(false)
          setShowCitizenDialog(false)
          setSelectedCitizen(null)
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
        case 'p':
          if (!showPopulationDialog) {
            setShowPopulationDialog(true)
            showActionFeedback("Population Dialog Opened")
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
  }, [gameState.isPaused, showFestivalDialog, showAdvisorDialog, showSettingsDialog, showHelpDialog, showPopulationDialog, showCitizenDialog, isMuted, selectedCategory, togglePause, openAdvisor, showActionFeedback])

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {/* Top Menu Bar - Caesar 3 Style */}
      <div className="roman-gradient text-white px-6 py-4 flex items-center justify-between text-sm border-b-4 border-amber-950 shadow-roman-lg relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm0 0c0 11.046 8.954 20 20 20s20-8.954 20-20-8.954-20-20-20-20 8.954-20 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="flex items-center space-x-8 relative z-10">
          <div className="flex items-center space-x-3 animate-float">
            <span className="text-3xl text-glow">🏛️</span>
            <div>
              <span className="text-roman text-2xl tracking-wider text-glow">CAESAR III</span>
              <div className="text-xs text-amber-200 opacity-80">The Emoji Asset Library</div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-amber-700/50 transition-all duration-300 hover:scale-105 btn-roman">
              <span className="text-lg">📁</span>
              <span className="font-semibold">File</span>
            </button>
            <button 
              onClick={() => setShowSettingsDialog(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-amber-700/50 transition-all duration-300 hover:scale-105 btn-roman"
            >
              <span className="text-lg">⚙️</span>
              <span className="font-semibold">Options</span>
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
            <button 
              onClick={() => setShowPopulationDialog(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-amber-700/50 transition-all duration-300 hover:scale-105 btn-roman"
            >
              <span className="text-lg">📊</span>
              <span className="font-semibold">Population</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-8 relative z-10">
          <div className="flex items-center space-x-6 bg-amber-800/80 backdrop-blur-sm px-6 py-3 rounded-xl border-2 border-amber-600 shadow-roman animate-pulse-glow">
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
              <span className="text-2xl animate-float">{RESOURCE_ICONS.plebeians}</span>
              <div>
                <span className="font-bold text-xl text-glow">{gameState.plebeians}</span>
                <div className="text-xs text-amber-200">Plebeians</div>
              </div>
            </div>
            <div className="w-px h-8 bg-amber-600"></div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl animate-float">{RESOURCE_ICONS.patricians}</span>
              <div>
                <span className="font-bold text-xl text-glow">{gameState.patricians}</span>
                <div className="text-xs text-amber-200">Patricians</div>
              </div>
            </div>
            <div className="w-px h-8 bg-amber-600"></div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl animate-float">{RESOURCE_ICONS.workforce}</span>
              <div>
                <span className="font-bold text-xl text-glow">{gameState.workforce}</span>
                <div className="text-xs text-amber-200">Workforce</div>
              </div>
            </div>
            <div className="w-px h-8 bg-amber-600"></div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl animate-float">{RESOURCE_ICONS.unemployed}</span>
              <div>
                <span className="font-bold text-xl text-glow text-${gameState.unemployed > gameState.workforce * 0.3 ? 'red' : 'green'}-300">{gameState.unemployed}</span>
                <div className="text-xs text-amber-200">Unemployed</div>
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
          </div>
          <div className="flex items-center space-x-3 bg-amber-800/80 backdrop-blur-sm px-6 py-3 rounded-xl border-2 border-amber-600 shadow-roman">
            <span className="text-2xl animate-float">{RESOURCE_ICONS.month}</span>
            <div>
              <span className="font-bold text-xl text-glow">{gameState.month} AD {gameState.year}</span>
              <div className="text-xs text-amber-200">Current Date</div>
            </div>
            <div className="w-px h-8 bg-amber-600 ml-3"></div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">
                {gameState.cityMood > 80 ? "😊" : gameState.cityMood > 60 ? "😐" : gameState.cityMood > 40 ? "😕" : "😠"}
              </span>
              <div>
                <span className="font-bold text-lg text-glow">{gameState.cityMood}%</span>
                <div className="text-xs text-amber-200">City Mood</div>
              </div>
            </div>
            {gameState.isPaused && (
              <div className="ml-3 px-3 py-1 bg-red-600/80 rounded-lg animate-pulse">
                <span className="text-red-100 font-bold text-sm">⏸️ PAUSED</span>
              </div>
            )}
          </div>
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
            onContextMenu={(e) => e.preventDefault()}
            onMouseDown={handleCanvasClick}
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
                {cityGrid[hoveredTile.y]?.[hoveredTile.x]?.housing && (
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🏠</span>
                    <span className="font-semibold">Housing: {HOUSING_LEVELS[cityGrid[hoveredTile.y]?.[hoveredTile.x]?.housing?.level as keyof typeof HOUSING_LEVELS]?.name}</span>
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
        <div className="w-56 bg-gradient-to-b from-amber-50 via-amber-100 to-amber-200 border-l-4 border-amber-800 flex flex-col shadow-roman-lg custom-scrollbar">
          {/* Category Tabs */}
          <div className="roman-gradient text-white p-4 border-b-2 border-amber-700 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.523-4.477-10-10-10s-10 4.477-10 10 4.477 10 10 10 10-4.477 10-10zm0 0c0 5.523 4.477 10 10 10s10-4.477 10-10-4.477-10-10-10-10 4.477-10 10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
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

      {/* Population Advisor Dialog */}
      <Dialog open={showPopulationDialog} onOpenChange={setShowPopulationDialog}>
        <DialogContent className="max-w-4xl bg-gradient-to-b from-amber-50 to-amber-100 border-4 border-amber-800">
          <DialogHeader>
            <DialogTitle className="text-2xl text-amber-900 text-center font-bold">
              📊 Population Advisor Panel
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {/* Population Overview */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/50 rounded-xl p-4 border-2 border-amber-600">
                <h3 className="font-bold text-lg mb-3 text-amber-800">👥 Population Overview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Population:</span>
                    <span className="font-bold">{gameState.population}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>👨‍🌾 Plebeians:</span>
                    <span className="font-bold">{gameState.plebeians}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>👑 Patricians:</span>
                    <span className="font-bold">{gameState.patricians}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>👷 Workforce:</span>
                    <span className="font-bold">{gameState.workforce}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>💼 Unemployed:</span>
                    <span className={`font-bold ${gameState.unemployed > gameState.workforce * 0.3 ? 'text-red-600' : 'text-green-600'}`}>
                      {gameState.unemployed}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>🎒 Homeless:</span>
                    <span className="font-bold text-red-600">{citizens.filter(c => c.isHomeless).length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/50 rounded-xl p-4 border-2 border-amber-600">
                <h3 className="font-bold text-lg mb-3 text-amber-800">📈 City Statistics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>City Mood:</span>
                    <span className={`font-bold ${gameState.cityMood > 60 ? 'text-green-600' : gameState.cityMood > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {gameState.cityMood}% {gameState.cityMood > 80 ? "😊" : gameState.cityMood > 60 ? "😐" : gameState.cityMood > 40 ? "😕" : "😠"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Immigration Rate:</span>
                    <span className="font-bold">{(gameState.immigrationRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Emigration Rate:</span>
                    <span className="font-bold">{(gameState.emigrationRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Birth Rate:</span>
                    <span className="font-bold">{(gameState.birthRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Death Rate:</span>
                    <span className="font-bold">{(gameState.deathRate * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Age Demographics */}
            <div className="bg-white/50 rounded-xl p-4 border-2 border-amber-600">
              <h3 className="font-bold text-lg mb-3 text-amber-800">📊 Age Demographics</h3>
              <div className="grid grid-cols-5 gap-4">
                {[
                  { label: "Children (0-15)", min: 0, max: 15, icon: "👶" },
                  { label: "Youth (16-21)", min: 16, max: 21, icon: "👦" },
                  { label: "Adults (22-50)", min: 22, max: 50, icon: "👨" },
                  { label: "Elderly (51+)", min: 51, max: 100, icon: "👴" },
                ].map(ageGroup => {
                  const count = citizens.filter(c => c.age >= ageGroup.min && c.age <= ageGroup.max).length
                  const percentage = gameState.population > 0 ? ((count / gameState.population) * 100).toFixed(1) : "0"
                  return (
                    <div key={ageGroup.label} className="text-center">
                      <div className="text-2xl mb-2">{ageGroup.icon}</div>
                      <div className="font-bold text-lg">{count}</div>
                      <div className="text-sm text-amber-700">{ageGroup.label}</div>
                      <div className="text-xs text-amber-600">{percentage}%</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Housing Report */}
            <div className="bg-white/50 rounded-xl p-4 border-2 border-amber-600">
              <h3 className="font-bold text-lg mb-3 text-amber-800">🏠 Housing Report</h3>
              <div className="text-sm text-amber-700">
                <p>New immigrants arrive with carts, looking for available housing. They will move into any housing with space.</p>
                <p className="mt-2">Citizens automatically move to better housing when it becomes available, vacating their old homes.</p>
                <p className="mt-2">If services are cut off, housing may devolve to lower levels, forcing some residents to become homeless.</p>
                {citizens.filter(c => c.isHomeless).length > 0 && (
                  <p className="mt-2 text-red-600 font-bold">
                    ⚠️ Warning: {citizens.filter(c => c.isHomeless).length} citizens are currently homeless and may leave the city!
                  </p>
                )}
              </div>
            </div>

            <div className="text-center">
              <Button onClick={() => setShowPopulationDialog(false)} className="bg-amber-700 hover:bg-amber-600">
                ✅ Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Citizen Details Dialog */}
      <Dialog open={showCitizenDialog} onOpenChange={setShowCitizenDialog}>
        <DialogContent className="max-w-lg bg-gradient-to-b from-amber-50 to-amber-100 border-4 border-amber-800">
          <DialogHeader>
            <DialogTitle className="text-2xl text-amber-900 text-center font-bold">
              👤 Citizen Details
            </DialogTitle>
          </DialogHeader>

          {selectedCitizen && (
            <div className="p-6 space-y-4">
              <div className="bg-white/50 rounded-xl p-4 border-2 border-amber-600">
                <div className="flex items-center justify-center mb-4">
                  <span className="text-6xl">
                    {selectedCitizen.hasCart ? "🛒" : 
                     selectedCitizen.isHomeless ? "🎒" : 
                     selectedCitizen.class === "patrician" ? "👑" : 
                     selectedCitizen.occupation ? "👷" : "👨"}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Age:</span>
                    <span className="font-bold">{Math.floor(selectedCitizen.age)} years old</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Class:</span>
                    <span className="font-bold capitalize">{selectedCitizen.class}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-bold">
                      {selectedCitizen.hasCart ? "New Immigrant" :
                       selectedCitizen.isHomeless ? "Homeless" :
                       selectedCitizen.occupation ? selectedCitizen.occupation : "Unemployed"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mood:</span>
                    <span className={`font-bold ${selectedCitizen.mood > 70 ? 'text-green-600' : selectedCitizen.mood > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {Math.floor(selectedCitizen.mood)}% 
                      {selectedCitizen.mood > 70 ? " 😊" : selectedCitizen.mood > 40 ? " 😐" : " 😠"}
                    </span>
                  </div>
                  {selectedCitizen.housingId && (
                    <div className="flex justify-between">
                      <span>Housing:</span>
                      <span className="font-bold">Has Home</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedCitizen.grievances && selectedCitizen.grievances.length > 0 && (
                <div className="bg-red-50 rounded-xl p-4 border-2 border-red-600">
                  <h3 className="font-bold text-lg mb-3 text-red-800">💬 What they're saying:</h3>
                  <div className="space-y-2">
                    {selectedCitizen.grievances.map((grievance, index) => (
                      <div key={index} className="text-sm text-red-700 bg-white/50 p-2 rounded">
                        "{grievance}"
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-600">
                <h3 className="font-bold text-lg mb-2 text-blue-800">ℹ️ About Citizen Interaction</h3>
                <div className="text-sm text-blue-700">
                  <p>• Right-click or Ctrl+click on citizens to talk to them</p>
                  <p>• Citizens will voice their concerns and problems</p>
                  <p>• Homeless citizens may leave if they can't find housing</p>
                  <p>• Happy citizens attract more immigrants to your city</p>
                </div>
              </div>

              <div className="text-center">
                <Button 
                  onClick={() => {
                    setShowCitizenDialog(false)
                    setSelectedCitizen(null)
                  }} 
                  className="bg-amber-700 hover:bg-amber-600"
                >
                  ✅ Close
                </Button>
              </div>
            </div>
          )}
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
