# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a chess coaching platform with video calling capabilities, built as a full-stack application:

- **Frontend**: React-based application with TypeScript, using Vite for development and building
- **Backend**: Spring Boot application with Java 17, Maven for dependency management
- **Chess Integration**: Uses chess.js for game logic and react-chessboard for the interactive board
- **Video Calling**: Integrated Jitsi Meet for real-time communication
- **Feature Analysis**: Comprehensive analysis documents in `/analysis/` directory for planning and implementation guidance

## Development Commands

### Frontend (located in `frontend/`)
- **Development server**: `npm start` or `npm run dev` (runs Vite dev server)
- **Build**: `npm run build` (creates production build)
- **Type checking**: `npm run typecheck` (TypeScript validation without emitting files)
- **Custom elements analysis**: `npm run analyze` (generates custom-elements.json)

### Environment Setup
- Copy `.env.example` to `.env` and configure:
  - `VITE_API_BASE_URL`: Backend API URL (defaults to http://localhost:8080)
  - `VITE_DEBUG`: Enable/disable debug logging (true for development)

### Backend (located in `backend/`)
- **Run application**: `./mvnw spring-boot:run` (starts Spring Boot on port 8080)
- **Build**: `./mvnw clean compile` or `./mvnw package`
- **Test**: `./mvnw test`

## Architecture

### Frontend Architecture
- **Main App**: `ChessCoachApp.tsx` - Root React component managing game state and authentication
- **Components**: 
  - `VideoCall.tsx` - Jitsi Meet integration for video calling
  - `ChessBoard.tsx` - Interactive chess board using react-chessboard with drag-and-drop
  - `GameLobby.tsx` - Game creation and joining interface
  - `OnlinePlayersList.tsx` - Player discovery and invitation system
  - `GameInvitationModal.tsx` - Modal for sending game invitations
  - `NotificationBanner.tsx` - Real-time invitation notifications
  - `PageHeader.tsx` - Consistent navigation header
  - `Toast.tsx` - Centralized error and success notifications
- **Chess Logic**: Uses chess.js library for move validation and game state management
- **Styling**: CSS Modules with comprehensive design system and CSS variables
- **State Management**: React hooks (useState, useEffect, useCallback) with custom hooks
- **API Integration**: Centralized API client with environment-based URLs and error handling

### Backend Architecture
- **Main Class**: `BackendApplication.java` - Spring Boot entry point with basic REST controller
- **Planned Features**: WebSocket support for real-time chess moves (dependencies included)
- **Chess Engine**: Uses chesslib (com.github.bhlangonijr) for server-side chess logic

### Key Integration Points
- Frontend chess board handles drag-and-drop with real-time validation via chess.js
- Video calling runs in parallel to chess gameplay
- Turn-based move system with legal move validation
- Board state synchronization between chess.js engine and visual board

## Project Goals & Requirements

### Target Features
1. **Video Communication**: Coach-student video calls during chess sessions
2. **Interactive Chess Board**: Real-time collaborative chess gameplay
3. **Chess Puzzle System**: Ability to set and solve chess puzzles
4. **Screenshot Analysis**: Read chess positions from screenshots (future feature)

### Scale & Cost Constraints
- **Expected Users**: <100 users in first year
- **Budget**: Minimal/no revenue expected initially
- **Cost Strategy**: Prioritize open-source solutions, pay only for high-value services

## Technology Decisions & Cost Optimization

### Current Stack Rationale
- **React + TypeScript**: Modern, well-supported frontend framework with excellent tooling
- **chess.js**: Free, proven chess logic library
- **react-chessboard**: React wrapper for interactive chess board with drag-and-drop
- **Jitsi Meet**: Free video calling up to needed scale
- **Spring Boot**: Free, robust backend framework

### Planned Additions (Cost-Optimized)
- **Database**: Start with H2/SQLite (free), migrate to PostgreSQL on Railway/Supabase (~$5/month) when needed
- **Chess Puzzle Screenshots**: 
  - Phase 1: Manual puzzle entry (free)
  - Phase 2: Tesseract.js OCR (free, client-side)
  - Phase 3: AI vision APIs when revenue justifies cost
- **Hosting**: 
  - Frontend: Netlify/Vercel free tier
  - Backend: Railway/Render free tier → ~$5/month at scale
  - Alternative: Single DigitalOcean VPS ($6/month)

### Development Approach
1. **MVP**: Current stack + basic database integration
2. **Iterative**: Add features based on user feedback and revenue
3. **Cost-Conscious**: Prefer free/open-source solutions until business case proven

## Important Notes

- Frontend follows modern React patterns with hooks and TypeScript
- Components implement accessibility features (ARIA labels, keyboard navigation, focus management)
- API calls are centralized with proper error handling and user-friendly messages
- Debug logging is environment-gated for production performance
- Modal components include proper focus trapping and escape key handling
- Responsive design supports mobile and desktop experiences
- CSS variables enable easy theming (light mode ready)
- Backend is set up for WebSocket integration but controllers are not yet implemented
- Chess moves are validated client-side before allowing piece placement
- The application supports promotion (defaults to queen) and standard chess rules
- Total estimated monthly cost: $0-6 for first 100 users

## Recent Improvements

### UX & Design System
- **Design System**: Comprehensive CSS variables for consistent theming
- **Typography**: Defined typography scale with consistent font weights and sizes
- **Button System**: Enhanced buttons with disabled, loading, and hover states
- **Responsive Layout**: Mobile-first design with flexible game area layout
- **Toast System**: Centralized error/success notifications with auto-dismiss
- **Accessibility**: Focus management, ARIA labels, keyboard navigation throughout

### Performance & Developer Experience
- **Smart Polling**: Visibility-aware invitation polling reduces battery usage
- **Error Handling**: User-friendly error messages based on HTTP status codes
- **Debug System**: Environment-based logging (production vs development)
- **API Client**: Centralized fetch wrapper with consistent error handling
- **Component Library**: Reusable components (PageHeader, Toast, etc.)
- **Input Validation**: Enhanced form inputs with error states and focus indicators

## Feature Analysis System

The project includes a comprehensive feature analysis system located in the `/analysis/` directory:

### Structure
- **`/analysis/README.md`**: Overview and guidelines for the analysis system
- **`/analysis/templates/`**: Standardized templates for feature analysis
- **`/analysis/features/`**: Individual feature analysis documents

### Current Analyses
- **Chess Clock System** (`chess-clock.md`): Complete analysis for implementing time controls, blitz games, and competitive chess features

### Usage
When planning new features:
1. Copy the template from `/analysis/templates/feature-template.md`
2. Create a new analysis in `/analysis/features/[feature-name].md`
3. Complete all sections before beginning implementation
4. Update analysis as requirements evolve

This ensures thorough planning, risk assessment, and implementation roadmaps for all major features.