import type { Activity } from '../types'
import { wsUrl } from './api'
export type ServerMessage = { type:'activities'; payload: Activity[] }
export function makeSocket(onMessage:(msg:ServerMessage)=>void){
  let socket: WebSocket | null = null; let timeout=1000
  function connect(){
    socket = new WebSocket(wsUrl())
    socket.onopen = () => { timeout=1000 }
    socket.onmessage = (ev) => { try{ const data = JSON.parse(ev.data) as ServerMessage; onMessage(data) }catch{} }
    socket.onclose = () => { setTimeout(connect, timeout); timeout = Math.min(timeout*2, 10000) }
    socket.onerror = () => { socket?.close() }
  }
  connect(); return ()=> socket?.close()
}
