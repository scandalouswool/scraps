var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

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

// Project: find all primes 1,000,000 - 2,000,000

// Function that finds all the primes between two values
var findPrimes = function(min, max) {

  // Little function that tests whether something is a prime
  var primeTester = function(n) {
    for (var i = 2; i < n - 1; i++) {
      if (n % i === 0) {
        return false;
      }
    }
    return true;
  };

  // Loop through range and test if each value is a prime
  var result = [];
  for (var i = min; i <= max; i++) {
    if (primeTester(i)) {
      result.push(i);
    }
  }
  return result;

}

var createJobs = function(functionPiece) {
  var stringifiedFunction = functionPiece.toString();
  console.log(stringifiedFunction);

  for (var i = 1; i < 100000; i = i + 10000) {
    var newJob = {
      func: stringifiedFunction, // This is a stringified function
      data: [i, i + 9999]
    }

    jobs.push(newJob);
  }
}

createJobs(findPrimes);

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

    setTimeout(function() {
      if (currentJob < jobs.length) {
        socket.emit('newjob', assignJob());
      } else {
        console.log('No more jobs available');
      }
    }, 2000);

  });

})

