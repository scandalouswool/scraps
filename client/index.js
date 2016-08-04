$(document).ready(function() {

  var socket = io();

  var sendReady = function() {
    socket.emit('ready');
  }

  socket.on('newjob', function(job) {
    console.log('Working on new job:', job);
    var result = job.data[0] + job.data[1];
    console.log('Job complete. Result is: ', result);
  });

  setTimeout(sendReady, 2000);

});