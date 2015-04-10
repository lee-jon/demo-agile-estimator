var express= require('express')
var app    = express();
var server = require('http').Server(app);
var io     = require('socket.io')(server);
var port   = process.env.PORT || 5000;

server.listen(port);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static('public'));

var usernames = {}
var estimates = {}

io.on('connection', function(socket){
  socket.on('adduser', function(username){
    console.log('CONNECTION ' + username);

    socket.username = username;
    usernames[username] = username;

    socket.emit('updatechat', 'SERVER', 'You have connected', 'update');
    socket.broadcast.emit('updatechat', socket.username, ' has joined the chat', 'user_change');
    io.sockets.emit('updateusers', usernames);
  });

  socket.on('disconnect', function(){
    console.log('DISCONNECTION ' + socket.username);

    delete usernames[socket.username];
    delete estimates[socket.username];
    io.sockets.emit('updateusers', usernames);
    io.sockets.emit('updateestimates', estimates);
    socket.broadcast.emit('updatechat', socket.username, ' has disconnected', 'user_change');
  });

  socket.on('sendchat', function(data){
    console.log('CHAT ' + socket.username + " says - " + data);

    io.sockets.emit('updatechat', socket.username, data, 'chat');
  });

  socket.on('estimate', function(estimate){
    console.log(socket.username + ' has estimated ' + estimate)

    estimates[socket.username] = estimate

    socket.emit('updatechat', 'SERVER', 'You sent an estimate', 'update');
    socket.broadcast.emit('updatechat', socket.username, 'sent an estimate', 'estimate');

    io.sockets.emit('updateestimates', Object.keys(estimates));
  });

  socket.on('reveal estimates', function(){
    console.log(socket.username + ' requested reveal');
    socket.emit('updatechat', 'SERVER', 'You requested a reveal', 'update');
    socket.broadcast.emit('updatechat', socket.username, ' requested a reveal of cards', 'estimate');
    io.sockets.emit('reveal', estimates);

    estimates = {}
  });
});
