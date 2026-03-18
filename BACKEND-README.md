# Node.js Backend Server

A simple Express.js backend server for the project.

## Features

- Basic API endpoints
- Static file serving for frontend
- Health check endpoint
- Project data endpoint

## Installation

1. Install dependencies (if not already installed):

```bash
npm install
```

## Usage

### Development (Vite dev server)

For frontend development with hot reload:

```bash
npm run start
```

This will start the Vite dev server at `http://localhost:5173` or similar.

### Production (Node.js server)

1. Build the frontend:

```bash
npm run build
```

2. Start the Node.js server:

```bash
npm run server
```

Or run both commands together:

```bash
npm run dev-server
```

The server will start at `https://api.niumashuai.top`.

## API Endpoints

### Health Check

```
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "message": "Node.js backend is running",
  "timestamp": "2026-01-04T16:20:00.000Z"
}
```

### Project Data

```
GET /api/projects
```

Response:
```json
{
  "projects": [
    {
      "id": 1,
      "name": "Main Project",
      "description": "This is the main project",
      "status": "active"
    },
    {
      "id": 2,
      "name": "后续补充",
      "description": "This is the additional project",
      "status": "active"
    }
  ]
}
```

## Project Structure

```
├── server.js              # Node.js backend server
├── dist/                  # Built frontend files
├── src/                   # Frontend source code
├── package.json           # Project dependencies and scripts
└── vite.config.mjs        # Vite configuration
```

## Environment Variables

- `PORT`: Server port (default: 3001)

## License

MIT
