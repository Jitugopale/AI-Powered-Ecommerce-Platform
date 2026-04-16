import express from "express";
import cors from "cors"
import dotenv from "dotenv"
import rootRouter from "./routes/index.js";
dotenv.config();

const app = express();
app.use(express.json());

app.use(cors())

const PORT = process.env.PORT;

app.use('/api',rootRouter)

app.get('/',(req,res)=>{
    res.send("Backend Running")
})

app.listen(PORT,()=>{
    console.log(`Server running on PORT no ${PORT}`)
})