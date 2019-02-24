const {User} = require("./../models/user");
var authenticate = (req,res,next)=>{
    var token = req.header('x-auth');
    User.findByToken(token).then(user=>{
        if(!user){
            console.log("user nhi mila"); 
            return Promise.reject();
        }
        req.token=token;
        req.user=user;
        next();
    }).catch(e=>{
        res.status(401).send();
    });
}

module.exports={authenticate}