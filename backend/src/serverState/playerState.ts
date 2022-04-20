import { io } from "../server";
import { playerState, player, playerRound } from "../types/internalTypes";
import { deleteGame, getGame } from "./gameState";

const playerData: playerState = {
  players: [],
};

export const addPlayerToServerAndGame = (
  gameId: number,
  newPlayer: player
): void => {
  playerData.players.push(newPlayer);
  const game = getGame(gameId);
  if (game.players.find((p) => p === newPlayer.socketId) === undefined) {
    game.players.push(newPlayer.socketId);
    game.result.push({
      totalScore: 0,
      nickname: newPlayer.name,
      playerId: newPlayer.socketId,
    });
  }
};
export const getPlayer = (playerId: string): player | null => {
  return (
    playerData.players.find((player) => player.socketId === playerId) ?? null
  );
};

export const playerPlayedRound = (
  playerId: string,
  answer: number[],
  playerScore: number,
  gameId: number,
  timeUsed: number
): playerRound | null => {
  const player = getPlayer(playerId);
  if (!player) {
    return null;
  }
  player.roundsPlayed.push({
    round: player.roundsPlayed.length + 1,
    answer: answer,
    timeUsed: timeUsed,
    playerId: playerId,
    gameId: gameId,
    score: playerScore,
  });
};

export const playerDisconnected = async (socketId: string): Promise<number> => {
  const player = playerData.players.find(
    (player) => player.socketId === socketId
  );
  if (player) {
    const isHost = await deletePlayer(socketId);
    if (isHost || getGame(player.gameId).players.length === 0) {
      deleteGame(player.gameId);
      return player.gameId;
    }
  }
  return 0;
};
export const deletePlayer = async (playerId: string): Promise<boolean> => {
  //returns boolean true if the player was the host
  const index = playerData.players.indexOf(getPlayer(playerId) ?? null);
  const game = getGame(getPlayer(playerId).gameId);
  if (index > -1) {
    playerData.players.splice(index, 1);
    game.players = game.players.filter((player) => player !== playerId);
    (await io.fetchSockets()).forEach((socket) => {
      if (socket.id === playerId) {
        socket.leave(game.gameId.toString());
      }
    });
    return game.hostId == playerId;
  }
};

export const getPlayersFromGame = (gameId: number): player[] => {
  return (
    getGame(gameId)
      ?.players.map((playerId) => getPlayer(playerId))
      .filter((player) => player !== null) ?? []
  );
};

export const getPlayerAsString = (): string => {
  let playerStateString = `<br\>Current PlayerState:<br\>`;
  playerData.players.forEach((player) => {
    playerStateString += `Player ${player.name}.\t inGame: ${
      getGame(player.gameId).gameId
    }<br\>isHost: ${
      getGame(player.gameId).hostId === player.socketId
    }<br\> RoundsCount: ${player.roundsPlayed.length}<br\>Results:<br\>${[
      ...player.roundsPlayed.map(
        (round: playerRound) =>
          `${round.round}.\t Score: ${round.score} Time Used: ${
            round.timeUsed
          } Answer: [${[...round.answer]}]`
      ),
    ]}<br\><br\>`;
  });
  playerStateString += `<br\>`;
  return playerStateString;
};

export const allPlayersHavePlayed = (
  gameId: number,
  roundNumber: number
): boolean => {
  const players = getPlayersFromGame(gameId);
  return players.every((player) =>
    player.roundsPlayed.some((round) => round.round === roundNumber)
  );
};