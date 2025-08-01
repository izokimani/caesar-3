# 🏛️ Caesar III: The Emoji Asset Library

A modern, emoji-enhanced recreation of the classic Caesar III city-building game built with React and TypeScript.

## 🎮 Features

### 🏗️ **Building System**
- **12 Building Categories**: Housing, Water, Health, Education, Entertainment, Religion, Commerce, Industry, Government, Security, Military, and Beautification
- **Emoji Icons**: Every building type has its own unique emoji representation
- **Cost Management**: Real-time cost validation with visual feedback
- **Isometric View**: Classic isometric city layout with hover information

### 🎯 **Interactive Gameplay**
- **Resource Management**: Denarii, Population, Food, and Caesar's Favor
- **Terrain System**: Grass, Water, Fertile, Forest, and Rock tiles
- **Road Network**: Connect buildings with road infrastructure
- **Building Placement**: Click-to-place system with cost validation

### 🎉 **Festival System**
- **Roman Gods**: Ceres, Neptune, Mercury, Mars, and Venus
- **Three Festival Types**: Small (145💰), Large (291💰), and Grand (500💰)
- **Cost Validation**: Prevents overspending with proper notifications

### 👨‍💼 **Advisor System**
- **Chief Advisor**: Overview of city statistics
- **Trade Advisor**: Commerce and trade information
- **Military Advisor**: Defense and military guidance

### 🔧 **Game Controls**
- **Pause/Play**: Control game time flow
- **Volume Toggle**: Mute/unmute game audio
- **Settings Dialog**: Game configuration options
- **Help System**: Comprehensive game instructions

### 📢 **Notification System**
- **Real-time Feedback**: Building completion, insufficient funds, festival success
- **Auto-dismiss**: Notifications automatically clear after 5 seconds
- **Visual Indicators**: Emoji-enhanced messages for better UX

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/izokimani/caesar-3.git
   cd caesar-3
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` to start playing!

## 🎯 How to Play

### Basic Controls
- **Select Building**: Choose from the sidebar categories
- **Place Building**: Click on the map to place selected buildings
- **Build Roads**: Select road tool and click to connect buildings
- **Hold Festivals**: Click "Hold Festival" to please the Roman gods
- **Check Advisors**: Use the advisor system for guidance

### Resource Management
- **💰 Denarii**: Your treasury - spend wisely on buildings and festivals
- **👥 Population**: Your citizens - provide services to grow your city
- **🍽️ Food**: Food stores - ensure your population is fed
- **👑 Caesar's Favor**: Your standing with Rome - maintain high favor

### Building Strategy
1. Start with basic housing and roads
2. Add water infrastructure (wells, fountains)
3. Provide health and education services
4. Build entertainment and religious buildings
5. Develop commerce and industry
6. Strengthen government and military

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Components**: Custom UI components with Tailwind CSS
- **Canvas Rendering**: HTML5 Canvas for isometric city view
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Icons**: Lucide React + Custom Emoji Icons

## 🎨 Design Features

- **Roman Theme**: Authentic Caesar III aesthetic with modern enhancements
- **Emoji Integration**: Comprehensive emoji usage throughout the interface
- **Responsive Design**: Works on desktop and tablet devices
- **Smooth Animations**: CSS animations and transitions
- **Accessibility**: Keyboard navigation and screen reader support

## 🐛 Bug Fixes

### Recent Fixes
- ✅ **Notification System**: Fixed race condition in auto-removal logic
- ✅ **Cost Validation**: Added proper feedback for insufficient funds
- ✅ **Button Functionality**: All buttons now work as intended
- ✅ **State Management**: Improved state updates and synchronization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the classic **Caesar III** game by Impressions Games
- Built with modern web technologies for a new generation of city builders
- Enhanced with emoji assets for improved user experience

---

**🏛️ Ave Caesar! Build your empire and make Rome proud! 🏛️** 