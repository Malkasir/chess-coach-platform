# Arabic Translation Implementation Plan

## Document Version
**Last Updated:** 2025-11-12
**Status:** Phase 1 - In Progress
**Branch:** `feature/arabic-translation`

---

## Overview

This document outlines the complete plan for adding Arabic language support to the Chess Coach Platform. Our target customers are primarily Arabic-speaking users, making this a critical feature for platform adoption.

### Goals
- Full Arabic translation of all user-facing text
- Proper RTL (Right-to-Left) layout support
- Preserve standard chess notation (algebraic notation, coordinates)
- Maintain cost-effectiveness (machine translation + native speaker review)
- Support user language preference persistence

---

## Technical Decisions

### Frontend
- **Library:** `react-i18next` (chosen for React integration and namespace lazy-loading)
- **Locale Detection:** Browser language detection with localStorage persistence
- **Font Support:** Cairo, Noto Kufi Arabic, Tahoma with fallbacks
- **CSS Approach:** Logical properties (margin-inline-start vs margin-left)

### Backend
- **Locale Resolution:** `AcceptHeaderLocaleResolver` (reads `Accept-Language` header)
- **Message Bundles:** `messages.properties` (English) + `messages_ar.properties` (Arabic)
- **User Preference:** `preferredLocale` column in User entity
- **API Response:** Localized `userMessage` field in error responses

### Translation Approach
- **Method:** Machine translation (Google Translate / DeepL) + native Arabic speaker review
- **Cost:** $0 for tools + reviewer time
- **Quality:** MVP quality, iteratively improved based on user feedback

### Chess-Specific Rules

**NEVER TRANSLATE:**
- Algebraic notation (e4, Nf3, Qxd5, O-O)
- Board coordinates (a-h, 1-8)
- PGN format or chess engine output
- File names like `personalities.ts` (these are code)

**ALWAYS LTR (even in RTL mode):**
- Chess notation in move lists
- Chess board coordinates
- Move numbers and chess clocks
- PGN export content

**TRANSLATION STRATEGY:**
- Wrap chess notation in `<span dir="ltr">` automatically
- Keep chess-related numbers in Western numerals (0-9)
- Use `Intl.NumberFormat` for general UI numbers (user counts, dates)

---

## Implementation Roadmap

### Phase 1: Core UI Translation (Week 1-3)
**Priority:** Highest user-facing impact

#### Week 1: Infrastructure Setup
- [x] Create documentation
- [ ] Install `react-i18next` and `i18next`
- [ ] Configure i18n (`frontend/src/i18n/config.ts`)
- [ ] Set up namespaces: `common`, `auth`, `lobby`, `game`, `notifications`
- [ ] Add Arabic fonts to `frontend/index.html`
- [ ] Update CSS variables for Arabic font stacks
- [ ] Create translation key audit spreadsheet
- [ ] Set up backend `MessageSource` configuration
- [ ] Add `preferredLocale` column to User entity

#### Week 2-3: Authentication & Navigation
- [ ] Extract strings from `AuthenticationForm.tsx`
- [ ] Extract strings from `AppHeader.tsx`
- [ ] Create `auth.json` and `common.json` translation files
- [ ] Machine translate extracted strings
- [ ] Implement language selector in AppHeader
- [ ] Update `api-client.ts` error messages
- [ ] Test authentication flow in both languages
- [ ] Native speaker review of auth translations

**Deliverables:**
- Users can switch between English and Arabic
- Login/registration fully translated
- Error messages localized
- Language preference persisted

---

### Phase 2: Game Experience (Week 4-5)
**Priority:** Core gameplay features

#### Components to Translate
- `GameLobby.tsx` - Game creation interface
- `ActiveGame.tsx` - In-game UI
- `OnlinePlayersList.tsx` - Player discovery
- `GameInvitationModal.tsx` - Invitation system
- `NotificationBanner.tsx` - Real-time notifications
- `Toast.tsx` - Success/error toasts
- `MovePanel.tsx` - Move history (mixed LTR/RTL)

#### Technical Work
- [ ] Migrate CSS to logical properties in `shared.module.css`
- [ ] Implement RTL layout toggle (`document.documentElement.dir = "rtl"`)
- [ ] Create LTR wrapper for chess board and move list
- [ ] Test `react-chessboard` in RTL context
- [ ] Handle mixed content in MovePanel (Arabic text + LTR notation)
- [ ] Update WebSocket connection status messages

**Deliverables:**
- Complete game lobby in Arabic
- In-game status messages translated
- Toast notifications localized
- RTL layout working correctly
- Chess notation remains LTR within RTL UI

---

### Phase 3: Content & Polish (Week 6)
**Priority:** Enhanced experience

#### Content Translation
- [ ] AI personality names and descriptions (`personalities.ts`)
- [ ] AI personality quotes
- [ ] Help text and tooltips
- [ ] Onboarding messages
- [ ] Settings and preferences UI

#### Backend Completion
- [ ] Complete backend message resources
- [ ] Localize all controller error messages
- [ ] Add `@RestControllerAdvice` for global error translation
- [ ] Update all DTOs to include localized messages

#### Testing & QA
- [ ] Unit tests for translation hooks
- [ ] E2E tests for language switching
- [ ] Manual testing with native Arabic speaker
- [ ] Test all error scenarios in both languages
- [ ] Verify RTL layout on mobile devices
- [ ] Performance testing (lazy-loading of translation files)

**Deliverables:**
- Complete Arabic translation coverage
- All error messages localized
- Native speaker approval
- Full test coverage

---

## File Structure

### Frontend
```
frontend/
├── src/
│   ├── i18n/
│   │   ├── config.ts              # i18next configuration
│   │   ├── locales/
│   │   │   ├── en/
│   │   │   │   ├── common.json    # Shared UI strings
│   │   │   │   ├── auth.json      # Authentication
│   │   │   │   ├── lobby.json     # Game lobby
│   │   │   │   ├── game.json      # Active game
│   │   │   │   └── notifications.json
│   │   │   └── ar/
│   │   │       ├── common.json
│   │   │       ├── auth.json
│   │   │       ├── lobby.json
│   │   │       ├── game.json
│   │   │       └── notifications.json
│   ├── components/
│   │   └── LanguageSelector.tsx  # Language switcher component
│   └── utils/
│       └── chess-notation.tsx    # Helpers for LTR chess notation
```

### Backend
```
backend/
├── src/main/resources/
│   ├── messages.properties        # English strings
│   ├── messages_ar.properties     # Arabic strings
│   └── application.yml            # spring.messages.basename config
```

---

## Translation Key Naming Convention

Use hierarchical dot-notation with clear context:

```json
{
  "auth.login.title": "Login",
  "auth.login.email_placeholder": "Email",
  "auth.login.password_placeholder": "Password",
  "auth.login.submit_button": "Login",
  "auth.error.invalid_credentials": "Invalid email or password",
  "auth.error.email_exists": "Email already registered",

  "game.status.waiting": "Waiting for opponent...",
  "game.status.your_turn": "Your turn",
  "game.status.opponent_turn": "Opponent's turn",
  "game.status.checkmate": "Checkmate!",
  "game.status.draw": "Draw",

  "common.button.cancel": "Cancel",
  "common.button.confirm": "Confirm",
  "common.button.close": "Close"
}
```

---

## API Changes

### User Entity
```java
@Column(name = "preferred_locale", length = 10)
private String preferredLocale = "en";  // Default to English

// Getter and setter
public String getPreferredLocale() { return preferredLocale; }
public void setPreferredLocale(String locale) { this.preferredLocale = locale; }
```

### Update User Endpoints

**PATCH `/api/auth/profile`**
```json
{
  "preferredLocale": "ar"
}
```

**Response includes locale:**
```json
{
  "userId": 1,
  "email": "user@example.com",
  "firstName": "محمد",
  "lastName": "أحمد",
  "preferredLocale": "ar"
}
```

### Error Response Format
```json
{
  "status": 400,
  "message": "Validation failed",  // Technical message (English, for logs)
  "userMessage": "يرجى التحقق من البيانات المدخلة",  // User-facing (localized)
  "timestamp": "2025-11-12T10:30:00Z"
}
```

---

## CSS Migration Strategy

### Before (LTR-specific)
```css
.button {
  margin-right: 1rem;
  padding-left: 2rem;
  text-align: left;
}
```

### After (Logical properties)
```css
.button {
  margin-inline-end: 1rem;
  padding-inline-start: 2rem;
  text-align: start;
}
```

### RTL Override Example
```css
/* Force LTR for chess notation */
.chessNotation {
  direction: ltr;
  text-align: left; /* Explicitly left for chess */
}
```

---

## Testing Checklist

### Unit Tests
- [ ] Translation hook renders correct strings
- [ ] Language switching updates all components
- [ ] Missing translation keys show fallback
- [ ] Namespace lazy-loading works

### Integration Tests
- [ ] Language preference persists in localStorage
- [ ] API sends correct `Accept-Language` header
- [ ] Backend returns localized error messages
- [ ] User locale saved to database

### E2E Tests (Cypress/Playwright)
- [ ] Switch to Arabic, verify dir="rtl" on html element
- [ ] Login in Arabic, check error messages
- [ ] Create game in Arabic, verify lobby UI
- [ ] Play moves, verify move list stays LTR
- [ ] Check notifications appear in correct language

### Manual Testing
- [ ] Visual inspection of RTL layout
- [ ] Chess board interactions work in RTL
- [ ] Arabic text renders with correct fonts
- [ ] No layout breaking with long Arabic strings
- [ ] Mobile responsive design in both languages
- [ ] Toast notifications stack correctly in RTL

### Native Speaker Review
- [ ] Translation accuracy
- [ ] Cultural appropriateness
- [ ] Grammatical correctness
- [ ] Tone consistency (formal vs informal)
- [ ] Chess terminology correctness

---

## Common Pitfalls & Solutions

### Problem: React component not re-rendering on language change
**Solution:** Use `useTranslation()` hook, not direct `i18next.t()`

### Problem: Chess notation gets flipped in RTL
**Solution:** Wrap in `<span dir="ltr" className={styles.chessNotation}>`

### Problem: CSS margins wrong in RTL
**Solution:** Use logical properties (`margin-inline-start` vs `margin-left`)

### Problem: Numbers showing as Arabic-Indic numerals (٠١٢٣)
**Solution:** Use `<span dir="ltr">{number}</span>` for chess numbers

### Problem: Backend returns English error despite `Accept-Language: ar`
**Solution:** Check `LocaleResolver` bean and `MessageSource` configuration

### Problem: Translation file not loading
**Solution:** Verify namespace name matches file name, check `i18n/config.ts`

---

## Resources

### Documentation
- [react-i18next docs](https://react.i18next.com/)
- [i18next docs](https://www.i18next.com/)
- [CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)
- [Spring MessageSource](https://docs.spring.io/spring-framework/reference/core/beans/context-introduction.html#context-functionality-messagesource)

### Translation Tools
- [Google Translate](https://translate.google.com/)
- [DeepL Translator](https://www.deepl.com/translator) (higher quality)
- [ChatGPT/Claude](https://chat.openai.com) for context-aware translations

### Arabic Fonts (Free)
- [Cairo](https://fonts.google.com/specimen/Cairo) - Modern, clean
- [Noto Kufi Arabic](https://fonts.google.com/noto/specimen/Noto+Kufi+Arabic) - Readable
- [Tajawal](https://fonts.google.com/specimen/Tajawal) - Alternative

### Testing
- [Arabic Lorem Ipsum](http://www.arabic-lorem.com/) - Test long text
- [RTL Testing Checklist](https://rtlstyling.com/posts/rtl-styling)

---

## Progress Tracking

### Completed ✅
- [x] Technical analysis and planning
- [x] Roadmap finalization
- [x] Documentation creation

### In Progress 🚧
- [ ] Phase 1: Week 1 - Infrastructure Setup

### Not Started ⏳
- [ ] Phase 1: Week 2-3 - Authentication & Navigation
- [ ] Phase 2: Game Experience
- [ ] Phase 3: Content & Polish

---

## How to Resume Work

### Starting Fresh
1. Read this document fully
2. Review the current branch: `feature/arabic-translation`
3. Check the todo list in Claude Code session
4. Review `package.json` to see what's installed
5. Check `frontend/src/i18n/` for configuration progress

### If Continuing Mid-Phase
1. Check git status to see modified files
2. Run `npm install` if new dependencies added
3. Test current progress: `npm start`
4. Review recent commits for context
5. Continue with next incomplete task in todo list

### Testing Current Progress
```bash
# Frontend
cd frontend
npm install  # If dependencies changed
npm start    # Test current state

# Backend
cd backend
./mvnw spring-boot:run  # Verify backend still works
```

### Quick Status Check
```bash
# Check if i18next is installed
grep "i18next" frontend/package.json

# Check if translation files exist
ls -la frontend/src/i18n/locales/

# Check for User entity changes
git diff backend/src/main/java/com/chesscoach/entity/User.java
```

---

## Contact & Support

### Questions During Implementation
- Check this document first
- Review the original analysis in project history
- Consult react-i18next documentation
- Test with small examples before full implementation

### Translation Review
- Schedule review sessions with native Arabic speaker
- Provide context for each string (where it appears in UI)
- Document any translation changes with rationale
- Maintain translation glossary for consistency

---

## Success Metrics

### Phase 1 Complete When:
- ✅ Users can switch language via UI selector
- ✅ Authentication flow fully in Arabic
- ✅ Error messages show in selected language
- ✅ Language preference persists across sessions
- ✅ Native speaker approves auth translations

### Phase 2 Complete When:
- ✅ All game lobby features translated
- ✅ In-game UI fully localized
- ✅ RTL layout works correctly
- ✅ Chess notation stays LTR
- ✅ No visual layout breaks

### Phase 3 Complete When:
- ✅ All UI text translated (100% coverage)
- ✅ Backend error messages localized
- ✅ Tests pass in both languages
- ✅ Native speaker final approval
- ✅ Ready for production deployment

---

## Notes for Future Maintenance

### Adding New Features
1. Always add translation keys for new UI text
2. Update both `en/` and `ar/` locale files
3. Test feature in both languages
4. Get Arabic translation reviewed

### Translation Updates
1. Never change keys (breaks existing translations)
2. Add new keys for new variations
3. Deprecate old keys gracefully
4. Document translation changes in git commits

### Performance Considerations
- Lazy-load translation namespaces
- Cache translations in browser localStorage
- Monitor bundle size impact
- Consider CDN for translation files if bundle grows large

---

**End of Document**
