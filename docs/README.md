# Chess Coach Platform - Documentation Index

## Overview

This directory contains technical documentation, implementation guides, and architecture decisions for the Chess Coach Platform.

---

## Feature Documentation

### ✅ Completed Features

**Game Clock System**
- Server-authoritative time control
- TIMED and TRAINING game modes
- Smooth client-side countdown
- Urgency indicators and timeout detection
- Status: Shipped in feature/Clock branch
- Code: `backend/.../ClockService.java`, `frontend/.../GameClock.tsx`

**Modal-Based Game Creation**
- NewGameModal with progressive disclosure
- JoinGameModal for room codes
- TimeControlSelector with presets
- Status: Shipped in feature/Clock branch
- Code: `frontend/src/components/NewGameModal.tsx`

**Side Panel Layout**
- Clocks positioned beside board
- Responsive breakpoints (desktop/tablet/mobile)
- Video panel alignment
- Status: Shipped in feature/Clock branch
- Code: `frontend/src/styles/shared.module.css`

**Move Panel System**
- Professional move history display with paired notation
- Training mode navigation (back/forward/start/end)
- PGN export with proper formatting
- Keyboard shortcuts (←/→/Home/End)
- Review mode with live position preservation
- Status: Shipped 2025-01-09
- Code: `frontend/src/components/MovePanel.tsx`, `frontend/src/hooks/usePairedMoves.ts`, `frontend/src/hooks/useScrollToBottom.ts`
- Documentation: [features/move-panel.md](./features/move-panel.md)

---

### 🚧 Planned Features

---

## Architecture Documents

### System Design
- **Frontend:** React + TypeScript + Vite
- **Backend:** Spring Boot + WebSocket (STOMP)
- **Chess Engine:** chess.js for validation
- **Video:** Jitsi Meet integration
- **Database:** H2 (dev) / PostgreSQL (prod)

### Key Design Decisions

**Why Clock is Separate from Move Panel:**
- Different lifecycles (clock runs live, moves for analysis)
- Mode-specific needs (training needs navigation more than clock)
- Independent testing and debugging
- But integrated visually in side panel

**Why No Backend for Move Panel:**
- Move history already tracked and synchronized
- Navigation is client-side position reconstruction
- PGN generation uses chess.js built-in
- Reduces server load and complexity

---

## Project Structure

```
chess-coach-platform/
├── backend/
│   ├── src/main/java/com/chesscoach/
│   │   ├── controller/    # REST + WebSocket endpoints
│   │   ├── service/       # Business logic (GameService, ClockService)
│   │   ├── entity/        # JPA entities (Game, User, GameMode)
│   │   └── dto/           # Data transfer objects (ClockState)
│   └── src/test/java/     # JUnit tests
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks (useGameState, useGameClock)
│   │   ├── services/      # API clients
│   │   ├── types/         # TypeScript interfaces
│   │   └── styles/        # CSS modules
│   ├── tests/            # Vitest unit tests
│   └── vitest.config.ts  # Test configuration
└── docs/                 # THIS DIRECTORY
    ├── README.md                                # This file
    ├── features/
    │   └── move-panel.md                        # Move Panel architecture & decisions
    ├── MOVE_PANEL_IMPLEMENTATION_ARCHIVE.md     # Original planning docs (archived)
    └── MOVE_PANEL_QUICK_START_ARCHIVE.md        # Original quick start (archived)
```

---

## Development Workflow

### Starting Development

1. **Backend:**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
   Server runs on http://localhost:8080

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Vite dev server on http://localhost:5173

3. **Testing:**
   ```bash
   # Frontend tests
   npm test

   # Backend tests
   cd backend
   ./mvnw test
   ```

### Feature Development Process

1. ✅ Research industry standards
2. ✅ Create documentation (like this!)
3. ✅ Design component architecture
4. ✅ Implement in phases
5. ✅ Write tests (unit + integration)
6. ✅ Code review
7. ✅ Merge to main

---

## Testing Strategy

### Frontend
- **Unit Tests:** Vitest + @testing-library/react
- **Component Tests:** Render + user interaction
- **Hook Tests:** renderHook from testing-library
- **Coverage:** Aim for >80% on critical paths

### Backend
- **Unit Tests:** JUnit 5
- **Integration Tests:** @SpringBootTest
- **WebSocket Tests:** STOMP test client
- **Coverage:** >80% on service layer

---

## Performance Considerations

### Current Optimizations
- ✅ Server-authoritative clock (no client drift)
- ✅ Debounced WebSocket reconnection
- ✅ Memoized hook dependencies
- ✅ CSS variables for theme (no JS repaints)
- ✅ Visibility-aware polling

### Future Optimizations (Move Panel)
- 📋 Virtualized move list for 100+ move games
- 📋 Memoized position reconstruction
- 📋 Debounced auto-scroll
- 📋 Lazy PGN generation

---

## Accessibility Standards

All components follow WCAG 2.1 Level AA:

- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation support
- ✅ Focus indicators visible
- ✅ Color contrast ratios >4.5:1
- ✅ Screen reader announcements
- ✅ No keyboard traps

---

## Deployment

### Current Setup
- **Frontend:** Netlify/Vercel (static hosting)
- **Backend:** Railway/Render (containerized)
- **Database:** PostgreSQL on Railway
- **WebSocket:** Supported by all platforms

### Environment Variables
```bash
# Frontend (.env)
VITE_API_URL=https://api.chesscoach.com
VITE_WS_URL=wss://api.chesscoach.com/ws

# Backend (application.properties)
spring.datasource.url=${DATABASE_URL}
server.port=${PORT:8080}
```

---

## Contributing

### Before Starting a Feature

1. Read relevant documentation in this directory
2. Check if backend changes are needed
3. Identify dependencies on existing features
4. Estimate effort (small: <4h, medium: 4-8h, large: >8h)
5. Create feature branch from main

### During Development

1. Write tests alongside code (TDD encouraged)
2. Follow existing code style (TypeScript strict mode)
3. Update documentation if architecture changes
4. Commit frequently with clear messages

### Before Merging

1. All tests passing (frontend + backend)
2. No TypeScript errors
3. Code reviewed by at least one person
4. Documentation updated
5. Migration path considered

---

## Resources

### External Documentation
- **chess.js:** https://github.com/jhlywa/chess.js
- **react-chessboard:** https://github.com/Clariity/react-chessboard
- **Jitsi Meet:** https://jitsi.github.io/handbook/
- **Spring WebSocket:** https://docs.spring.io/spring-framework/reference/web/websocket.html

### Industry References
- **Lichess:** https://lichess.org (open source!)
- **Chess.com:** https://www.chess.com
- **PGN Specification:** http://www.saremba.de/chessgml/standards/pgn/

---

## Roadmap

### Immediate Next (Q1 2025)
- [x] Game Clock System
- [x] Modal-based UX improvements
- [x] Side panel layout
- [x] **Move Panel** ✅ (shipped 2025-01-09)

### Short Term (Q2 2025)
- [ ] PGN import/export
- [ ] Basic AI opponents (Stockfish)
- [ ] Game database/history
- [ ] Opening book integration

### Medium Term (Q3-Q4 2025)
- [ ] Engine analysis
- [ ] Study mode with annotations
- [ ] Repertoire builder
- [ ] Puzzle system

### Long Term (2026+)
- [ ] Screenshot position recognition
- [ ] Advanced AI personalities
- [ ] Video analysis tools
- [ ] Social features (challenges, tournaments)

---

## FAQ

**Q: Why is the move panel a separate feature from the clock?**
A: Different lifecycles and concerns. Clock is for live play, move panel is for analysis. Keeping them separate makes testing and maintenance easier.

**Q: Do I need to modify the backend for the move panel?**
A: No! Move history is already tracked. All navigation is client-side using chess.js.

**Q: Where can I learn about the move panel architecture?**
A: See [features/move-panel.md](./features/move-panel.md) for architectural decisions, testing checklist, and implementation details.

**Q: Can users cheat by using the move panel in live games?**
A: No. Navigation is disabled in TIMED mode. Only TRAINING mode allows back/forward.

**Q: What about mobile users?**
A: Fully responsive. Move panel collapses to stacked layout on small screens.

---

## Contact & Support

- **Issues:** https://github.com/Malkasir/chess-coach-platform/issues
- **Discussions:** GitHub Discussions
- **Documentation:** This directory

---

**Last Updated:** 2025-01-09
**Status:** Active Development
**Current Version:** MVP + Clock + Move Panel
**Next Feature:** PGN Import / AI Opponents
