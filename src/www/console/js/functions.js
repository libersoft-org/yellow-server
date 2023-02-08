var ws;
var connected = false;

window.onload = () => {
 document.querySelector('#address').value = 'wss://' + window.location.host + (window.location.port != '' ? ':' + window.location.port : '') + '/';
 if (localStorage.getItem('autoconnect') == 'true') {
  document.querySelector('#autoconnect').innerHTML = 'Disable autoconnect';
  connect();
 }
 document.querySelector('#text').focus();
};

function connect() {
 if (connected) {
  ws.close();
  ws = null;
 } else {
  ws = new WebSocket(document.querySelector('#address').value);
  ws.onopen = (e) => { onConnect() };
  ws.onclose = (e) => { onDisconnect() };
  ws.onmessage = async (e) => { addLog('<span class="text-yellow bold">RECEIVED:</span> ' + e.data); };
  ws.onerror = (e) => { addLog('<span class="text-red bold">ERROR:</span> ' + e.data); };
 }
}

function onConnect() {
 connected = true;
 document.querySelector('#connect').innerHTML = 'Disconnect';
 addLog('<span class="text-green bold">CONNECTED</span>');
}

function onDisconnect() {
 connected = false;
 document.querySelector('#connect').innerHTML = 'Connect';
 addLog('<span class="text-red bold">DISCONNECTED</span>');
}

function send() {
 var textbox = document.querySelector('#text');
 addLog('<span class="text-blue bold">SENT:</span> ' + textbox.value);
 ws.send(textbox.value);
 textbox.value = '';
 textbox.focus();
}

function autoconnect() {
 if (localStorage.getItem('autoconnect') == 'true') {
  localStorage.removeItem('autoconnect');
  document.querySelector('#autoconnect').innerHTML = 'Enable autoconnect';
 } else {
  localStorage.setItem('autoconnect', true);
  document.querySelector('#autoconnect').innerHTML = 'Disable autoconnect';
 }
}

function keypressAddress() {
 if (event.key === 'Enter') connect();
}

function keypressCommand() {
 if (event.key === 'Enter') send();
}

function addLog(message) {
 var output = document.querySelector('#output');
 output.innerHTML += new Date().toLocaleString() + ' - ' + message + '<br />';
 output.scrollTop = output.scrollHeight;
}
