import { io } from 'socket.io-client';

/** Single shared connection — avoids stale handshakes from duplicate clients. */
export const socket = io({ autoConnect: true, withCredentials: true });

const AUTH_ERROR = 'Потрібна авторизація';

/** Reconnect so the handshake picks up the current session cookie. */
export function reconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
  socket.connect();
}

function waitForConnect() {
  if (socket.connected) return Promise.resolve();
  return new Promise((resolve) => socket.once('connect', resolve));
}

/** Emit with ack; retry once after reconnect if the handshake lacked a session cookie. */
export function emitWithAck(event, payload) {
  const attempt = () =>
    new Promise((resolve, reject) => {
      socket.emit(event, payload, (res) => {
        if (res?.ok) resolve(res);
        else reject(new Error(res?.error ?? 'Помилка операції'));
      });
    });

  return attempt().catch(async (err) => {
    if (err.message !== AUTH_ERROR) throw err;
    reconnectSocket();
    await waitForConnect();
    return attempt();
  });
}
