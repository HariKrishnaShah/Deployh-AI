const db = require("./db.js");
db.connectToDB();
const express = require("express");
const app = express();
var cors = require("cors");
const port = 4000;
app.use(cors());
app.use(express.json());
const allroutes = require("./routes/allroutes.js");
app.use("/", allroutes);
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});

app.listen(port, ()=>
{
    console.log(`Listening at port: http://localhost:${port}`);
})

