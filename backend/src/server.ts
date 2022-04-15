import * as express from "express";
import * as http from "http";
import * as socket from "socket.io";
import disconnectEvent from "./events/disconnectEvent";
import { hostCreateGameEvent } from "./events/hostCreateGameEvent";
import {
  colorsDisplayedFinished,
  disconnect,
  hostCreateGame,
  joinGame,
  playerFinished,
  startGame,
} from "./globalEvents";
import { InterServerEvents } from "./types/interServerTypes";
import { ServerToClientEvents } from "./types/serverToClientTypes";
import { ClientToServerEvents } from "./types/clientToServerTypes";
import { joinGameEvent } from "./events/joinGameEvent";
import {
  createGameData,
  gameIdNickname,
  onlyGameId,
} from "./types/socketDataTypes";
import { startGameEvent } from "./events/startGameEvent";
import { colorsDisplayedFinishedEvent } from "./events/colorsDisplayedFinishedEvent";
import { playerRound } from "./types/internalTypes";
import { playerFinishedEvent } from "./events/playerFinishedEvent";
import { getGameStateAsString, getPlayerStateHTML } from "./serverState";

let lastCommitToMaster = "";
require("child_process").exec(
  "git rev-parse HEAD",
  function (_: Error, stdout: string) {
    lastCommitToMaster = stdout;
  }
);
const app: express.Application = express();
const port = process.env.PORT || 8000;
const server: http.Server = http.createServer(app);
export const io = new socket.Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents
>(server, {
  cors: {
    origin: "*",
  },
});
//setup the start connection
//add events here when they are made in the backend
io.on("connection", (socket: socket.Socket) => {
  socket.on(disconnect, () => disconnectEvent(socket, io));
  socket.on(hostCreateGame, (data: createGameData) =>
    hostCreateGameEvent(socket, io, data)
  );
  socket.on(joinGame, (data: gameIdNickname) =>
    joinGameEvent(socket, io, data)
  );
  socket.on(startGame, (data: onlyGameId) => startGameEvent(socket, io, data));
  socket.on(colorsDisplayedFinished, (data: onlyGameId) =>
    colorsDisplayedFinishedEvent(socket, io, data)
  );
  socket.on(playerFinished, (data: playerRound) =>
    playerFinishedEvent(socket, data)
  );
});
app.get("/", (_, res) => {
  const gameStateString = getGameStateAsString();
  res.send(
    `<html lang="no">
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <!-- Your HTML here -->
    <p>Welcome to an Express server with websockets! port: ${port}. PlayerCount: ${io.engine.clientsCount}. Last commit to master: ${lastCommitToMaster}</p>
    <br/>
    ${gameStateString} <br/>
      </body>
</html>
    `
  );
});
server.listen(port, (): void => {
  console.log(`Connected successfully on port ${port}`);
});
