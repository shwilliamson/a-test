# Discovery: Todo List Manager

## Overview

A simple, responsive todo list application where users can create an account, manage multiple lists, and track tasks within each list. Lists can be pinned for priority and automatically sort to show completed lists at the bottom.

## Goals

- Provide a clean, intuitive interface for managing todo lists
- Support multiple lists per user with task management
- Responsive design that works on desktop and mobile browsers
- Minimal friction for common actions (add, complete, reorder tasks)

## Users

| User Type | Needs | Permissions |
|-----------|-------|-------------|
| Registered User | Create/manage lists and tasks | Full CRUD on own data only |

## Requirements

### Must Have (MVP)

#### Authentication
- User registration with username (6-12 chars, unique) and password (8-16 chars)
- Login with "Remember me" option (7-day session)
- Logout functionality
- Account deletion (permanently removes all user data)

#### Lists
- Create new list with title (max 64 chars)
- Maximum 10 lists per user
- View all lists organized in sections:
  - Pinned lists (sorted by updated date)
  - Active lists (sorted by updated date)
  - Completed lists at bottom (sorted by updated date)
- Pin/unpin lists to move to priority section
- Edit list title
- Delete list with confirmation (cascades to all tasks)
- Empty lists show visual indicator and stay in Active section
- List marked as "completed" when all tasks are checked off

#### Tasks
- Create new task with title (max 64 chars)
- Maximum 25 tasks per list
- New tasks added at bottom of list
- Check/uncheck tasks to mark complete
- Completed tasks stay in their current position
- Drag-and-drop reordering of tasks
- Edit task title
- Delete tasks
- Client-side undo/redo stack for all actions while on list screen

### Nice to Have (Future)
- Sharing lists with other users
- Due dates and reminders
- Tags/categories for tasks
- Search functionality
- Recurring tasks
- Dark mode / themes
- Password reset via email
- Email notifications

## User Flows

### Flow 1: Registration
1. User navigates to app
2. User clicks "Create Account"
3. User enters username and password
4. System validates (unique username, password length)
5. System creates account and logs user in
6. User sees empty lists screen

### Flow 2: Create List and Add Tasks
1. User clicks "New List"
2. User enters list title
3. System creates list, user sees empty list
4. User types task title and presses Enter
5. Task appears at bottom of list
6. User repeats to add more tasks

### Flow 3: Complete Tasks
1. User opens a list
2. User clicks checkbox next to task
3. Task shows as completed (stays in position)
4. When all tasks complete, list moves to Completed section on index

### Flow 4: Reorder Tasks
1. User opens a list
2. User drags task to new position
3. Task order updates immediately
4. Action added to undo stack

### Flow 5: Pin List
1. User views list index
2. User clicks pin icon on a list
3. List moves to Pinned section at top

## Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: Firestore (emulator for local dev)
- **Hosting**: Firebase Hosting (frontend CDN) + Cloud Run (backend API)
- **Auth**: Custom session-based authentication

### Approach
- Monorepo structure with `/frontend` and `/backend` directories
- RESTful API design with `/health` endpoint for Cloud Run health checks
- Firestore for NoSQL document storage (lists as documents, tasks as subcollection or embedded)
- Docker Compose for local development with Firestore emulator
- Terraform for GCP infrastructure

### Data Model

```
users/{userId}
  - username: string
  - passwordHash: string
  - createdAt: timestamp
  - updatedAt: timestamp

users/{userId}/lists/{listId}
  - title: string
  - isPinned: boolean
  - createdAt: timestamp
  - updatedAt: timestamp

users/{userId}/lists/{listId}/tasks/{taskId}
  - title: string
  - isCompleted: boolean
  - order: number
  - createdAt: timestamp
  - updatedAt: timestamp
```

## UI/UX Requirements

### Responsive Design
- Mobile-first approach
- Breakpoints: mobile (<640px), tablet (640-1024px), desktop (>1024px)
- Navigation: drawer on mobile, sidebar on desktop
- List grid: 1 column mobile, 2-3 columns tablet/desktop
- Task list: full-width on all sizes

### Accessibility
- Follow WCAG best practices
- Semantic HTML with proper heading hierarchy
- Keyboard navigation for all interactions
- ARIA labels and live regions for dynamic updates
- Focus management on modals and CRUD operations
- Respect `prefers-reduced-motion` for animations

### Drag-and-Drop Interaction
- **Desktop**: Visual drag handle, ghost element during drag, clear drop zones
- **Mobile**: Long-press to activate drag, or dedicated reorder mode with up/down buttons
- **Keyboard**: Arrow keys to move tasks up/down when focused
- **Touch**: Haptic feedback if available

### Undo/Redo Pattern
- Floating toolbar at bottom of list view (fixed on mobile, sticky on desktop)
- Undo/Redo buttons with keyboard shortcut tooltips (Ctrl+Z / Ctrl+Y)
- Toast notification showing what was undone (e.g., "Task deleted" with Undo button)
- Undo stack is client-side only; cleared on page refresh (expected behavior)

### Confirmation Dialogs
- Modal pattern for destructive actions (delete list, delete account)
- Clear title: "Delete list?"
- Body text with context: "This will permanently delete [List Name] and all X tasks. This cannot be undone."
- Actions: "Cancel" (secondary) and "Delete" (destructive, red)
- Focus trapped in modal; Esc to cancel, Enter to confirm

### Form Validation
- Inline errors below inputs with red text and error icon
- Validate on blur or submit (not on every keystroke)
- `aria-invalid` and `aria-describedby` for screen readers
- Character counter as user approaches limit (64 chars for titles)

### Empty States
- **No lists**: Welcome message + "Create your first list" CTA
- **Empty list (no tasks)**: "No tasks yet. Type below to add your first task."
- **Completed section empty**: "Completed lists will appear here"

### Limit Feedback
- **10 lists reached**: Disable "New List" button, show tooltip "Maximum 10 lists reached"
- **25 tasks reached**: Disable task input, show message "Maximum 25 tasks per list"

### Loading & Feedback
- Use optimistic updates for instant feedback on create/edit/complete
- Show loading spinner only for initial page loads and deletes
- Revert with error toast if API call fails

### Visual Distinction
- Pinned vs Active vs Completed lists (icons, colors, or section headers)
- Completed vs incomplete tasks (strikethrough, muted color)
- Empty lists (visual indicator on list card)

## Security

- Password hashing (bcrypt or similar)
- Session-based auth with secure cookies (`httpOnly`, `secure`, `sameSite=strict`)
- Session storage in Firestore (simple, consistent with data layer)
- CSRF protection tokens for state-changing requests
- Users can only access their own data
- Rate limiting on auth endpoints
- Input validation and sanitization

## Out of Scope

- Social login (Google, GitHub, etc.)
- Password reset / email verification
- Sharing lists between users
- Due dates, reminders, notifications
- Tags, categories, or labels
- Search functionality
- Recurring tasks
- Multiple themes / dark mode
- Native mobile apps
- Offline support / PWA
- Real-time collaboration

## Open Questions

None - all requirements clarified during discovery.

## Proposed Milestones

### Milestone 1: Project Setup
- Initialize monorepo structure
- Setup frontend with React + Vite + TypeScript + Tailwind + shadcn/ui
- Setup backend with Node.js + Express + TypeScript
- Docker Compose with Firestore emulator
- Basic CI/CD pipeline

### Milestone 2: Authentication
- User registration endpoint and UI
- User login endpoint and UI
- Session management with "Remember me"
- Logout functionality
- Protected routes

### Milestone 3: List Management
- Create list
- View all lists (with sections: Pinned, Active, Completed)
- Edit list title
- Delete list with confirmation
- Pin/unpin lists
- Empty state handling

### Milestone 4: Task Management
- Create task
- View tasks in list
- Complete/uncomplete tasks
- Edit task title
- Delete task
- Drag-and-drop reordering
- Undo/redo functionality

### Milestone 5: Account Management
- Account deletion with confirmation
- Delete all associated data

### Milestone 6: Polish & Deploy
- Responsive design refinements
- Accessibility audit and fixes
- Error handling improvements
- Terraform infrastructure setup
- Deploy to Firebase Hosting + Cloud Run

### Future Enhancements (Post-MVP)
- Sharing lists with other users
- Due dates and reminders
- Tags/categories for tasks
- Search functionality
- Recurring tasks
- Dark mode / themes
- Password reset via email
- Email notifications
