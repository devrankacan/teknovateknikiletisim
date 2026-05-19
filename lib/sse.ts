type SSEClient = {
  id: string;
  send: (data: string) => void;
};

// Global registry of connected SSE clients (survives hot reload in dev via global)
const g = globalThis as unknown as { sseClients?: Map<string, SSEClient> };
if (!g.sseClients) g.sseClients = new Map();
const clients = g.sseClients;

export function addSSEClient(id: string, send: (data: string) => void) {
  clients.set(id, { id, send });
}

export function removeSSEClient(id: string) {
  clients.delete(id);
}

export function broadcastSSE(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients.values()) {
    try {
      client.send(payload);
    } catch {
      clients.delete(client.id);
    }
  }
}
