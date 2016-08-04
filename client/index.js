$(document).ready(function() {

  var socket = io();

  var sendReady = function() {
    socket.emit('ready');
  }

  socket.on('newjob', function(job) {
    console.log('Working on new job');
    
    var functionSnippet = eval('(' + job.func + ')');
    var result = functionSnippet(job.data[0], job.data[1]);
    
    console.log('Job complete. Result is: ', result);
    console.log('Sending result back to server');
    socket.emit('jobdone', result);

  });

  setTimeout(sendReady, 2000);

});