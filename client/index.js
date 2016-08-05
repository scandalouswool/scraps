$(document).ready(function() {

  /************************************************
  // Function that finds primes between two values
  ************************************************/
  var findPrimes = function(min, max) {
    var primeTester = function(n) {
      for (var i = 2; i < n - 1; i++) {
        if (n % i === 0) {
          return false;
        }
      }
      return true;
    };

    var result = [];
    for (var i = min; i <= max; i++) {
      if (primeTester(i)) {
        result.push(i);
      }
    }
    return result;
  }

  /************************************************
  // Socketing
  ************************************************/
  var socket = io();

  var sendReady = function() {
    socket.emit('ready');
  }

  socket.on('newjob', function(job) {
    console.log('Working on new job');
    
    var result = findPrimes(job.data[0], job.data[1]);
    
    console.log('Job complete. Result is: ', result);
    console.log('Sending result back to server');
    socket.emit('jobdone', result);
  });

  socket.on('jobresult', function(result) {
    $('#result').text(result);
  })

  sendReady();

});