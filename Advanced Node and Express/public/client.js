$(document).ready(function () {
  /* Global io */
let socket = io();

socket.on('user count', (data) => { // executed upon connection to the app
  console.log(data); // client's console should have the currentUsers
});

// Form submittion with new message in field with id 'm'
$('form').submit(function () {
  var messageToSend = $('#m').val();

  $('#m').val('');
  return false; // prevent form submit from refreshing page
});
});
