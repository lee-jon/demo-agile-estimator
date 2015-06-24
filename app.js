var express  = require('express')
var app      = express();
var sanitizeHTML = require('sanitize-html');
var server   = require('http').Server(app);
var io       = require('socket.io')(server);
var port     = process.env.PORT || 5000;
var rooms    = {}
var allowedEstimates = [ 0, 1, 2, 3, 5, 8,
                         13, 20, 40, 100 ]

// Webserver parts
//
server.listen(port);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/:id', function(req,res){
  res.sendFile(__dirname + '/room.html');
});

app.use(express.static('public'));


// Handling socket events
//
io.on('connection', function(socket){

  socket.on('join', function(room){
    if( (room in rooms) == false) {
      console.log('NEW ROOM ' + room);
      rooms[room] = { estimates: {}, usernames: {} }
    };

    socket.room = room;
    socket.join(room);
  });

  socket.on('adduser', function(username){
    if (username == null || username === "") {
      username = 'Guest' + Math.floor((Math.random() * 10000000) + 1);
    } else {
      username = cleanString(username);
    }

    console.log('CONNECTION of user: ' + username + ', to room: ' + socket.room);

    socket.username = username;
    rooms[socket.room]['usernames'][username] = username;

    socket.emit('updatechat', 'SERVER', 'You have connected to ' + socket.room + ' as ' + socket.username, 'update');
    socket.to(socket.room).broadcast.emit('updatechat', socket.username, ' has joined the chat', 'user_change');
    socket.to(socket.room).emit('updateestimates', Object.keys(rooms[socket.room]['estimates']));
    io.sockets.to(socket.room).emit('updateusers', rooms[socket.room]['usernames']);
  });

  socket.on('disconnect', function(){
    console.log('DISCONNECTION of user ' + socket.username);

    delete rooms[socket.room]['usernames'][socket.username];
    delete rooms[socket.room]['estimates'][socket.username];

    io.sockets.to(socket.room).emit('updateusers', rooms[socket.room]['usernames']);
    io.sockets.to(socket.room).emit('updateestimates', Object.keys(rooms[socket.room]['estimates']));
    socket.broadcast.to(socket.room).emit('updatechat', socket.username, ' has disconnected', 'user_change');

    if( Object.keys(rooms[socket.room]['usernames']).length === 0) {
      console.log('DELETING ROOM: ' + socket.room);
      delete rooms[socket.room];
    }
  });

  socket.on('sendchat', function(data){
    data = cleanString(data);

    console.log('CHAT ' + socket.username + " says - " + data);

    io.sockets.to(socket.room).emit('updatechat', socket.username, data, 'chat');
  });

  socket.on('estimate', function(estimate){
    if (allowedEstimates.indexOf(estimate) == -1) {
      console.log(socket.username + 'submitted an invalid estimate of:' + estimate);
      socket.emit('updatechat', 'SERVER', cleanString(estimate) + ' is not valid', 'update');
      return
    }

    console.log(socket.username + ' has estimated ' + estimate)

    rooms[socket.room]['estimates'][socket.username] = estimate
    socket.to(socket.room).emit('updatechat', 'SERVER', 'You sent an estimate', 'update');
    socket.to(socket.room).broadcast.emit('updatechat', socket.username, 'sent an estimate', 'estimate');

    io.sockets.to(socket.room).emit('updateestimates', Object.keys(rooms[socket.room]['estimates']));
  });

  socket.on('reveal estimates', function(){
    console.log(socket.username + ' requested reveal');
    socket.emit('updatechat', 'SERVER', 'You requested a reveal', 'update');
    socket.broadcast.to(socket.room).emit('updatechat', socket.username, ' requested a reveal of cards', 'estimate');
    io.sockets.to(socket.room).emit('reveal', rooms[socket.room]['estimates']);

    rooms[socket.room]['estimates'] = {}
  });
});

// Plain old JavaScript functions
//
function cleanString(input){
  var output = sanitizeHTML(input, {
    allowedTags: [ ],
  });

  if(input != output) {
    console.log('Input sanitized: ' + input + ' - TO: ' + output)
  }

  return output
}
