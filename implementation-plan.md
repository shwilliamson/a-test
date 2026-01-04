# Implementation Plan

Generated: 2026-01-04
Based on: 30 open issues across 7 milestones

## Summary

| Milestone | Issues | Status |
|-----------|--------|--------|
| 1. Project Setup | 4 | 0 complete / 4 total |
| 2. Authentication | 5 | 0 complete / 5 total |
| 3. List Management | 5 | 0 complete / 5 total |
| 4. Task Management | 7 | 0 complete / 7 total |
| 5. Account Management | 1 | 0 complete / 1 total |
| 6. Polish & Deploy | 4 | 0 complete / 4 total |
| Future Enhancements | 8 | Deferred (not in MVP) |

## Work Sequence

### Phase 1: Project Setup

#### 1. Issue #1: Setup: Initialize monorepo structure
- **Why first**: No dependencies - this is the foundation
- **Unblocks**: #2, #3
- **Complexity**: Low
- **Key work**: npm workspaces, shared tsconfig, ESLint/Prettier, gitignore

#### 2. Issue #2: Setup: Initialize frontend with React + Vite + TypeScript
- **Why now**: Depends on #1
- **Unblocks**: #4
- **Complexity**: Low
- **Key work**: Vite React template, Tailwind CSS, shadcn/ui initialization

#### 3. Issue #3: Setup: Initialize backend with Express + TypeScript
- **Why now**: Depends on #1 (can run parallel with #2)
- **Unblocks**: #4
- **Complexity**: Low
- **Key work**: Express server, TypeScript, /health endpoint, CORS

#### 4. Issue #4: Setup: Docker Compose with Firestore emulator
- **Why now**: Depends on #2 and #3
- **Unblocks**: #5 (authentication milestone)
- **Complexity**: Medium
- **Key work**: docker-compose.yml, Firestore emulator, hot reload for both services

---

### Phase 2: Authentication

#### 5. Issue #5: Feature: User registration endpoint and UI
- **Why now**: Depends on #4 (Firestore emulator needed)
- **Unblocks**: #6
- **Complexity**: Medium
- **Key work**: POST /api/auth/register, bcrypt hashing, registration form UI, validation

#### 6. Issue #6: Feature: User login endpoint and UI
- **Why now**: Depends on #5 (users must exist to log in)
- **Unblocks**: #7
- **Complexity**: Medium
- **Key work**: POST /api/auth/login, credential validation, login form UI, rate limiting

#### 7. Issue #7: Feature: Session management with Remember Me
- **Why now**: Depends on #6 (login creates sessions)
- **Unblocks**: #8, #9
- **Complexity**: Medium
- **Key work**: Sessions collection, cookies, GET /api/auth/me, CSRF tokens

#### 8. Issue #8: Feature: Logout functionality
- **Why now**: Depends on #7
- **Unblocks**: Nothing directly
- **Complexity**: Low
- **Key work**: POST /api/auth/logout, session deletion, logout button UI

#### 9. Issue #9: Feature: Protected routes and auth state
- **Why now**: Depends on #7 (needs /api/auth/me)
- **Unblocks**: #10 (list management milestone)
- **Complexity**: Medium
- **Key work**: React auth context, ProtectedRoute wrapper, loading states

---

### Phase 3: List Management

#### 10. Issue #10: Feature: Create list
- **Why now**: Depends on #9 (user must be authenticated)
- **Unblocks**: #11
- **Complexity**: Medium
- **Key work**: POST /api/lists, 10 list limit, create list UI, optimistic updates

#### 11. Issue #11: Feature: View all lists with sections
- **Why now**: Depends on #10 (need lists to display)
- **Unblocks**: #12, #14, #15
- **Complexity**: Medium
- **Key work**: GET /api/lists, Pinned/Active/Completed sections, list cards, responsive grid

#### 12. Issue #12: Feature: Edit list title
- **Why now**: Depends on #11
- **Unblocks**: #13
- **Complexity**: Low
- **Key work**: PATCH /api/lists/:listId, inline edit UI, character counter

#### 13. Issue #13: Feature: Delete list with confirmation
- **Why now**: Depends on #12 (similar UI patterns)
- **Unblocks**: Nothing directly
- **Complexity**: Low
- **Key work**: DELETE /api/lists/:listId, cascade delete tasks, confirmation modal

#### 14. Issue #14: Feature: Pin and unpin lists
- **Why now**: Depends on #11 (sections must exist)
- **Unblocks**: Nothing directly
- **Complexity**: Low
- **Key work**: PATCH isPinned field, pin toggle UI, section resorting

---

### Phase 4: Task Management

#### 15. Issue #15: Feature: Create task
- **Why now**: Depends on #11 (need list detail page)
- **Unblocks**: #16
- **Complexity**: Medium
- **Key work**: POST /api/lists/:listId/tasks, 25 task limit, task input UI, order field

#### 16. Issue #16: Feature: View tasks in list
- **Why now**: Depends on #15 (need tasks to display)
- **Unblocks**: #17
- **Complexity**: Low
- **Key work**: GET /api/lists/:listId/tasks, task list UI, completed styling

#### 17. Issue #17: Feature: Complete and uncomplete tasks
- **Why now**: Depends on #16
- **Unblocks**: #18
- **Complexity**: Low
- **Key work**: PATCH isCompleted, checkbox toggle, strikethrough styling, undo stack prep

#### 18. Issue #18: Feature: Edit task title
- **Why now**: Depends on #17 (similar PATCH endpoint)
- **Unblocks**: #19
- **Complexity**: Low
- **Key work**: PATCH title, inline edit, character counter, undo stack

#### 19. Issue #19: Feature: Delete task
- **Why now**: Depends on #18 (similar UI patterns)
- **Unblocks**: #20
- **Complexity**: Low
- **Key work**: DELETE endpoint, delete button, toast with undo

#### 20. Issue #20: Feature: Drag-and-drop task reordering
- **Why now**: Depends on #19 (all basic task ops done)
- **Unblocks**: #21
- **Complexity**: High
- **Key work**: @dnd-kit/core, PATCH /reorder, keyboard support, mobile long-press

#### 21. Issue #21: Feature: Undo/redo functionality
- **Why now**: Depends on #20 (all undoable actions exist)
- **Unblocks**: #22
- **Complexity**: High
- **Key work**: Undo/redo stack, floating toolbar, Ctrl+Z/Y shortcuts

---

### Phase 5: Account Management

#### 22. Issue #22: Feature: Account deletion
- **Why now**: Depends on #21 (all core features done)
- **Unblocks**: #23
- **Complexity**: Medium
- **Key work**: DELETE /api/auth/account, cascade delete all data, password confirmation

---

### Phase 6: Polish & Deploy

#### 23. Issue #23: Polish: Responsive design refinements
- **Why now**: Depends on #22 (all features complete)
- **Unblocks**: #24
- **Complexity**: Medium
- **Key work**: Mobile/tablet/desktop breakpoints, drawer nav, touch targets

#### 24. Issue #24: Polish: Accessibility audit and fixes
- **Why now**: Depends on #23
- **Unblocks**: #25
- **Complexity**: Medium
- **Key work**: Keyboard nav, ARIA labels, focus management, axe-core testing

#### 25. Issue #25: Setup: Terraform infrastructure for GCP
- **Why now**: Depends on #24 (app ready to deploy)
- **Unblocks**: #26
- **Complexity**: High
- **Key work**: Cloud Run, Firebase Hosting, Firestore, Secret Manager

#### 26. Issue #26: Deploy: Initial production deployment
- **Why now**: Depends on #25 (infrastructure exists)
- **Unblocks**: MVP complete!
- **Complexity**: Medium
- **Key work**: Apply Terraform, deploy frontend/backend, smoke test

---

## Dependency Graph

```
#1 (Monorepo)
  ├── #2 (Frontend) ──┐
  └── #3 (Backend) ───┼── #4 (Docker Compose)
                      │
                      └── #5 (Registration)
                            │
                            └── #6 (Login)
                                  │
                                  └── #7 (Sessions)
                                        ├── #8 (Logout)
                                        └── #9 (Protected Routes)
                                              │
                                              └── #10 (Create List)
                                                    │
                                                    └── #11 (View Lists)
                                                          ├── #12 (Edit List) ── #13 (Delete List)
                                                          ├── #14 (Pin List)
                                                          └── #15 (Create Task)
                                                                │
                                                                └── #16 (View Tasks)
                                                                      │
                                                                      └── #17 (Complete Task)
                                                                            │
                                                                            └── #18 (Edit Task)
                                                                                  │
                                                                                  └── #19 (Delete Task)
                                                                                        │
                                                                                        └── #20 (Drag-Drop)
                                                                                              │
                                                                                              └── #21 (Undo/Redo)
                                                                                                    │
                                                                                                    └── #22 (Account Delete)
                                                                                                          │
                                                                                                          └── #23 (Responsive)
                                                                                                                │
                                                                                                                └── #24 (A11y)
                                                                                                                      │
                                                                                                                      └── #25 (Terraform)
                                                                                                                            │
                                                                                                                            └── #26 (Deploy)
```

## Parallel Work Opportunities

While the main dependency chain is linear, some issues can be worked in parallel:

- **#2 and #3** can be done simultaneously (both depend only on #1)
- **#8 and #9** can be done simultaneously (both depend only on #7)
- **#12, #14, and #15** can be done simultaneously (all depend on #11)

## Blockers & Risks

1. **High complexity items**: #20 (drag-drop), #21 (undo/redo), #25 (Terraform) - may require more effort
2. **External dependency**: GCP account and billing must be configured before #25-#26
3. **Testing infrastructure**: E2E tests with Playwright should be set up early to validate features

## Notes

- All 8 "Future Enhancement" issues (#27-#34) are excluded from MVP scope
- Issues are well-structured with clear acceptance criteria
- Consistent patterns: optimistic updates, validation, accessibility considerations
- Stack: React + Vite + Tailwind + shadcn/ui (frontend), Express + TypeScript + Firestore (backend)
