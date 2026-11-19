/*
websocket.mjs - simple websocket client as a pattern
Copyright (C) 2026 Strudel contributors -- see <https://codeberg.org/uzu/strudel/src/branch/main/packages/websocket/websocket.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { logger, signal } from '@strudel/core';

const connections = {};
const values = {};

function connect(addr) {
  if (connections[addr]) {
    return connections[addr];
  }
  const ws = new WebSocket(addr);
  connections[addr] = ws;
  ws.addEventListener('open', () => {
    logger(`[websocket] connected to ${addr}`);
  });
  ws.addEventListener('message', (event) => {
    try {
      console.log(event.data);
      values[addr] = JSON.parse(event.data);
    } catch {
      logger(`[websocket] received invalid json on ${addr}`);
    }
  });
  ws.addEventListener('close', () => {
    logger(`[websocket] disconnected from ${addr}`);
    delete connections[addr];
  });
  ws.addEventListener('error', () => {
    logger(`[websocket] failed to connect to ${addr}`);
    delete connections[addr];
  });
  return ws;
}

export function websocket(addr) {
  connect(addr);
  return signal(() => values[addr] ?? {});
}
