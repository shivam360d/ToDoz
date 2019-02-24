var express = require('express');
var bodyParser = require('body-parser');
const _ = require('lodash');

var {ObjectID} = require('mongodb');
var {ToDo} = require('./models/todos');
var {User} = require('./models/user');
var {mongoose} = require('./db/mongoose');
var {authenticate} =require('./middleware/authenticate');
var app = express();

//creating a json type middleware 
app.use(bodyParser.json());

app.get('/todos',authenticate,(req,res)=>{
    ToDo.findOne({_creator:req.user._id}).then( doc=>{
        res.status(200).send({doc});
    }, e=>{ res.status(404).send(e)})
});

app.get('/todos/:id',authenticate, (req,res)=>{
    var id =req.params.id;
    if(!ObjectID.isValid(id)){
        return res.status(404).send(e);
    }
    ToDo.findOne({_id:id,_creator:req.user._id}).then( doc=>{
        if(doc){
            return res.status(200).send({doc});
        }
    }).catch(e=>{
        res.status(404).send();
    });
});

app.delete('/todos/:id',authenticate, (req,res)=>{
    var id = req.params.id;
    if(!ObjectID.isValid(id)){
      return res.status(404).send("enter valid id");
    }
    ToDo.findOneAndRemove({_id:id,_creator:req.user._id}).then(doc=>{
        if(!doc){
             return res.status(400).send('no such doc found');
        }
        res.status(200).send({doc});
    }).catch(e=>{
        res.status(404).send();
    });
});

app.patch('/todos/:id',authenticate, (req,res)=>{
    var id =req.params.id;
    var body =_.pick(req.body, ['text','completed']);

    if(_.isBoolean(body.completed) && body.completed){
        body.completedAt = new Date().getTime();
    }
    else{
        body.completedAt = null;
        body.completed = false;
    }
    ToDo.findOneAndUpdate({_id:id,_creator:req.user._id}, {$set: body}, {new:true}).then(doc=>{
        res.status(200).send();
    }).catch(e=>{
        res.status(404).send();
    });
});

app.post('/todos',authenticate, (req,res)=>{
    console.log(req.body);
    var todo = new ToDo({
        text: req.body.text,
        _creator: req.user._id
    });
    todo.save().then( doc=>{
        res.send({doc});
    }, e=>{
        res.status(400).send(e);
    });

}, e=>{

    console.log('error occured', e);
});

app.post('/users', (req,res)=>{
    console.log("hello");
    var body=_.pick(req.body,['email', 'password']);
    var user = new User({email:body.email,password:body.password});
    user.save().then(()=>{
        console.log('saved successfully');
        user.generateAuthToken();
    }).then((token)=>{
        res.header('x-auth', token).send(user);
        console.log('just before catch');
    }).catch(e=>{
        console.log("error");
        res.status(404).send(e);
    });
});

app.get('/users/me', authenticate, (req,res)=>{
    res.send(req.user);
});

app.post('/users/login', (req,res)=>{
    User.findByCredentials(req.body.email,req.body.password).then(user=>{
        console.log("after verifying credentiLS");
        user.generateAuthToken();
    }).then((token,user)=>{
        console.log("getting token back");
        res.header('x-auth', token).send(user);
        console.log('just before catch');
    }).catch(e=>{
        console.log("error");
        res.status(404).send();
    });
});


app.delete("/users/me/token",authenticate, (req,res)=>{
    req.user.removeToken(req.token).then(()=>{
        res.status(200).send();
    },e=>{
        res.status(404).send();
    });
});

app.listen( 3000 , ()=>{
    console.log('started server on localhost');
});