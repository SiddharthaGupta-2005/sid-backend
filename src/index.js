
import connectDB from "./db/index.js";
import dotenv from "dotenv"

dotenv.config({path:'./env'})
connectDB

const port = process.env.PORT || 8000 
connectDB()
.then(()=>{
    app.listen(port, ()=> {
        console.log(`Server is running on port ${port}`);
    
    })
})
.catch((error)=>{
    console.log("MongoDB connection failed: ",error);
    
})
// const app = express()
// (async()=>{
//     try {
//       await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//         app.on("error",(error) =>{
//             console.log("err: ",error);
//             throw error
//         })
//         app.listen(()=>{
//             console.log(`App is listening on PORT: ${process.env.PORT}`);
            
//         }
//         )
//     } catch (error) { 
//         console.log("Error:",error)
//     }
// }
// )()