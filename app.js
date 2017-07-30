var express = require("express");
var app = express();
var router = require('./router/router.js');
var session = require('express-session');


app.use(session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true
}));

// 模板引擎
app.set("view engine", "ejs");
// 静态页面
app.use(express.static('./public'));
app.use('/avatar', express.static('./avatar'));
// 路由表
app.get('/', router.showIndex);
app.get('/regist', router.showRegist);
app.post('/doregist', router.doRegist);
app.get('/login', router.showLogin);
app.post('/dologin', router.doLogin);

app.get('/setavatar', router.showSetAvatar);
app.post('/dosetavatar', router.doSetAvatar);

app.get('/cut', router.showCut);

app.get('/docut', router.doCut);

app.post('/post', router.doPost);
app.get('/getallshuoshuo',router.getAllShuoshuo);
app.get('/getuserinfo',router.getUserInfo);
app.get('/gettotal',router.getTotal);
app.get('/user/:username',router.showUser);
app.get('/userlist',router.showUserList);



app.listen(80);