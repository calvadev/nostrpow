# NostrPoW Client

A modern Nostr client that displays and sorts notes by Proof of Work (PoW) difficulty with real-time relay connections.

## Features

- **Real-time Note Feed**: Live streaming of Nostr notes from multiple relays
- **Proof of Work Analysis**: Calculate and display PoW difficulty for each note
- **Smart Sorting**: Sort notes by PoW difficulty (high to low, low to high) or timestamp
- **Relay Management**: Add/remove relays with connection status monitoring
- **Search & Filter**: Search through notes and filter by minimum PoW difficulty
- **Responsive Design**: Beautiful dark theme with responsive layout
- **WebSocket Integration**: Real-time updates with automatic reconnection

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Wouter (routing)
- **Backend**: Node.js, Express, WebSocket
- **UI Components**: shadcn/ui, Radix UI
- **State Management**: TanStack Query
- **Real-time**: WebSocket connections to Nostr relays

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/calvadev/nostr-pow-client.git
cd nostr-pow-client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5000`

## How It Works

### Proof of Work Calculation

The application calculates Proof of Work by counting the number of leading zeros in a Nostr event's ID (hash). The more leading zeros, the higher the difficulty:

- **0-5 zeros**: Low difficulty (Gray indicator)
- **6-11 zeros**: Medium difficulty (Yellow indicator)  
- **12+ zeros**: High difficulty (Green indicator)

### Relay Connections

The app connects to multiple Nostr relays simultaneously:
- `wss://relay.damus.io`
- `wss://nos.lol`
- `wss://relay.snort.social`

You can add custom relays through the sidebar interface.

### Real-time Updates

Notes are streamed in real-time through WebSocket connections. The app automatically:
- Reconnects to relays if connections drop
- Calculates PoW for incoming notes
- Updates the feed with new notes
- Maintains connection status indicators

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── pages/          # Page components
├── server/                 # Backend Express server
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes and WebSocket handling
│   ├── storage.ts         # In-memory data storage
│   └── vite.ts            # Vite development server setup
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Data models and Zod schemas
└── components.json         # shadcn/ui configuration
```

## API Endpoints

- `GET /api/notes` - Fetch notes with filtering and sorting
- `GET /api/relays` - Get relay status information
- `POST /api/relays` - Add a new relay
- `GET /api/stats` - Get network statistics
- `WS /ws` - WebSocket endpoint for real-time updates

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built for the Nostr protocol ecosystem
- Uses the Nostr event format and relay specifications
- Inspired by the need for better PoW analysis tools in the Nostr space