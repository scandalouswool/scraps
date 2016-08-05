var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var timers = require('node-timers');
var _ = require('lodash');

app.use(express.static(__dirname + '/../client'));

server.listen(8000, function() {
  console.log('Now listening on port 8000');
});

/************************************************
// Worker Handlers
************************************************/
var workers = {};
var workersCount = 0;
var currentJob = 0;
var jobs = [];
var result = [];
var myTimer = timers.simple();

var createJobs = function() {
  // Hard-coded find primes up to one million, split between ten jobs
  for (var i = 1; i < 1000000; i = i + 100000) {
    startIndex = i
    var newJob = {
      data: [i, i + 99999]
    }
    jobs.push(newJob);
  }
}

createJobs();

var addWorker = function() {
  if (workersCount === 0) {
    myTimer.start();
  }
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
    _.flatten(result);
    //console.log('The final result is: ', result);
    return;
  } else {
    return job;
  } 
};

var resolveJob = function(data) {
  console.log('Processing result received from worker');
  result.push(data);
};

/************************************************
// Web Socket Handlers
************************************************/
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

    if (currentJob < jobs.length) {
      socket.emit('newjob', assignJob());
    } else {
      io.emit('jobresult', 'Your time is: ' + myTimer.time());
      console.log('No more jobs available');
    }

  });

})

