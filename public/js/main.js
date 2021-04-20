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

        nodeA.addClass('');

        nodeB.addClass('col-1');
        nodeB.append('<h3>' + payload.username +'</h3>');

        nodeC.addClass('col-1');
        var buttonC = makeInviteButton(payload.socket_id);
        nodeC.append(buttonC);

        nodeA.hide();
        nodeC.hide();
        nodeB.hide();

        $('#players').append(nodeA,nodeC,nodeB);
        nodeA.slideDown(1000);
        nodeC.slideDown(1000);
        nodeB.slideDown(1000);

    } else {
        uninvite(payload.socket_id);
        var buttonC = makeInviteButton(payload.socket_id);
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

function invite(who){
    var payload = {};
    payload.requested_user = who;

    console.log('*** Client Log Message: \'invite\' payload: ' + JSON.stringify(payload));
    socket.emit('invite', payload);
}
socket.on('invite_response', function(payload) {
    if (payload.result == 'fail') {
        alert(payload.message);
        return;
    }
    var newNode = makeInvitedButton(payload.socket_id);
    $('.socket_' + payload.socket_id+' button').replaceWith(newNode);
});

socket.on('invited', function(payload) {
    if (payload.result == 'fail') {
        alert(payload.message);
        return;
    }
    var newNode = makePlayButton(payload.socket_id);
    $('.socket_' + payload.socket_id+' button').replaceWith(newNode);
});


function uninvite(who){
    var payload = {};
    payload.requested_user = who;

    console.log('*** Client Log Message: \'uninvite\' payload: ' + JSON.stringify(payload));
    socket.emit('uninvite', payload);
}

socket.on('uninvite_response', function(payload) {
    if (payload.result == 'fail') {
        alert(payload.message);
        return;
    }
    var newNode = makeInviteButton(payload.socket_id);
    $('.socket_' + payload.socket_id+' button').replaceWith(newNode);
});

socket.on('uninvited', function(payload) {
    if (payload.result == 'fail') {
        alert(payload.message);
        return;
    }
    var newNode = makeInviteButton(payload.socket_id);
    $('.socket_' + payload.socket_id+' button').replaceWith(newNode);
});

/* Send a game_start message to the server */
function game_start(who){
    var payload = {};
    payload.requested_user = who;

    console.log('*** Client Log Message: \'game_start\' payload: ' + JSON.stringify(payload));
    socket.emit('game_start', payload);
}

socket.on('game_start_response', function(payload) {
    if (payload.result == 'fail') {
        alert(payload.message);
        return;
    }
    var newNode = makeEngagedButton(payload.socket_id);
    $('.socket_' + payload.socket_id+' button').replaceWith(newNode);

    /* Jump to a new page */
    window.location.href = 'game.html?username='+username+'&game_id='+payload.game_id;
});

function send_message(){
    var payload = {};
    payload.room = chat_room;
    payload.username = username;
    payload.message = $('#send_message_holder').val();
    console.log('*** Client Log Message: \'send_message\' payload: ' + JSON.stringify(payload));
    socket.emit('send_message', payload);
}

socket.on('send_message_response', function(payload) {
    if (payload.result == 'fail') {
        alert(payload.message);
        return;
    }
    var newHTML = '<p><b>' + payload.username + ': </b>' + payload.message + '</p>';
    var newNode = $(newHTML);
    newNode.hide();
    $('#messages').append(newNode);
    newNode.slideDown(1000);
});

function makeInviteButton(socket_id){
    var newHTML = '<button type=\"button\" class=\"btn btn-outline-primary\">Invite</button>';
    var newNode = $(newHTML);
    newNode.click(function(){
        invite(socket_id);
    });
    return newNode;
}

function makeInvitedButton(socket_id){
    var newHTML = '<button type=\"button\" class=\"btn btn-primary\">Invited</button>';
    var newNode = $(newHTML);
    newNode.click(function(){
        uninvite(socket_id);
    });
    return newNode;
}

function makePlayButton(socket_id){
    var newHTML = '<button type=\"button\" class=\"btn btn-secondary\">Play</button>';
    var newNode = $(newHTML);
    newNode.click(function(){
        game_start(socket_id);
    });
    return newNode;
}

function makeEngagedButton(){
    var newHTML = '<button type=\"button\" class=\"btn btn-secondary\">Engage</button>';
    var newNode = $(newHTML);
    return newNode;
}

$(function() {
    var payload = {};
    payload.room = chat_room;
    payload.username = username;

    console.log('*** Client Log Message: \'join_room\' payload: ' + JSON.stringify(payload));
    socket.emit('join_room', payload);

    $('#quit').append('<a href="lobby.html?username="'+username+'" class="btn btn-secondary active" role="button" aria-pressed="true">Quit</a>')
});

var old_board = [
                    ['?','?','?','?','?','?','?','?'],
                    ['?','?','?','?','?','?','?','?'],
                    ['?','?','?','?','?','?','?','?'],
                    ['?','?','?','?','?','?','?','?'],
                    ['?','?','?','?','?','?','?','?'],
                    ['?','?','?','?','?','?','?','?'],
                    ['?','?','?','?','?','?','?','?'],
                    ['?','?','?','?','?','?','?','?']
                ];
var my_color = ' ';

socket.on('game_update', function(payload){
    console.log('*** Client Log Message: \'game_update\' payload: ' + JSON.stringify(payload));
    /* Check for good board update */
    if(payload.result == 'fail'){
        console.log(payload.message);
        window.location.href = 'lobby.html?username=' + username;
        return;
    }

    /* Check for a good board in the payload */
    var board = payload.game.board;
    if('undefined' == typeof board || !board) {
        console.log("Internal error: recieved a malformed board update from the server");
        return;
    }

    /* Update my color */
    if(socket.id == payload.game.player_white.socket){
        my_color = 'white';
    }
    else if(socket.id == payload.game.player_black.socket){
        my_color = 'black';
    }
    else {
        /* Something weird is going on */
        window.location.href = 'lobby.html?username='+username;
        return;
    }
    $('#my_color').html('<h2 id="my_color">I am '+ my_color+'</h2>');
    /* Animate changes to the board */

    var blacksum = 0;
    var whitesum = 0;

    var row,column;
    for(row = 0; row < 8; row++){
        for(column = 0; column < 8; column++){
            if (board[row][column] == 'b'){
                blacksum++;
            }
            if (board[row][column] == 'w'){
                whitesum++;
            }
            /* If a board space has changed */
            if(old_board[row][column] != board[row][column]){
                if(old_board[row][column] == '?' && board[row][column] == ' '){
                    $('#'+row+'_'+column).html('<img src="assets/images/empty.gif" alt="empty square" />');
                }
                else if(old_board[row][column] == '?' && board[row][column] == 'w'){
                    $('#'+row+'_'+column).html('<img src="assets/images/empty_to_white.gif" alt="white square" />');
                }
                else if(old_board[row][column] == '?' && board[row][column] == 'b'){
                    $('#'+row+'_'+column).html('<img src="assets/images/empty_to_black.gif" alt="black square" />');
                }
                else if(old_board[row][column] == ' ' && board[row][column] == 'w'){
                    $('#'+row+'_'+column).html('<img src="assets/images/empty_to_white.gif" alt="white square" />');
                }
                else if(old_board[row][column] == ' ' && board[row][column] == 'b'){
                    $('#'+row+'_'+column).html('<img src="assets/images/empty_to_black.gif" alt="black square" />');
                }
                else if(old_board[row][column] == 'w' && board[row][column] == ' '){
                    $('#'+row+'_'+column).html('<img src="assets/images/white_to_empty.gif" alt="empty square" />');
                }
                else if(old_board[row][column] == 'b' && board[row][column] == ' '){
                    $('#'+row+'_'+column).html('<img src="assets/images/black_to_empty.gif" alt="empty square" />');
                }
                else if(old_board[row][column] == 'b' && board[row][column] == 'w'){
                    $('#'+row+'_'+column).html('<img src="assets/images/black_to_white.gif" alt="white square" />');
                }
                else if(old_board[row][column] == 'w' && board[row][column] == 'b'){
                    $('#'+row+'_'+column).html('<img src="assets/images/white_to_black.gif" alt="black square" />');
                }
                else {
                    $('#'+row+'_'+column).html('<img src="assets/images/error.gif" alt="error" />');
                }
                /* Set up interactivity */
                $('#'+row+'_'+column).off('click');
                if(board[row][column] == ' '){
                    $('#'+row+'_'+column).addClass('hovered_over');
                    $('#'+row+'_'+column).click(function(r,c) {
                        return function(){
                            var payload = {};
                            payload.row = r;
                            payload.column = c;
                            payload.color = my_color;
                            console.log('*** Client Log Message: \'play_token\' payload: ' + JSON.stringify(payload));
                            socket.emit('play_token', payload);
                        };
                    }(row, column));
                }
                else {
                    $('#'+row+'_'+column).removeClass('hovered_over');
                }
            }
        }
    }
    $('#blacksum').html(blacksum);
    $('#whitesum').html(whitesum);

    old_board = board;
});

socket.on('play_token_response', function(payload){
    console.log('*** Client Log Message: \'play_token_response\' payload: ' + JSON.stringify(payload));
    /* Check for good play_token_response */
    if(payload.result == 'fail'){
        console.log(payload.message);
        alert(payload.message);
        return;
    }
});

socket.on('game_over', function(payload){
    console.log('*** Client Log Message: \'game_over\' payload: ' + JSON.stringify(payload));
    /* Check for good play_token_response */
    if(payload.result == 'fail'){
        console.log(payload.message);
        alert(payload.message);
        return;
    }
    /* Jump to a new page */

    $('#game_over').html('<h1>Game Over</h1><h2>'+ payload.who_won+' won!</h2>');
    $('#game_over').append('<a href="lobby.html?username=' +username +'" class= "btn btn-primary" role="button" aria-pressed="true">Return to the Lobby</a>');
});