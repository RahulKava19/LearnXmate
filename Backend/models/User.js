const mangoose = require("mongoose");

const userSchema = new mangoose.Schema({
    id:
    {
        type : Number,
        required :true,
        unique : true
    },
    name:
    {
        type : String,
        required : true
    },
    email:{
        type : String,
        required : true,
        unique : true, 
        trim : true,
        lowercase : true
    },
    password:{
        type : String,
        required : true
    },
    role:
    {
        type : String,
        enum : ['student', 'teacher'],
        required : true
    }
},
{
    timestamps : true
}
);
//first we always create a schema and then we create a model from that schema. The model is what we use to interact with the database.

const User = mangoose.model("User", userSchema);

module.exports = User;