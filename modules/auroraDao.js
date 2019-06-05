var mysql = require('mysql');

var con = mysql.createConnection({
  host: "127.0.0.1",
  user: "youser",
  password: "passtheword",
  port: "3307"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});