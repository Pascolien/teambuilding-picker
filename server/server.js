import express from 'express'
import cors from 'cors'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import { nanoid } from 'nanoid'
const PORT=process.env.PORT||5228
const CLIENT_ORIGIN=process.env.CLIENT_ORIGIN||'http://localhost:5173'
const app=express()
app.use(cors({origin:CLIENT_ORIGIN,credentials:true}))
app.use(express.json())
let activities=[
  { id:nanoid(), title:'Escape Game en ville', url:'https://www.escapegame.fr/', description:'Résolvez des énigmes en équipe.', tags:['Indoor','90 min'], votes:0 },
  { id:nanoid(), title:'Karting Team Sprint', url:'https://www.karting-france.fr/', description:'Courses en relais.', tags:['Outdoor','Adrénaline'], votes:0 },
  { id:nanoid(), title:'Atelier Cuisine', url:'https://www.atelierdeschefs.fr/', description:'Cuisinez ensemble.', tags:['Gourmand','2h'], votes:0 },
]
app.get('/',(_,_res)=>_.res.json?_.res.json({ok:true}):_ )
app.get('/activities',(_,_res)=>_res.json(activities))
app.post('/activities',(req,res)=>{ const {title,url,description,tags}=req.body||{}; if(!title||!url) return res.status(400).json({error:'title and url required'}); const a={ id:nanoid(), title:String(title), url:String(url), description: description?String(description):undefined, tags: Array.isArray(tags)?tags.map(String):undefined, votes:0 }; activities.push(a); broadcast({type:'activities',payload:activities}); res.json(a)})
app.post('/vote',(req,res)=>{ const {activityId,previousActivityId}=req.body||{}; const sel=activities.find(a=>a.id===activityId); if(!sel) return res.status(404).json({error:'not found'}); if(previousActivityId && previousActivityId!==activityId){ const prev=activities.find(a=>a.id===previousActivityId); if(prev) prev.votes=Math.max(0,prev.votes-1) } sel.votes+=1; broadcast({type:'activities',payload:activities}); res.json(activities) })
const server=createServer(app); const wss=new WebSocketServer({server,path:'/ws'})
function broadcast(message){ const data=JSON.stringify(message); wss.clients.forEach(c=>{ if(c.readyState===1) c.send(data) }) }
wss.on('connection',(ws)=>{ ws.send(JSON.stringify({type:'activities',payload:activities})) })
server.listen(PORT,()=>{ console.log('Server http://localhost:'+PORT) })