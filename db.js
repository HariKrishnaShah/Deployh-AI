require("dotenv").config();
const mongoose = require("mongoose");
const connectToDB = ()=>
{
    mongoose.connect(process.env.DbUrl);
}
module.exports = {connectToDB};