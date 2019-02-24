var mongoose =require('mongoose');
var validator = require('validator');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var _ = require('lodash');
var UserSchema=new mongoose.Schema({
    email:{
        type: String,
        required: true,
        minlength: 1,
        trim: true,
        unique: true,
        validate:{
            validator: (value)=>{
                return validator.isEmail(value); }}
        },
    password:{
        type:String,
        required: true,
        minlength: 6,
    },
    
    tokens: [{
        access:{ type:String, required: true},
        token:{type:String, required:true}
    }]
});

UserSchema.methods.generateAuthToken= function(){
    var user= this;
    var access='auth';
    var token=jwt.sign({_id:user._id.toHexString(),access}, '123abc' ).toString();
    user.tokens=user.tokens.concat([{access,token}]);
    return user.save().then(token=>{
        console.log("token added");
        return {token,user};
    });
};

UserSchema.statics.findByToken= function(token){
    var User =this;
    var decoded;
    try{
        decoded=jwt.verify(token, '123abc');
    }
    catch(e){
        return Promise.reject();
    }
    return User.findOne({_id: decoded._id,
    "tokens.token" : token,
    "tokens.access" : 'auth'});
};

// UserSchema.pre('save', function(next){
//     var user =this;
//     if(user.isModified('password')){
//         bcrypt.genSalt(10,(salt,err)=>{
//             bcrypt.hash(user.password,salt,(err,hash)=>{
//                 user.password=hash;
//                 next();
//             });      
//         });
//     }
//     else next();
// });

UserSchema.pre('save', function(next){
    var user = this;
    if(user.isModified('password')){
        hashedPassword = bcrypt.hashSync(user.password, 10);
        user.password=hashedPassword;
        next();
    }
    else{next();}
});

UserSchema.statics.findByCredentials=function(email,password){
    var User =this;
    return User.findOne({email}).then(user=>{
        console.log("inside then call of findByCredentials");
        if(!user){console.log("no user");
            return Promise.reject();}
        return new Promise((resolve,reject)=>{
            console.log("inside new promise");
            // bcrypt.compare(password, user.password,(res,err)=>{
            //     console.log("inside compare");
            //     if(res){
            //         resolve(user);
            //     }
            //     else {console.log("rejecting");reject();}

            if(bcrypt.compareSync(password,user.password)){resolve(user);}
            else{ console.log("rejecting");reject();}
            });
        });
}

UserSchema.methods.removeToken=function(token){
    var user =this;
    return user.update({$pull:{tokens:{token}}});
}

var User=mongoose.model('User', UserSchema);

module.exports ={
    User
};