// server/server.ts
import { WebSocketServer } from './src/network/WebSocketServer';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

const server = new WebSocketServer();
server.start(PORT);