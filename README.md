# TaskList

A full-stack task management application built with React and Express. Create lists, add tasks, mark them complete, and organize your work with drag-and-drop reordering and undo/redo functionality.

## Features

- **User Authentication** - Secure registration and login
- **Create & Manage Lists** - Organize tasks into multiple lists
- **Task Management** - Create, edit, complete, and delete tasks
- **Drag-and-Drop Reordering** - Reorganize tasks with intuitive drag-and-drop
- **Pin Lists** - Pin important lists to the top for quick access
- **Undo/Redo** - Revert or replay your recent actions
- **Inline Editing** - Edit task titles directly in the list
- **Real-time UI** - Optimistic updates for instant feedback

## Project Structure

```
.
├── frontend/          # React + Vite frontend (TypeScript)
├── backend/           # Express API backend (TypeScript)
├── docker-compose.yml # Local development environment
└── package.json       # Monorepo workspace configuration
```

## Local Development Setup

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- Node.js 20+ (for running without Docker)

### Running with Docker Compose (Recommended)

Start all services with a single command:

```bash
docker-compose up
```

This starts:
- **Frontend**: http://localhost:5173 (Vite with hot reload)
- **Backend**: http://localhost:3001 (Express with hot reload)
- **Firestore Emulator**: http://localhost:8080

To rebuild containers after dependency changes:

```bash
docker-compose up --build
```

To stop all services:

```bash
docker-compose down
```

To stop and remove volumes (clears Firestore data):

```bash
docker-compose down -v
```

### Running Without Docker

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the backend:
   ```bash
   cd backend && npm run dev
   ```

3. Start the frontend (in a new terminal):
   ```bash
   cd frontend && npm run dev
   ```

Note: When running without Docker, you'll need to run the Firestore emulator separately or connect to a real Firestore instance.

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `FIRESTORE_EMULATOR_HOST` | - | Firestore emulator host:port |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | CORS allowed origin |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3001` | Backend API URL |

## Development Workflow

1. Make changes to source files in `frontend/src` or `backend/src`
2. Hot reload will automatically refresh the application
3. Firestore data persists in the emulator when using Docker
4. View Firestore Emulator UI at http://localhost:8080 (when using Docker)

## Scripts

### Root (Monorepo)

- `npm run install:all` - Install all dependencies
- `npm run lint` - Lint all workspaces
- `npm run format` - Format code with Prettier

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript
- `npm run start` - Run compiled JavaScript

## Tech Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Static typing
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **React Beautiful DnD** - Drag-and-drop library (for task reordering)
- **Immer** - Immutable state management (for undo/redo)

### Backend
- **Express.js** - Web framework
- **TypeScript** - Static typing
- **Firebase Admin SDK** - Firestore database and authentication
- **Cookie Parser** - Cookie parsing middleware
- **CORS** - Cross-origin resource sharing

### Infrastructure
- **Firestore** - NoSQL database (emulated locally)
- **Docker & Docker Compose** - Containerization and local development
- **Firebase Authentication** - User authentication service
