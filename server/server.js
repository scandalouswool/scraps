// var express = require('express');
// var socket = require('socket.io');
// var http = require('http');

// var app = express();
// var server = http.createServer(app);
// var io = socket.listen(server);
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static(__dirname + '/../client'));

server.listen(8000, function() {
  console.log('Now listening on port 8000');
});

// Worker Handlers

var workers = {};
var workersCount = 0;

// Project: find all primes 1,000,000 - 2,000,000
var currentJob = 0;
var jobs = [];
var result = [];

var createJobs = function() {
  for (var i = 0; i < 10; i++) {
    var newJob = {
      data: [i, i + 1]
    }

    jobs.push(newJob);
  }
}

createJobs();

var addWorker = function() {
  var worker = {
    id: workersCount
  }

  workers[workersCount] = worker;
  workersCount++;
  console.log('On add, current workers:', workers);
  return worker;
};

var removeWorker = function(workerId) {
  console.log('Worker left, id:', workerId);
  delete workers[workerId];
  console.log('On remove, current workers:', workers);
  // TODO: reassign job of dead workers
};

var assignJob = function() {
  var job = jobs[currentJob];
  currentJob++;

  if (job === undefined) {
    console.log('No more jobs available');
    console.log('The final result is:', result);
    return;
  } else {
    return job;
  } 
};

var resolveJob = function(data) {
  console.log('Processing result received from worker');
  result.push(data);
};

// Web Socket Handlers
io.on('connect', function(socket) {
  console.log('User connected');
  var thisWorker = null;

  socket.on('ready', function() {
    thisWorker = addWorker();
    console.log(thisWorker.id + ' is ready');
  
    socket.emit('newjob', assignJob());
  });

  socket.on('disconnect', function() {
    if (thisWorker) {
      console.log('Trying to remove', thisWorker.id);
      removeWorker(thisWorker.id);
    }
  });

  socket.on('jobdone', function(data) {
    console.log('Received result from ', thisWorker.id, ': ', data);

    resolveJob(data);
    console.log('Result so far is', result);

    setTimeout(function() {
      if (currentJob < jobs.length) {
        socket.emit('newjob', assignJob());
      } else {
        console.log('No more jobs available');
      }
    }, 2000);

  });

})

