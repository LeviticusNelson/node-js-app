/* functions for general use */

/* This function returns the value associated with 'whichParam' on the URL */
function GetURLParameters(whichParam) {
    var pageURL = window.location.search.substring(1);
    var pageURLVariables = pageURL.split('&');
    for (var i = 0; i < pageURLVariables.length; i++) {
        var parameterName = pageURLVariables[i].split('=');
            if(parameterName[0] == whichParam) {
                return parameterName[1];
            }
    }
}

var username = GetURLParameters('username');
if('undefined' == typeof username || !username) {
    username = 'Anonymous_' + Math.random();
}

var chat_room = GetURLParameters('game_id');
if ('undefined' == typeof chat_room || !chat_room) {
    chat_room = 'lobby';
}

/* connect to the socket server */

var socket = io.connect();

/* What to do when the server sends me a log message */
socket.on('log', function(array) {
    console.log.apply(console,array);
});

/* What to do when the server responds that someone joined the room */
socket.on('join_room_response', function(payload) {
    if (payload.result == 'fail') {
        alert(payload.message);
        return;
    }
    /* If we are being notified that we joined the room, then ignore it */
    if (payload.socket_id == socket.id) {
        return;
    }

    /* If someone joined the room then add a new row to the lobby table */
    var dom_elements = $('.socket_' + payload.socket_id);
    
    /* If we don't already have an entry for this person */
    if(dom_elements.length == 0) {
        var nodeA = $('<div></div>');
        nodeA.addClass('socket_' + payload.socket_id);

        var nodeB = $('<div></div>');
        nodeB.addClass('socket_' + payload.socket_id);

        var nodeC = $('<div></div>');
        nodeC.addClass('socket_' + payload.socket_id);

        nodeA.addClass('w-100');

        nodeB.addClass('col-1 text-left');
        nodeB.append('<h3>' + payload.username +'</h3>');

        nodeC.addClass('col data-align-left');
        var buttonC = makeInviteButton();
        nodeC.append(buttonC);

        nodeA.hide();
        nodeB.hide();
        nodeC.hide();

        $('#players').append(nodeA,nodeB,nodeC);
        nodeA.slideDown(1000);
        nodeB.slideDown(1000);
        nodeC.slideDown(1000);

    } else {
        var buttonC = makeInviteButton();
        $('.socket_' +payload.socket_id+' button').replaceWith(buttonC);
        dom_elements.slideDown(1000);
    }

    /* Manage the message that a new player has joined */
    var newHTML = '<p>' +  payload.username + ' just entered the lobby</p>';
    var newNode = $(newHTML);
    newNode.hide();
    $('#messages').append(newNode);
    newNode.slideDown(1000);
});

/* What to do when the server responds that someone left the room */
socket.on('player_disconnected', function(payload) {
    if (payload.result == 'fail') {
        alert(payload.message);
        return;
    }
    /* If we are being notified that we left the room, then ignore it */
    if (payload.socket_id == socket.id) {
        return;
    }

    /* If someone left the room then animate out all their content */
    var dom_elements = $('.socket_' + payload.socket_id);
    
    /* If something exists */
    if(dom_elements.length != 0) {
        dom_elements.slideUp(1000);
    }

    /* Manage the message that a player has left */
    var newHTML = '<p>' +  payload.username + ' just left the lobby</p>';
    var newNode = $(newHTML);
    newNode.hide();
    $('#messages').append(newNode);
    newNode.slideDown(1000);
});

socket.on('send_message_response', function(payload) {
    if (payload.result == 'fail') {
        alert(payload.message);
        return;
    }
    $('#messages').append('<p><b>' + payload.username + ': </b>' + payload.message + '</p>');
});


function send_message(){
    var payload = {};
    payload.room = chat_room;
    payload.username = username;
    payload.message = $('#send_message_holder').val();
    console.log('*** Client Log Message: \'send_message\' payload: ' + JSON.stringify(payload));
    socket.emit('send_message', payload);
}

function makeInviteButton(){
    var newHTML = '<button type=\"button\" class=\"btn btn-outline-primary\">Invite</button>';
    var newNode = $(newHTML);
    return newNode;
}

$(function() {
    var payload = {};
    payload.room = chat_room;
    payload.username = username;

    console.log('*** Client Log Message: \'join_room\' payload: ' + JSON.stringify(payload));
    socket.emit('join_room', payload);
});