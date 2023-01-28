var page = '';
var ws;
var server = 'wss://' + window.location.host + (window.location.port != '' ? ':' + window.location.port : '') + '/';

let id_data = {
    id: 0
}, domains_data = [], time = 1500;

function close_message(message_container) {
    setTimeout(() => {
        if(!message_container instanceof HTMLElement) return;
        message_container.style.display = 'none';
    }, time);
}

window.onload = async function() {
 wsConnect(server);
 var login = localStorage.getItem('admin_token') ? false : true;
 document.querySelector('#page').innerHTML = await getFileContent('html/' + (login ? 'login' : 'home') + '.html');
 if (login) document.querySelector('#user').focus();
 else await getPage('stats');
}

async function getPage(name) {
 page = name;
 if (document.querySelectorAll('.active').length >= 1) document.querySelectorAll('.active')[0].classList.remove('active');
 document.querySelector('#menu-' + name).classList.add('active');
 document.querySelector('#content').innerHTML = await getFileContent('html/' + name + '.html');
 if (name == 'stats') getStats();
 if (name == 'domains') getDomains();
 if (name == 'users') getUsers();
 if (name == 'aliases') getAliases();
 if (name == 'admins') getAdmins();
 menuHide();
}

function menuShowHide() {
 if (window.matchMedia('(max-width: 1000px)').matches) {
  var menu = document.querySelector('#page #menu');
  menu.style.display = menu.style.display == 'none' ? 'block' : 'none';
 }
}

function menuHide() {
 if (window.matchMedia('(max-width: 1000px)').matches) document.querySelector('#page #menu').style.display = 'none';
}

function login() {
 wsSend({
  command: 'admin_login',
  user: document.querySelector('#user').value,
  pass: document.querySelector('#pass').value
 });
 document.querySelector('#logbutton').onclick = '';
 document.querySelector('#logbutton').style.backgroundColor = '#A0A0A0';
 document.querySelector('#logbutton').innerHTML = '<span class="loader"></span>';
}

async function logout() {
 wsSend({
  command: 'admin_logout',
  token: localStorage.getItem('admin_token')
 });
}

async function addDomain() {
    await getDialog('Add domain', await getFileContent('html/domains_add.html'));
    document.querySelector('#domain_name').focus();
}
async function domainAdd() {
 let domain_name = document.querySelector('#domain_name');
 let add_domain_message = document.querySelector('#add_domain_message');
 wsSend({
  command: 'admin_add_domain',
  name: domain_name.value,
  admin_token: localStorage.getItem('admin_token')
 });
 add_domain_message.style.display = 'block';
 add_domain_message.innerHTML = 'Domain has been added';
 dialogClose();
 close_message(add_domain_message);
 setTimeout(() => {
    getPage('domains')
 }, 2200);
}
async function delDomain(id) {
 wsSend({
  command: 'admin_del_domain',
  id: id,
  admin_token: localStorage.getItem('admin_token')
 });
 add_domain_message.style.display = 'block';
 add_domain_message.innerHTML = 'Domain has been removed';
 domains_data = domains_data.splice(domains_data.indexOf(id), 1)
 console.log('domains_data after splice -> ', domains_data)
 close_message(add_domain_message);
 setTimeout(() => {
    getPage('domains')
 }, time);
}

async function editDomain(id, name) {
 await getDialog('Edit domain', await getFileContent('html/domains_update.html'));
 let updated_name = document.querySelector('#updated_domain_name');
 updated_name.value = name;
 updated_name.focus();
 id_data.id = id;
}
async function domainUpdate() {
 let updated_name = document.querySelector('#updated_domain_name');
 let add_domain_message = document.querySelector('#add_domain_message');
 wsSend({
  command: 'admin_set_domain',
  id: id_data.id,
  name: updated_name.value,
  admin_token: localStorage.getItem('admin_token')
 });
 add_domain_message.style.display = 'block';
 add_domain_message.innerHTML = 'Domain has been updated';
 dialogClose();
 close_message(add_domain_message);
 setTimeout(() => {
    getPage('domains')
 }, time);
}

async function addUser() {
 await getDialog('Add user', await getFileContent('html/users_add.html'));
 document.querySelector('#user_name').focus();
}
async function userAdd() {
 let add_user_message = document.querySelector('#add_user_message');
 let password = document.querySelector('#password');
 let user_name = document.querySelector('#user_name');
 let visible_name = document.querySelector('#visible_name');
 wsSend({
  command: 'admin_add_user',
  domain_id: id_data.id,
  name: user_name.value,
  visible_name: visible_name.value,
  password: password.value,
  admin_token: localStorage.getItem('admin_token')
 });
 add_user_message.style.display = 'block';
 add_user_message.innerHTML = 'User has been added';
 dialogClose();
 close_message(add_user_message);
 setTimeout(() => {
    getPage('users')
 }, time);
}

async function getStats() {
 wsSend({
  command: 'admin_sysinfo', 
  admin_token: localStorage.admin_token
 });
}

async function getDomains() {
 wsSend({
  command: 'admin_get_domains',
  admin_token: localStorage.admin_token
 });
}

setTimeout(() => {
    getDomains()
}, 2000);

async function getUsers(domain_id) {
 id_data.id = domain_id;
 wsSend({
  command: 'admin_get_users',
  domain_id: domain_id,
  admin_token: localStorage.admin_token,
 });
}

async function getAliases() {
 wsSend({
  command: 'admin_get_aliases',
  admin_token: localStorage.admin_token,
  domain_id: document.querySelector('#domains').value
 });
}

async function getAdmins() {
 wsSend({
  command: 'admin_get_admins',
  admin_token: localStorage.admin_token
 });
}

async function getDialog(title, content) {
 var html = translate(await getFileContent('html/dialog.html'), { '{TITLE}': title, '{CONTENT}': content });
 document.querySelector('#page').innerHTML += html;
}

function dialogClose() {
 document.querySelector('.dialog').remove();
}

async function getFileContent(file) {
 var content = await fetch(file, { headers: { 'cache-control': 'no-cache' }});
 return content.text();
}

function wsConnect(address) {
 ws = new WebSocket(address);
 ws.onopen = (e) => { wsOnConnect() };
 ws.onclose = (e) => { wsOnDisconnect() };
 ws.onmessage = async (e) => { wsOnMessage(e.data); };
 ws.onerror = (e) => { wsOnError(e); };
}

function wsOnConnect() {
 document.querySelector('#footer .icon').className = 'icon online';
 document.querySelector('#footer .status').innerHTML = 'Connected';
 document.querySelector('#footer .address').innerHTML = server;
}

function wsOnDisconnect() {
 document.querySelector('#footer .icon').className = 'icon offline';
 document.querySelector('#footer .status').innerHTML = 'Not connected, reconnecting ...';
 wsConnect(server);
}

function wsOnError(error) {
 console.log('WebSocket error:', error);
}

async function wsOnMessage(data) {
//  console.log('FROM SERVER:');
//  console.log(data);
 data = JSON.parse(data);
//  console.log('data......', data);
 if ('error' in data) {
  if (data.error == 'admin_token_invalid') logout();
 } else {
  if (data.command == 'admin_login') setAdminLogin(data);
  if (data.command == 'admin_logout') setAdminLogout(data);
  if (data.command == 'admin_sysinfo') setSysInfo(data);
  if (data.command == 'admin_get_domains') {
   data.data.forEach((item) => {
    domains_data.push(item.id)
   });
   if (page == 'domains') setDomains(data);
   if (page == 'users') setUsersDomains(data);
   if (page == 'aliases') setAliasesDomains(data);
  }
  if (data.command == 'admin_get_users') setUsers(data);
  if (data.command == 'admin_get_aliases') setAliases(data);
  if (data.command == 'admin_get_admins') setAdmins(data);
 }
}

async function wsSend(data) {
 if (ws.readyState === 1) {
//   console.log('TO SERVER:');
//   console.log(data);
  ws.send(JSON.stringify(data));
 }
}

async function setAdminLogin(res) {
 if (res.data.logged) {
  localStorage.setItem('admin_token', res.data.token);
  document.querySelector('#page').innerHTML = await getFileContent('html/home.html');
  await getPage('stats');
 } else {
  var error = document.querySelector('#error');
  error.style.display = 'block';
  error.innerHTML = res.message;
  document.querySelector('#logbutton').onclick = 'login()';
  document.querySelector('#logbutton').style.backgroundColor = 'var(--primary-color)';
  document.querySelector('#logbutton').innerHTML = 'Login';
 }
}

async function setAdminLogout(res) {
 if (!res.data.logged) {
  localStorage.removeItem('admin_token');
  document.querySelector('#page').innerHTML = await getFileContent('html/login.html');
 }
}

function translate(template, dictionary) {
 for (var key in dictionary) template = template.replaceAll(key, dictionary[key]);
 return template;
}

async function setSysInfo(res) {
 document.querySelector('#stats').innerHTML = translate(await getFileContent('html/stats_sysinfo.html'), {
  '{APP}': res.data.app_name + ' v.' + res.data.app_version,
  '{OS}': res.data.os_name + ' ' + res.data.os_version,
  '{HOSTNAME}': res.data.hostname,
  '{UPTIME}': res.data.uptime,
  '{CPU_MODEL}': res.data.cpu_cores + 'x ' + res.data.cpu_model,
  '{CPU_USAGE}': res.data.cpu_load + '%',
  '{RAM_USAGE}': res.data.ram_free + ' / ' + res.data.ram_total,
  '{NETWORK}': res.data.networks
 });
}

async function setDomains(res) {
 var rows = '';
 var rowTemp = await getFileContent('html/domains_row.html');
 domains_data = [...new Set(domains_data)]
 for (var i = 0; i < res.data.length; i++) {
  rows += translate(rowTemp, {
   '{ID}': res.data[i].id,
   '{NAME}': res.data[i].name,
   '{CREATED}': new Date(res.data[i].created).toLocaleString()
  });
 }
 document.querySelector('#domains').innerHTML = rows;
}

async function setUsersDomains(res) {
 var rows = '';
 var rowTemp = await getFileContent('html/users_domains_row.html');
 for (var i = 0; i < res.data.length; i++) {
  rows += translate(rowTemp, {
   '{ID}': res.data[i].id,
   '{NAME}': res.data[i].name
  });
 }
 document.querySelector('#domains').innerHTML = rows;
}

async function setAliasesDomains(res) {
 var rows = '';
 var rowTemp = await getFileContent('html/aliases_domains_row.html');
 for (var i = 0; i < res.data.length; i++) {
  rows += translate(rowTemp, {
   '{ID}': res.data[i].id,
   '{NAME}': res.data[i].name
  });
 }
 document.querySelector('#domains').innerHTML = rows;
}

async function setUsers(res) {
 document.querySelector('#users').innerHTML = '<br/>&emsp;Checking...<br/><br/>';
 var rows = '';
 var rowTemp = await getFileContent('html/users_row.html');
 let domainsSelect = document.querySelector('#select_domains');
 for(let i = 0; i < domains_data.length; i++) {
  let option = document.createElement('option');
  option.value = domains_data[i];
  option.innerHTML = domains_data[i];
  if(domainsSelect.children.length - 1 === domains_data.length) break;
  domainsSelect.append(option);
  console.log('children is', domainsSelect.children);
 }
 for (var i = 0; i < res.data.length; i++) {
  rows += translate(rowTemp, {
   '{ID}': res.data[i].id,
   '{NAME}': res.data[i].name,
   '{VISIBLE_NAME}': res.data[i].visible_name,
   '{PHOTO}': res.data[i].photo,
   '{MESSAGES}': '?',
   '{FILES_SIZE}': '?',
   '{CREATED}': new Date(res.data[i].created).toLocaleString()
  });
 }
 document.querySelector('#users').innerHTML = rows;
}

async function setAliases(res) {
 var rows = '';
 var rowTemp = await getFileContent('html/aliases_row.html');
 for (var i = 0; i < res.data.length; i++) {
  rows += translate (rowTemp, {
   '{ID}': res.data[i].id,
   '{ALIAS}': res.data[i].alias,
   '{MAIL}': res.data[i].mail,
   '{CREATED}': new Date(res.data[i].created).toLocaleString()
  });
 }
 document.querySelector('#aliases').innerHTML = rows;
}

async function setAdmins(res) {
 var rows = '';
 var rowTemp = await getFileContent('html/admins_row.html');
 for (var i = 0; i < res.data.length; i++) {
  rows += translate (rowTemp, {
   '{ID}': res.data[i].id,
   '{USER}': res.data[i].user,
   '{CREATED}': new Date(res.data[i].created).toLocaleString()
  });
 }
 document.querySelector('#admins').innerHTML = rows;
}
