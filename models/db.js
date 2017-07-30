var MongoClient = require('mongodb').MongoClient;
var settings = require("../settings.js");

function _connectDB(callback) {
    var url = settings.dburl;  
    //连接数据库
    MongoClient.connect(url, function (err, db) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(err, db);
    });
}

init();

function init(){
    //对数据库进行一个初始化
    _connectDB(function(err, db){
        if (err) {
            console.log(err);
            return;
        }
        db.collection('users').createIndex(
            { "username": 1},
            null,
            function(err, results) {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log("索引建立成功");
            }
        );
    });
}


// 插入数据
exports.insertOne = function(collectionName, json, callback) {
    _connectDB(function(err, db) {
        if(err) {
            callback(err, null);
            return;
        }
        db.collection(collectionName).insertOne(json, function (err, result) {
            callback(err, result);
            db.close();// 关闭数据库
        })
    });
}

// 查询 
// db.find('teacher',{},{"pageCount":5,"page":page},function(err, result) {})
// (json 有返回具体字段时是数组,其他是对象)
// db.find('users',[{},{"username":1,"datatime":1,"_id":1}], {"username":username}, function(err, result) {
exports.find = function(collectionName, json, args, callback) {
    var result =[]; // 存放数据结果
    var skip = 0;
    var limit = 0;
    var sort ={};
    var para ={};
    var cursor;
    if(arguments.length === 3) {
        callback = args;
    } else if(arguments.length === 4) {
        skip = parseInt(args.pageCount * (args.page - 1));
        limit = parseInt(args.pageCount);
        sort = args.sort || {};
    } else {
        throw new Error("参数有误!");
    }
    
    _connectDB(function(err, db) {
        if(Array.isArray(json)) {
            cursor = db.collection(collectionName).find(json[0],json[1]).limit(limit).skip(skip).sort(sort);
        }else {
            cursor = db.collection(collectionName).find(json).limit(limit).skip(skip).sort(sort);
        }
        
        cursor.each(function(err, doc) {
            if(err) {
                callback(err,null);
            }
            if (doc != null) {
                result.push(doc);
            } else {
                callback(err, result);
                db.close();// 关闭数据库
            }
        });
    });
}

// 删除
exports.deleteMany = function(collectionName, json, callback) {
    _connectDB(function(err, db) {
        db.collection(collectionName).deleteMany( json, function(err, results) {
            callback(err, results);
            db.close();// 关闭数据库
        });
    });
}

// 更新
exports.updateMany = function(collectionName,json, setJson, callback) {
    
    _connectDB(function(err, db) {
        db.collection(collectionName).updateMany(
        json,
        setJson,
        function(err, results) {
            callback(err, results);
            db.close();
        });
    });
}

//得到总数量
exports.getAllCount = function (collectionName,callback) {
    _connectDB(function (err, db) {
        db.collection(collectionName).count({}).then(function(count) {
            callback(count);
            db.close();
        });
    })
}