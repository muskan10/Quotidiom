var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
  
mongoose.connect("mongodb://localhost:27017/dictionaryDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

var UserSchema = new Schema({  
    username : {type: String, unique: true, required:true},
    userpassword :{
        type: String
    },
    learntWords: {
        type: Array,
        default: []
    }
});
  
// plugin for passport-local-mongoose
UserSchema.plugin(passportLocalMongoose);
  
// export userschema
 module.exports = mongoose.model("User", UserSchema);