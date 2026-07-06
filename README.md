<<<<<<< HEAD
# Project Management Tool

A full-stack Trello/Asana-style project management app with JWT auth, MongoDB persistence, drag-and-drop boards, Socket.io real-time updates, project membership, task comments, live presence, notifications, and due-date reminders.

## Stack

- Backend: Node.js, Express, MongoDB, Mongoose, Socket.io
- Auth: JWT access and refresh tokens in httpOnly cookies, bcrypt password hashing
- Frontend: React, Vite, React Router, Context API, `@hello-pangea/dnd`
- Supporting tools: `helmet`, `cors`, `express-rate-limit`, `morgan`, `express-validator`, `node-cron`

## Setup

1. Install dependencies:

```bash
npm install
npm install --prefix server
npm install --prefix client
```

2. Create environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

3. Start MongoDB locally and seed sample data:

```bash
npm run seed
```

Seed login:

```text
admin@example.com / password123
```

4. Run the app:

```bash
npm run dev
```

Or run each side separately:

```bash
npm run dev --prefix server
npm run dev --prefix client
```

The API runs on `http://localhost:5000` and the client runs on `http://localhost:5173`.

## Real-Time Design

Socket.io rooms are keyed by `project:<projectId>`, so board activity is scoped to users currently viewing the same project. Each authenticated socket also joins `user:<userId>` for direct notification delivery.

Client to server events:

- `join-project` joins the project room and publishes live presence.
- `task:move` persists a move and broadcasts `task:moved`.
- `comment:add` persists a comment and broadcasts `comment:added`.
- `typing:start` and `typing:stop` broadcast comment typing state.

Server to client events:

- `task:created`, `task:moved`, `task:updated`, `task:deleted`
- `list:created`, `list:updated`, `list:deleted`
- `comment:added`
- `notification:new`
- `presence:update`
- `typing:update`

REST remains the source of truth. The client uses optimistic UI for drag-and-drop, then refetches project state after socket or REST updates.

## Main API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects/:id/invite`
- `POST /api/projects/:id/lists`
- `POST /api/lists/:id/tasks`
- `PUT /api/tasks/:id`
- `POST /api/tasks/:id/comments`
- `GET /api/notifications`
- `PUT /api/notifications/read-all`
=======
# Project-Management-Tool
Build a full-stack, real-time collaborative project management tool (Trello/Asana-style) — not a static kanban demo, but one with real auth, persistent data, live multi-user sync via WebSockets, and notifications.
>>>>>>> 39c5c733ab7358dffdc2a394bdbcb2fcfb654e47
