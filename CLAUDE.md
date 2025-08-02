# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a chess coaching platform with video calling capabilities, built as a full-stack application:

- **Frontend**: Lit-based web components with TypeScript, using Vite for development and building
- **Backend**: Spring Boot application with Java 17, Maven for dependency management
- **Chess Integration**: Uses chess.js for game logic and chessboard-element for the interactive board
- **Video Calling**: Integrated Jitsi Meet for real-time communication

## Development Commands

### Frontend (located in `frontend/`)
- **Development server**: `npm start` or `npm run dev` (runs Vite dev server)
- **Build**: `npm run build` (creates production build)
- **Type checking**: `npm run typecheck` (TypeScript validation without emitting files)
- **Custom elements analysis**: `npm run analyze` (generates custom-elements.json)

### Backend (located in `backend/`)
- **Run application**: `./mvnw spring-boot:run` (starts Spring Boot on port 8080)
- **Build**: `./mvnw clean compile` or `./mvnw package`
- **Test**: `./mvnw test`

## Architecture

### Frontend Architecture
- **Main App**: `ChessCoachApp.ts` - Root component containing chess board and video call
- **Components**: 
  - `video-call.ts` - Jitsi Meet integration for video calling
  - Uses `chessboard-element` for interactive chess board with drag-and-drop
- **Chess Logic**: Uses chess.js library for move validation and game state management
- **Styling**: CSS-in-JS with Lit, no shadow DOM (uses `createRenderRoot()` override)

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
- **Lit Elements**: Lightweight, no licensing costs
- **chess.js**: Free, proven chess logic library
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

- Frontend uses ES modules and follows open-wc recommendations
- Backend is set up for WebSocket integration but controllers are not yet implemented
- Chess moves are validated client-side before allowing piece placement
- The application supports promotion (defaults to queen) and standard chess rules
- Total estimated monthly cost: $0-6 for first 100 users