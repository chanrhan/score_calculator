import http from 'http'
import { Server } from 'socket.io'

type GlobalSocket = {
  httpServer: http.Server | null
  io: Server | null
  starting: boolean
  started: boolean
}

const g = globalThis as unknown as { __io?: GlobalSocket }
if (!g.__io) {
  g.__io = { httpServer: null, io: null, starting: false, started: false }
}

function ensureServerStarted(): Server | null {
  const state = g.__io!
  if (state.io && state.httpServer && state.httpServer.listening) return state.io
  if (state.starting) return state.io
  state.starting = true
  try {
    const port = Number(process.env.SOCKET_PORT || 3001)
    // 이미 리스닝 중이면 재사용
    if (state.httpServer?.listening && state.io) {
      state.started = true
      return state.io
    }

    const httpServer = http.createServer()
    const io = new Server(httpServer, {
      cors: {
        origin: [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
        ],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      serveClient: false,
      transports: ['websocket', 'polling'],
    })

    try {
      httpServer.listen(port, () => {
        // eslint-disable-next-line no-console
      })
      io.on('connection', (socket) => {
        // eslint-disable-next-line no-console
        socket.on('disconnect', () => {
          // eslint-disable-next-line no-console
        })
      })
      state.httpServer = httpServer
      state.io = io
      state.started = true
    } catch (listenErr: any) {
      if (listenErr?.code === 'EADDRINUSE') {
        // 포트가 이미 사용 중이면, 재시도하지 않고 무소음 폴백 (콘솔 진행률로 대체)
        // eslint-disable-next-line no-console
        state.httpServer = null
        state.io = null
        state.started = false
      } else {
        throw listenErr
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
  } finally {
    g.__io!.starting = false
  }
  return g.__io!.io
}

export function getIo(): Server | null {
  return ensureServerStarted()
}

export function emitProgress(event: string, payload: any): void {
  try {
    const instance = getIo()
    if (instance) {
      instance.emit(event, payload)
    } else {
      // eslint-disable-next-line no-console
    }
  } catch (error) {
    // eslint-disable-next-line no-console
  }
}

export function shutdownSocket(): void {
  const state = g.__io!
  try {
    state.io?.removeAllListeners()
    state.io?.close()
    state.httpServer?.close()
  } catch (error) {
    // ignore
  } finally {
    state.io = null
    state.httpServer = null
    state.started = false
    state.starting = false
  }
}


