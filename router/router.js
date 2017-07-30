var formidable = require("formidable");
var db = require('../models/db.js');
var md5 = require('../models/md5.js');
var session = require('express-session');
var path = require('path');
var fs = require("fs");
var gm = require("gm"); // 需要安装 GraphicsMagick 软件

// 首页
exports.showIndex = function (req, res, next) {
    var avatar = 'moren.jpg';
    // 查询数据库,查找用户的头像
    if (req.session.login === "1") {
        db.find("users", { "username": req.session.username }, function (err, result) {
            avatar = result[0].avatar || 'moren.jpg';
            req.session.avatar = result[0].avatar;
            res.render('index', {
                "login": req.session.login === "1" ? true : false,
                "username": req.session.login === "1" ? req.session.username : '',
                "active": "首页",
                "avatar": avatar
            });
        });
    } else {
        res.render('index', {
            "login": req.session.login === "1" ? true : false,
            "username": req.session.login === "1" ? req.session.username : '',
            "active": "首页",
            "avatar": avatar
        });
    }

}
// 注册页面
exports.showRegist = function (req, res, next) {
    res.render('regist', {
        "login": req.session.login === "1" ? true : false,
        "username": req.session.login === "1" ? req.session.username : '',
        "active": "注册"
    });
}
// 注册业务
exports.doRegist = function (req, res, next) {
    // 得到用户填写的东西
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        // 得到表单
        var username = fields.username;
        // md5加密
        var password = md5(fields.password);
        // 查询数据库
        db.find('users', { "username": username }, function (err, result) {
            // 服务器错误
            if (err) {
                res.send("-3");
                return;
            }
            // 用户名已存在
            if (result.length != 0) {
                res.send("-1");
                return;
            }
            // 插入数据
            db.insertOne('users',
                { "username": username, "password": password, "avatar": "moren.jpg" },
                function (err, result) {
                    if (err) {
                        res.send("-3");
                    }
                    // 注册成功,写入session
                    req.session.login = "1";
                    req.session.username = username;
                    res.send("1");
                });
        });
    });
}

// 登录页面
exports.showLogin = function (req, res, next) {
    res.render("login", {
        "login": req.session.login === "1" ? true : false,
        "username": req.session.login === "1" ? req.session.username : '',
        "active": "登录"
    });
}

// 登录业务
exports.doLogin = function (req, res, next) {
    // 得到用户填写的东西
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        // 得到表单
        var username = fields.username;
        // md5加密
        var password = md5(fields.password);
        // 查询数据库
        db.find('users', { "username": username }, function (err, result) {
            // 服务器错误
            if (err) {
                res.send("-3");
                return;
            }
            // 用户名不存在
            if (result.length === 0) {
                res.send("-1");
                return;
            }
            // 对比密码
            if (password === result[0].password) {
                // 登录成功,写入session
                req.session.login = "1";
                req.session.username = username;
                res.send("1");
            } else {
                // 密码错误
                res.send("-2");
            }

        });
    });
}

exports.showSetAvatar = function (req, res, next) {
    if (req.session.login != "1") {
        // 跳转至登录页面
        res.redirect('/login');
        return;
    }
    res.render("setavatar", {
        "login": true,
        "username": req.session.username,
        "active": "修改头像"
    })
}
// 设置头像
exports.doSetAvatar = function (req, res, next) {
    if (req.session.login != "1") {
        // 跳转至登录页面
        res.redirect('/login');
        return;
    }
    var form = formidable.IncomingForm();
    var uploadPath = path.normalize(__dirname + "/../avatar");
    form.uploadDir = uploadPath;
    form.parse(req, function (err, fields, files) {
        var oldPath = files.touxiang.path;
        var newPath = uploadPath + '/' + req.session.username + '.jpg';
        fs.rename(oldPath, newPath, function (err) {
            if (err) {
                res.send("头像上传失败");
                return;
            }
            req.session.avatar = req.session.username + ".jpg";
            // 跳转裁剪图片页面
            res.redirect('/cut');
        });
    });
}
// 显示裁剪图片页面
exports.showCut = function (req, res, next) {
    if (req.session.login != "1") {
        // 跳转至登录页面
        res.redirect('/login');
        return;
    }
    res.render('cut', {
        "avatar": req.session.avatar
    });
}

// 裁剪图片
exports.doCut = function (req, res, next) {
    if (req.session.login != "1") {
        // 跳转至登录页面
        res.redirect('/login');
        return;
    }
    //这个页面接收几个GET请求参数
    //w、h、x、y
    var filename = req.session.avatar;
    var w = req.query.w;
    var h = req.query.h;
    var x = req.query.x;
    var y = req.query.y;

    gm("./avatar/" + filename)
        .crop(w, h, x, y)
        .resize(100, 100, "!")
        .write("./avatar/" + filename, function (err) {
            if (err) {
                res.send("-1");
                return;
            }
            //更改数据库当前用户的avatar这个值
            db.updateMany("users", { "username": req.session.username }, {
                $set: { "avatar": req.session.avatar }
            }, function (err, results) {
                res.send("1");
            });
        });
}

// 发表说说
exports.doPost = function(req, res, next) {
    if (req.session.login != "1") {
        // 跳转至登录页面
        res.redirect('/login');
        return;
    }
    var username = req.session.username;
    var form = formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var content = fields.content;
        db.insertOne('posts',{"username":username,"content":content,"datetime":new Date()}, function(err, result) {
            if (err) {
                res.send("-1");
                return;
            }
            res.send("1");
        });
    });
}

// 得到所有说说
exports.getAllShuoshuo = function(req, res, next) {
    var page = req.query.page;
    db.find('posts',{}, {"pageCount":3,"page":page,"sort":{"datetime":-1}}, function(err, result) {
        if(err) {
            res.send("-3");
            return;
        }
        res.send(result);
    });
}
// 根据用户名查询用户信息
exports.getUserInfo = function(req, res, next) {
    var username = req.query.username;
    db.find('users',[{"username":username},{"username":1,"_id":1,"avatar":1}], function(err, result) {
        if(err) {
            res.send("-3");
            return;
        }
        res.send(result);
    });
}
// 说说总数量
exports.getTotal = function(req, res, next) {
    db.getAllCount('posts', function(count) {
        res.send(count.toString());
    })
}

// 自己的说说
exports.showUser = function(req, res, next) {
    if (req.session.login != "1") {
        // 跳转至登录页面
        res.redirect('/login');
        return;
    }
    var username = req.session.username;
    var avatar = req.session.avatar;
    db.find('posts', {"username": username}, function(err, result) {
        if(err) {
            res.send("-3");
            return;
        }
        res.render('user', {
            // 头部和我的说说页面需要用到的变量
            'login':true,
            "username":username,
            'user': username,
            'avatar': avatar,
            'cirenshuoshuo':result,
            'active':'我的说说'
        });
    });
    
}

// 所有用户
exports.showUserList = function(req, res, next) {
    if (req.session.login != "1") {
        // 跳转至登录页面
        res.redirect('/login');
        return;
    }
    db.find('users',{}, function(err, result) {
        if(err) {
            res.send("-3");
            return;
        }
        res.render('userlist', {
            // 头部和列表页面需要用到的变量
            'login':true,
            "username":req.session.username,
            'allUser': result,
            'active':'成员列表'
        });
    })
}
