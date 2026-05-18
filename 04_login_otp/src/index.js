import express from "express";
import Redis from "ioredis";

const app = express();
const PORT = process.env.PORT || 5000

app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

function otpKey(phone) {
    return `otp:${phone}`;
}

app.post("/otp", async(req,res) => {
    const {phone} = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await redis.set(otpKey(phone), otp, "EX", 30); // otp valid for 30 seconds
    
    res.json({message:"otp sent successfully", otp}) // real app would send otp via sms, not return in response

})

app.post("/otp/verify", async(req,res) => {
    const {phone, otp} = req.body; 

    const savedOtp = await redis.get(otpKey(phone))

    if(!savedOtp){
        return res.status(400).json({message:"otp expired or not found"})
    }

    if(savedOtp !== otp){
        return res.status(400).json({message:"invalid otp"})
    }

    await redis.del(otpKey(phone))
    res.json({message:"otp verified successfully"})
})


app.get("/otp/:phone/ttl", async(req,res) => {
    const {phone} = req.params;

    const ttl = await redis.ttl(otpKey(phone));

    if(ttl === -2){
        return res.status(404).json({message:"otp not found"})
    }

    res.json({message:"otp ttl", ttl})
})

app.listen(PORT, ()=>{
    console.log("Server is running on: ", PORT);
    
})  