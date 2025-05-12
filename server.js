import express from "express";
import {connectdb} from './db/connectdb.js'
import cors from 'cors'
import cookieParser from "cookie-parser";

import adminRoutes from './routes/adminRoutes.js'
import authRoutes from './routes/authRoutes.js'
import buyOrderRoutes from './routes/buyOrderRoutes.js'
import sellOrderRoutes from './routes/sellOrderRoutes.js'
import investmentRoutes from './routes/investmentRoutes.js'
import settingsRoutes from './routes/settingsRoute.js'
import notificationRoutes from './routes/notificationRoutes.js'
import appealRoutes from './routes/appealRoutes.js'
import liveSessionRoutes from './routes/liveSessionRoutes.js'
import './utils/cron.js'

const app = express()

const allowedOrigins = [
    process.env.ADMIN_URL,
    process.env.USER_URL
  ];  

app.use(cors({origin: (origin, callback) => {
    //if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  }, credentials: true}))
app.use(express.json({limit: '10mb'}))
app.use(cookieParser())

const port = process.env.PORT || 5000

app.use('/api/admin', adminRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/buy-orders', buyOrderRoutes)
app.use('/api/sell-orders', sellOrderRoutes)
app.use('/api/investments', investmentRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/appeals', appealRoutes)
app.use('/api/live-sessions', liveSessionRoutes)

app.listen(port, ()=>{
    console.log(`Server running on port ${port}`)
    connectdb()
})