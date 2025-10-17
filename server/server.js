import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import { nanoid } from 'nanoid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 5228
const app = express()

if (process.env.NODE_ENV !== 'production') {
  app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
}
app.use(express.json())

let activities=[
  { id:nanoid(), title:'Escape Game en ville', url:'https://www.prizoners.com/agence/grenoble/jeux', description:'Résolvez des énigmes en équipe.', tags:['Indoor','90 min'], votes:0 },
  { id:nanoid(), title:'Karting Team Sprint', url:'https://green-kart.com/', description:'Courses en relais.', tags:['Outdoor','Adrénaline'], votes:0 },
  { id:nanoid(), title:'Laser Game', url:'https://grenoble.sevensquares.fr/laser-game-grenoble/', description:'Laser Game à grenoble' , tags:['Indoor','Team'], votes:0 },
  { id:nanoid(), title:'Bowling', url:'https://grenoble.sevensquares.fr/bowling-grenoble/', description:'Un bowling interactif unique à Grenoble !' , tags:['Indoor','fun'], votes:0 }, 
  { id:nanoid(), title:'Billard', url:'https://grenoble.sevensquares.fr/billard-grenoble/', description:'Profitez d’un espace dédié au billard à Grenoble !' , tags:['Indoor','fun'], votes:0 },
  { id:nanoid(), title:'Billard', url:'https://grenoble.sevensquares.fr/billard-grenoble/', description:'Profitez d’un espace dédié au billard à Grenoble !' , tags:['Indoor','fun'], votes:0 },
]

app.get('/api/health', (_, res) => res.json({ ok: true }))
app.get('/api/activities', (_, res) => res.json(activities))
app.post('/api/activities', (req, res) => {
  const { title, url, description, tags } = req.body || {}
  if (!title || !url) return res.status(400).json({ error: 'title and url required' })
  const a = { id: nanoid(), title:String(title), url:String(url), description: description?String(description):undefined, tags: Array.isArray(tags)?tags.map(String):undefined, votes:0 }
  activities.push(a)
  broadcast({ type: 'activities', payload: activities })
  res.json(a)
})
app.post('/api/vote', (req, res) => {
  const { activityId, previousActivityId } = req.body || {}
  const sel = activities.find(a => a.id === activityId)
  if (!sel) return res.status(404).json({ error: 'not found' })
  if (previousActivityId && previousActivityId !== activityId) {
    const prev = activities.find(a => a.id === previousActivityId)
    if (prev) prev.votes = Math.max(0, prev.votes - 1)
  }
  sel.votes += 1
  broadcast({ type: 'activities', payload: activities })
  res.json(activities)
})

const distDir = path.resolve(__dirname, '../client/dist')
app.use(express.static(distDir))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.join(distDir, 'index.html'))
})

const httpServer = createServer(app)
const wss = new WebSocketServer({ server: httpServer, path: '/ws' })
function broadcast(message) {
  const data = JSON.stringify(message)
  wss.clients.forEach(client => { if (client.readyState === 1) client.send(data) })
}
wss.on('connection', ws => { ws.send(JSON.stringify({ type: 'activities', payload: activities })) })

httpServer.listen(PORT, () => { console.log(`Listening on http://localhost:${PORT}`) })
