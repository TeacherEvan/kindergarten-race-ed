# Copilot Instructions for Kindergarten Race Educational Game

## Project Overview

This repository contains an educational racing game designed for kindergarten students (ages 5-6). The game features split-screen multiplayer gameplay where two players compete by identifying falling objects to advance their turtle characters through various educational categories.

### Core Game Concept
- **Split-Screen Racing**: Two players compete simultaneously on one device
- **Educational Categories**: Progressive difficulty from Fruits → Numbers → Alphabet sequencing
- **Touch-Based Interaction**: Optimized for touchscreen devices with large tap targets
- **Visual Learning**: Pattern recognition and category identification through gameplay

## Technical Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 4 with Radix UI Colors
- **UI Components**: Radix UI primitives with custom components
- **State Management**: React hooks with custom game logic
- **Animation**: Framer Motion for smooth game animations
- **Development**: ESLint for code quality, npm for package management

## Architecture & Patterns

### Component Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, cards, etc.)
│   ├── PlayerArea.tsx  # Game area for each player
│   ├── FallingObject.tsx # Animated falling game objects
│   └── TargetDisplay.tsx # Shows current target to identify
├── hooks/              # Custom React hooks for game logic
│   ├── use-game-logic.ts # Core game state and mechanics
│   └── use-display-adjustment.ts # Responsive design logic
├── lib/                # Utility functions
└── styles/             # Global styles and theme
```

### Key Design Principles
1. **Child-Friendly Design**: Large touch targets (minimum 60px), bright colors, rounded corners
2. **Performance-First**: 60fps gameplay with smooth animations
3. **Accessibility**: High contrast ratios, clear visual feedback
4. **Responsive**: Adapts to different screen sizes while maintaining usability
5. **Educational Focus**: Learning disguised as engaging gameplay

## Coding Standards

### TypeScript Guidelines
- Use strict TypeScript settings with proper type definitions
- Prefer type annotations over `any`
- Use interfaces for component props and complex objects
- Leverage discriminated unions for game state management

### React Best Practices
- Use functional components with hooks exclusively
- Implement proper cleanup in useEffect hooks
- Optimize performance with useMemo/useCallback where appropriate
- Use `memo()` with custom comparison functions for frequently re-rendering components
- Prefer `onTouchStart` over `onClick` for primary touch interactions
- Implement proper event prevention (`preventDefault()`, `stopPropagation()`)
- Maintain single responsibility principle for components

### Styling Conventions
- Use Tailwind CSS utility classes following BEM-like naming
- Responsive design with mobile-first approach
- Consistent spacing using 8px/16px grid system
- Color scheme follows triadic color theory for high engagement

### Game Logic Guidelines
- Separate game logic from UI components using custom hooks
- Implement smooth 60fps animations for all moving elements
- Handle edge cases: touch conflicts, performance degradation, incorrect inputs
- Maintain game state consistency across player actions

## AI Assistance Guidelines

### When Helping with Code
1. **Prioritize Child Safety**: Ensure all interactions are appropriate for 5-6 year olds
2. **Performance Awareness**: Always consider 60fps gameplay requirements
3. **Touch Optimization**: Design for large finger touches, not precise mouse clicks
4. **Educational Value**: Maintain the learning objectives in any game modifications
5. **Accessibility**: Ensure changes support diverse learning needs

### Component Development
- Follow existing component patterns in `src/components/ui/`
- Use Radix UI primitives as base components when possible
- Implement proper TypeScript props interfaces with clear prop names
- Include proper touch event handling for game interactions (`onTouchStart` primary, `onClick` fallback)
- Use `memo()` for performance-critical components with custom comparison functions
- Implement `useMemo()` for expensive style calculations
- Follow the naming convention: PascalCase for components, camelCase for props

### Game Logic Changes
- Test thoroughly with multiple rapid touches (simulating excited children)
- Ensure state updates don't create race conditions
- Maintain smooth animation performance during intensive gameplay
- Consider edge cases like rapid level progression or simultaneous wins

### Styling Updates
- Maintain high contrast ratios for accessibility (minimum 4.5:1)
- Use the established color palette from the triadic scheme
- Ensure all interactive elements meet minimum 60px touch target size
- Test responsive behavior across tablet and desktop sizes

## Testing Approach

### Manual Testing Focus
- Multi-touch gameplay simulation
- Performance under rapid user interaction
- Visual feedback clarity for correct/incorrect actions
- Responsive behavior across different screen sizes

### Key Testing Scenarios
1. **Rapid Touch Input**: Multiple touches on different objects simultaneously
2. **Performance Testing**: Frame rate during intensive object generation
3. **Educational Accuracy**: Correct object identification and progression
4. **Cross-Device Compatibility**: Touch vs. mouse input handling

## Build & Development

### Development Commands
```bash
npm install          # Install dependencies
npm run dev          # Start development server (port 5173)
npm run build        # Production build with TypeScript compilation
npm run lint         # Code quality check (note: ESLint v9 migration pending)
npm run preview      # Preview production build
```

### Known Issues & Workarounds
- **ESLint Configuration**: Currently using legacy .eslintrc files, migration to eslint.config.js pending
- **Build Warnings**: CSS base64 encoding warnings in Vite build are non-critical
- **Touch Events**: Test on actual touch devices when possible for accurate user experience

### Key Development Notes
- The game locks to landscape orientation for optimal split-screen experience
- Fall speed and object generation adapt to screen size and performance
- Debug tools are available but hidden in production builds
- Performance monitoring is built-in for gameplay optimization
- CSS warnings during build are non-critical and don't affect functionality

## Educational Context

### Learning Objectives
- **Pattern Recognition**: Identifying objects within categories
- **Visual Processing**: Quick object identification and categorization
- **Sequential Learning**: Alphabet ordering and number recognition
- **Competitive Collaboration**: Healthy competition while learning together

### Age-Appropriate Design
- Simple, clear visual design without overwhelming details
- Immediate positive feedback for correct actions
- Gentle handling of incorrect inputs (no harsh penalties)
- Progressive difficulty that builds confidence

## Common Modification Patterns

### Adding New Educational Categories
1. Define category in `GAME_CATEGORIES` array
2. Create appropriate object generation logic
3. Add category-specific styling and emojis
4. Test difficulty progression and accessibility

### Performance Optimizations
1. Monitor frame rate during object generation
2. Implement object pooling for memory efficiency
3. Optimize animation performance with transform3d
4. Consider reducing visual complexity on lower-end devices

### UI Component Extensions
1. Follow Radix UI patterns for accessibility
2. Implement proper touch event handling
3. Maintain consistent visual hierarchy
4. Test with real kindergarten user interactions

Remember: This game serves real kindergarten students learning fundamental concepts. Every change should enhance their educational experience while maintaining the joy and engagement that makes learning effective.