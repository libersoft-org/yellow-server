var page = '', host = '';
var ws;
if(window.location.host.includes(window.location.port)) host = window.location.host.split(':' + window.location.port)[0];
else host = window.location.host;
var server = 'wss://' + host + (window.location.port !== '' ? ':' + window.location.port : '') + '/';

let idData = {
    id: 0,
    secondary_id: 0
}, domainsData = [], usersInDomain = [], time = 700, item_name = '', label = '', active_domain = '', active_admin = '',
tips_for_strings = { 
   "message": "\n\nHere are a few tips:\n-Do not start or end a name with a dot\n-Do not include whitespaces in names\n-Ensure domain is active\n-Do not include special characters in domain name" },
formattedMessage = tips_for_strings.message.replace(/\n/g, "<br>");
function DateFormat(dateString) {
 try {
  var date = new Date(dateString + ' UTC');
  return date.toISOString().toLocaleString();
 } catch(e) {
   return dateString.toLocaleString();
 }
}
 
function focusErr() {
   return document.querySelector("#mx-btn") ? document.querySelector("#mx-btn").focus() : null;
}
let btn = document.querySelector("#add-user") || document.querySelector("#add-alias");

window.onload = async function() {
 if(window.location.port) return wsOnDisconnect();
 wsConnect(server);
 let page_ = '';
 var login = localStorage.getItem('admin_token') ? false : true;
 if(window.location.pathname.split('webadmin/')[1]) page_ = window.location.pathname.split('webadmin/')[1]
 else page_ = 'stats';
 document.querySelector('#page').innerHTML = await getFileContent('html/' + (login ? 'login' : 'home') + '.html');
 replaceWindowState('/webadmin/' + page_);
 if (login) document.querySelector('#user').focus();
 else getPage(page_);
}

function replaceWindowState(url) {
   return window.history.replaceState(null, null, url);
}

function setOptions() {
 let domainsSelect = document.querySelector('#select_domains');
 for (let i = 0; i < domainsData.length; i++) {
  let option = document.createElement('option');
  option.value = domainsData[i].name;
  option.innerHTML = domainsData[i].name;
  if(domainsSelect) {
   if(domainsSelect.children.length - 1 === domainsData.length) break;
   const option_already = domainsSelect.querySelector(`option[value="${domainsData[i].name}"]`);
   option_already ? false : domainsSelect.append(option);
  }
 }
}

async function getPage(name) {
 page = name;
 if (document.querySelectorAll('.active').length >= 1) document.querySelectorAll('.active')[0].classList.remove('active');
 document.querySelector('#menu-' + name).classList.add('active');
 document.querySelector('#content').innerHTML = await getFileContent('html/' + name + '.html');
 if (name === 'stats') {
  replaceWindowState("/webadmin/stats");
  setTimeout(() => {
   getStats();
  }, time);
 }
 if (name === 'domains') {
  replaceWindowState("/webadmin/domains");
  setTimeout(() => {
   getDomains();
  }, time);
 }
 if (name === 'users') {
  replaceWindowState("/webadmin/users");
  setTimeout(() => {
   getUsers(active_domain);
  }, time);
 }
 if (name === 'aliases') {
  replaceWindowState("/webadmin/aliases");
  setTimeout(() => {
   getAliases(active_domain);
  }, time);
 }
 if (name === 'admins') {
  replaceWindowState("/webadmin/admins");
  setTimeout(() => {
   getAdmins();
  }, time);
 }
 menuHide();
}

function menuShowHide() {
   if (window.matchMedia('(max-width: 1000px)').matches) {
    var menu = document.querySelector('#page #menu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
   }
}

function menuHide() {
 if (window.matchMedia('(max-width: 1000px)').matches) document.querySelector('#page #menu').style.display = 'none';
}
window.addEventListener("resize", function(event) {
   if (window.matchMedia('(max-width: 1000px)').matches) document.querySelector('#page #menu').style.display = 'none';
   else document.querySelector('#page #menu').style.display = 'block';
});

function login() {
 document.querySelector('#login').setAttribute('onsubmit', '');
 document.querySelector('#logbutton-label').style.cursor = 'default';
 wsSend({
  command: 'admin_login',
  user: document.querySelector('#user').value,
  pass: document.querySelector('#pass').value
 });
 document.querySelector('#logbutton-label').style.backgroundColor = '#A0A0A0';
 document.querySelector('#logbutton-label').innerHTML = "<span class = 'loader'></span>";
}

async function logout() {
 wsSend({
  command: 'admin_logout',
  token: localStorage.getItem('admin_token')
 });
}

async function editAdmin(id, name) {
 await getDialog('Edit admin', await getFileContent('html/admin_update.html'));
 let updated_name = document.querySelector('#updated_admin_name');
 let updated_password = document.querySelector('#updated_admin_pass');
 updated_name.value = name;
 updated_name.focus();
 idData.id = id;
}

async function adminUpdate() {
 document.querySelector("#err_msg").innerHTML = '';
 let updated_name = document.querySelector('#updated_admin_name');
 let updated_password = document.querySelector('#updated_admin_pass');
 item_name = updated_name.value;
 wsSend({
  command: 'admin_set_admin',
  id: idData.id,
  name: updated_name.value,
  pass: updated_password.value,
  admin_token: localStorage.getItem('admin_token')
 });
//  dialogClose();
}

async function delAdminDialog(id, name) {
 idData.secondary_id = id;
 item_name = name;
 await getDialog('Delete Admin ' + id, translate(await getFileContent('html/admin_delete.html'), { '{NAME}': name }));
 focusErr();
}

async function delAdmin() {
   wsSend({
    command: 'admin_del_admin',
    id: idData.secondary_id,
    admin_token: localStorage.getItem('admin_token')
   });
   if(active_admin === idData.secondary_id) {
      localStorage.removeItem('admin_token');
      window.location.reload();
   }
}

async function addDomain() {
    await getDialog('Add domain', await getFileContent('html/domain_add.html'));
    document.querySelector('#domain_name').focus();
}
async function domainAdd() {
 document.querySelector("#err_msg").innerHTML = '';
 let domain_name = document.querySelector('#domain_name');
 item_name = domain_name.value;
 wsSend({
  command: 'admin_add_domain',
  name: domain_name.value,
  admin_token: localStorage.getItem('admin_token')
 });
//  dialogClose();
}

async function delDomainDialog(id, name) {
 idData.id = id;
 item_name = name;
 await getDialog('Delete domain ' + id, translate(await getFileContent('html/domain_delete.html'), { '{NAME}': name }));
 focusErr();
}

async function delDomain() {
 wsSend({
  command: 'admin_del_domain',
  id: idData.id,
  admin_token: localStorage.getItem('admin_token')
 });
//  dialogClose()
 domainsData.splice(domainsData.indexOf(idData.id), 1)
}

async function editDomain(id, name) {
 await getDialog('Edit domain', await getFileContent('html/domain_update.html'));
 let updated_name = document.querySelector('#updated_domain_name');
 updated_name.value = name;
 updated_name.focus();
 idData.id = id;
}

async function domainUpdate() {
 document.querySelector("#err_msg").innerHTML = '';
 let updated_name = document.querySelector('#updated_domain_name');
 item_name = updated_name.value;
 wsSend({
  command: 'admin_set_domain',
  id: idData.id,
  name: updated_name.value,
  admin_token: localStorage.getItem('admin_token')
 });
//  dialogClose();
}

async function delAliasDialog(id, name) {
 idData.id = id;
 item_name = name;
 await getDialog('Delete user ' + id, translate(await getFileContent('html/alias_delete.html'), { '{NAME}': name }));
 focusErr();
}

async function delAlias() {
 wsSend({
  command: 'admin_del_aliases',
  id: idData.id,
  admin_token: localStorage.getItem('admin_token')
 });
//  dialogClose()
}

async function addUser() {
 await getDialog('Add user', await getFileContent('html/user_add.html'));
 document.querySelector('#user_name').focus();
}
async function userAdd() {
 document.querySelector("#err_msg").innerHTML = '';
 let password = document.querySelector('#password');
 let user_name = document.querySelector('#user_name');
 let visible_name = document.querySelector('#visible_name');
 item_name = user_name.value;
 if(idData.id === undefined) {
   await getDialog('Add User Error', await getFileContent('html/error_message.html'));
   return document.querySelector("#err_success_message").innerHTML = 'Domain ID cannot be empty';
 }
 wsSend({
  command: 'admin_add_user',
  domain_id: idData.id,
  name: user_name.value,
  visible_name: visible_name.value,
  password: password.value,
  admin_token: localStorage.getItem('admin_token')
 });
//  dialogClose();
}

async function editUser(id, name, v_name) {
 await getDialog('Edit user', await getFileContent('html/user_update.html'));
 let updated_name = document.querySelector('#updated_user_name');
 let updated_v_name = document.querySelector('#updated_visible_name');
 updated_name.value = name;
 updated_v_name.value = v_name;
 updated_name.focus();
 idData.secondary_id = id;
}

async function userUpdate() {
 document.querySelector("#err_msg").innerHTML = '';
 let updated_name = document.querySelector('#updated_user_name');
 let updated_v_name = document.querySelector('#updated_visible_name');
 let updated_password = document.querySelector('#updated_password');
 item_name = updated_name.value;
 wsSend({
  command: 'admin_set_user',
  id: idData.secondary_id,
  domain_id: idData.id,
  name: updated_name.value,
  visible_name: updated_v_name.value,
  photo: null,
  password: updated_password.value,
  admin_token: localStorage.getItem('admin_token')
 });
//  dialogClose();
}

async function delUserDialog(id, name) {
 idData.secondary_id = id;
 item_name = name;
 await getDialog('Delete user ' + id, translate(await getFileContent('html/user_delete.html'), { '{NAME}': name }));
 focusErr();
}

async function delUser() {
 wsSend({
  command: 'admin_del_user',
  id: idData.secondary_id,
  admin_token: localStorage.getItem('admin_token')
 });
//  dialogClose();
}

async function addAlias() {
 await getDialog('Add alias', await getFileContent('html/alias_add.html'));
 document.querySelector('#alias_name').focus();
}

async function aliasAdd() {
 document.querySelector("#err_msg").innerHTML = '';
 let alias_name = document.querySelector('#alias_name');
 let mail = document.querySelector('#mail');
 if(idData.id === undefined) {
   await getDialog('Add User Error', await getFileContent('html/error_message.html'));
   return document.querySelector("#err_success_message").innerHTML = 'Domain ID cannot be empty';
 }
 item_name = alias_name.value;
 wsSend({
     command: 'admin_add_aliases',
     domain_id: idData.id,
     alias: alias_name.value,
     mail: mail.value,
     admin_token: localStorage.getItem('admin_token')
 });
//  dialogClose();
}

async function editAlias(id, alias, mail) {
 await getDialog('Edit alias', await getFileContent('html/alias_update.html'));
 let updated_name = document.querySelector('#updated_alias_name');
 let updated_mail = document.querySelector('#updated_mail');
 updated_name.value = alias;
 updated_mail.value = mail;
 updated_name.focus();
 idData.secondary_id = id;
}

async function aliasUpdate() {
 document.querySelector("#err_msg").innerHTML = '';
 let updated_name = document.querySelector('#updated_alias_name');
 let updated_mail = document.querySelector('#updated_mail');
 item_name = updated_name.value;
 wsSend({
    command: 'admin_set_aliases',
    id: idData.secondary_id,
    alias: updated_name.value,
    mail: updated_mail.value,
    admin_token: localStorage.getItem('admin_token')
 });
//  dialogClose();
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

async function getUsers(domain_id) {
 let btn = document.querySelector("#add-user");
 active_domain = domain_id;
 document.querySelector("option[disabled]").removeAttribute('selected');
 document.querySelector("option[value = '" + active_domain + "']") ?
 document.querySelector("option[value = '" + active_domain + "']").setAttribute('selected', true) : null;
 if(active_domain === '' || active_domain === undefined) {
  btn ? btn.classList.add('disabled') : null;
  btn ? btn.style.cursor = 'default' : null;
  btn ? btn.setAttribute('onclick', null): null;
 } else {
  btn ? btn.classList.remove('disabled') : null;
  btn ? btn.style.cursor = 'pointer' : null;
  btn ? btn.setAttribute('onclick', 'addUser()'): null;
 }
 let matchesDomain = domainsData.find((domain) => domain.name === domain_id);
 matchesDomain ? idData.id = matchesDomain.id : idData.id = undefined;
 wsSend({
  command: 'admin_get_users',
  domain_id: idData.id,
  admin_token: localStorage.admin_token,
 });
}

async function getAliases(domain_id) {
 let btn = document.querySelector("#add-alias");
 active_domain = domain_id;
 document.querySelector("option[disabled]").removeAttribute('selected');
 document.querySelector("option[value = '" + active_domain + "']") ?
 document.querySelector("option[value = '" + active_domain + "']").setAttribute('selected', true) : null;
 if(active_domain === '' || active_domain === undefined) {
  btn ? btn.classList.add('disabled') : null;
  btn ? btn.style.cursor = 'default' : null;
  btn ? btn.setAttribute('onclick', null): null;
 } else {
  btn ? btn.classList.remove('disabled') : null;
  btn ? btn.style.cursor = 'pointer' : null;
  btn ? btn.setAttribute('onclick', 'addAlias()'): null;
 }
 let matchesDomain = domainsData.find((domain) => domain.name === domain_id);
 matchesDomain ? idData.id = matchesDomain.id : idData.id = undefined;
 wsSend({
  command: 'admin_get_aliases',
  admin_token: localStorage.admin_token,
  domain_id: idData.id
 });
}

async function addAdmin() {
 await getDialog('Add admin', await getFileContent('html/admin_add.html'));
 document.querySelector('#admin_name').focus();
}

async function adminAdd() {
 document.querySelector("#err_msg").innerHTML = '';
 let admin_name = document.querySelector('#admin_name');
 let admin_password = document.querySelector('#admin_pass');
 item_name = admin_name.value;
 wsSend({
  command: 'admin_add_admin',
  domain_id: idData.id,
  name: admin_name.value,
  pass: admin_password.value,
  admin_token: localStorage.getItem('admin_token')
 });
//  dialogClose();
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

function errorDialogClose() {
 document.querySelector('.error-dialog').remove();
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
 (async function send_error() {
  var html = translate(await getFileContent('html/dialog.html'), { '{TITLE}': 'Could not establish conection', '{CONTENT}': 'Invalid secure port' });
  document.querySelector('#page').innerHTML += html;
 })();
 window.location.port ? null : wsConnect(server);
}

function wsOnError(error) {
 console.log('WebSocket error:', error);
}

async function wsOnMessage(data) {
 console.log('FROM SERVER:');
//  console.log(data);
 data = JSON.parse(data);
 console.log('data......', data);
 if(data.server) {
  getDomains();
  label = data.server.name;
  document.title = data.server.name;
 }
 if ('error' in data) {
  if (data.error == 'admin_token_invalid') logout();
 } else {
   setTimeout(() => {
      setOptions();
   }, time);
  document.querySelector("#label").innerHTML = label + ' - web admin';
  document.title = label + ' - web admin';
  if (data.command == 'admin_login') {
   setAdminLogin(data);
   active_admin = data.data.id;
  }
  if (data.command == 'admin_logout') setAdminLogout(data);
  if (data.command == 'admin_sysinfo') setSysInfo(data);
  if (data.command == 'admin_get_domains') {
   for(let i = 0; i < data.data.length; i++) {
      domainsData.push({name: data.data[i].name, id: data.data[i].id});
      domainsData = [...new Set(domainsData)];
   }
   if (page === 'domains') setDomains(data);
   if (page === 'users') setUsersDomains(data);
   if (page === 'aliases') setAliasesDomains(data);
  }
  if (data.command == 'admin_get_users') setUsers(data);
  if (data.command == 'admin_get_aliases') setAliases(data);
  if (data.command == 'admin_get_admins') setAdmins(data);
  if (data.command == 'admin_del_domain') {
   if(data.data !== undefined && data.data.error) document.querySelector("#err_msg").innerHTML = data.data.message;
   else document.querySelector("#err_msg").innerHTML = "Domain \"" + item_name + "\" removed successfully";
   document.querySelector("#mx-btn").style.display ='none';
   document.querySelector("#e").innerHTML ='Ok';
   document.querySelector("#e").focus();
   getPage('domains');
  }
  if (data.command == 'admin_add_domain') {
   if(data.data !== undefined && data.data.error) document.querySelector("#err_msg").innerHTML = data.data.message + formattedMessage;
   else document.querySelector("#err_msg").innerHTML = "Added domain \"" + item_name + "\" successfully";
   getPage('domains');
  }
  if (data.command == 'admin_set_domain') {
   getPage('domains');
   if(data.data !== undefined && data.data.error) document.querySelector("#err_msg").innerHTML = data.data.message + formattedMessage;
   else document.querySelector("#err_msg").innerHTML = "Updated domain \"" + item_name + "\" successfully";
   document.querySelector("#mx-btn").style.display ='none';
   document.querySelector("#e").innerHTML ='Ok';
   document.querySelector("#e").focus();
  }
  if (data.command == 'admin_add_user') {
   getPage('users');
   if(data.data !== undefined && data.data.error) document.querySelector("#err_msg").innerHTML += data.data.message + formattedMessage;
   else document.querySelector("#err_msg").innerHTML = "Added user \"" + item_name + "\" successfully<br/><br/>";
   document.querySelector("#mx-btn").style.display ='none';
   document.querySelector("#e").innerHTML ='Ok';
   document.querySelector("#e").focus();
  }
  if (data.command == 'admin_set_user') {
   getPage('users');
   if(data.data !== undefined && data.data.error) document.querySelector("#err_msg").innerHTML += data.data.message + formattedMessage;
   else document.querySelector("#err_msg").innerHTML = "Updated user \"" + item_name + "\" successfully";
   document.querySelector("#mx-btn").style.display ='none';
   document.querySelector("#e").innerHTML ='Ok';
   document.querySelector("#e").focus();
  }
  if (data.command == 'admin_del_user') {
   getPage('users');
   document.querySelector("#err_msg").innerHTML = "Removed user \"" + item_name + "\" successfully";
   document.querySelector("#mx-btn").style.display ='none';
   document.querySelector("#e").innerHTML ='Ok';
   document.querySelector("#e").focus();
  }
  if (data.command == 'admin_add_aliases') {
   getPage('aliases');
   if(data.data !== undefined && data.data.error) document.querySelector("#err_msg").innerHTML += data.data.message + formattedMessage;
   else document.querySelector("#err_msg").innerHTML = "Added alias \"" + item_name + "\" successfully";
   document.querySelector("#mx-btn").style.display ='none';
   document.querySelector("#e").innerHTML ='Ok';
   document.querySelector("#e").focus();
  }
  if (data.command == 'admin_set_aliases') {
   getPage('aliases');
   if(data.data !== undefined && data.data.error) document.querySelector("#err_msg").innerHTML += data.data.message + formattedMessage;
   else document.querySelector("#err_msg").innerHTML = "Updatedm alias \"" + item_name + "\" successfully";
   document.querySelector("#mx-btn").style.display ='none';
   document.querySelector("#e").innerHTML ='Ok';
   document.querySelector("#e").focus();
  }
  if (data.command == 'admin_add_admin') {
   getPage('admins');
   if(data.data !== undefined && data.data.error) document.querySelector("#err_msg").innerHTML = data.data.message + formattedMessage;
   document.querySelector("#err_msg").innerHTML = "Added admin \"" + item_name + "\" successfully";
   document.querySelector("#mx-btn").style.display ='none';
   document.querySelector("#e").innerHTML ='Ok';
   document.querySelector("#e").focus();
  }
  if (data.command == 'admin_set_admin') {
   getPage('admins');
   if(data.data !== undefined && data.data.error) document.querySelector("#err_msg").innerHTML = data.data.message + formattedMessage;
   else document.querySelector("#err_msg").innerHTML = "Updated admin \"" + item_name + "\" successfully";
   document.querySelector("#mx-btn").style.display ='none';
   document.querySelector("#e").innerHTML ='Ok';
   document.querySelector("#e").focus();
  }
  if (data.command == 'admin_del_aliases') {
   getPage('aliases');
   document.querySelector("#err_msg").innerHTML = "Removed alias \"" + item_name + "\" successfully";
   document.querySelector("#mx-btn").style.display ='none';
   document.querySelector("#e").innerHTML ='Ok';
   document.querySelector("#e").focus();
  }
  if (data.command == 'admin_del_admin') {
   getPage('admins');
   console.log({active_admin});
   document.querySelector("#err_msg") ? 
   document.querySelector("#err_msg").innerHTML = "Removed admin \"" + item_name + "\" successfully" : null;
   document.querySelector("#mx-btn").style.display ='none';
   document.querySelector("#e").innerHTML ='Ok';
   document.querySelector("#e").focus();
  }
 }
 return focusErr();
}

async function wsSend(data) {
 if (ws.readyState === 1) {
  console.log('TO SERVER:');
  console.log(data);
  ws.send(JSON.stringify(data));
 }
}

async function setAdminLogin(res) {
 var error = document.querySelector('#error');
 if (res.data.logged) {
  console.log('admin authed: ', res.data);
  localStorage.setItem('admin_token', res.data.token);
  document.querySelector('#page').innerHTML = await getFileContent('html/home.html');
  await getPage('stats');
 } else {
  error.style.display = 'block';
  error.innerHTML = res.data.message;
  document.querySelector('#logbutton-label').style.backgroundColor = 'var(--primary-color)';
  document.querySelector('#logbutton-label').innerHTML = 'Login';
  document.querySelector('#login').setAttribute('onsubmit', 'login(); return false;');
  document.querySelector('#logbutton-label').style.cursor = 'pointer';
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
 if(res.data.length > 0) {
  for (var i = 0; i < res.data.length; i++) {
    rows += translate(rowTemp, {
    '{ID}': res.data[i].id,
    '{NAME}': res.data[i].name,
    '{CREATED}': DateFormat(res.data[i].created)
    });
  }
  document.querySelector('#domains').innerHTML = rows;
 } 
//  else document.querySelector('#domains').innerHTML = '<br/>&emsp;No data...<br/><br/>';
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
 if(document.querySelector('#domains')) document.querySelector('#domains').innerHTML = rows;
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
 if(res.data.length > 0) {
  for (var i = 0; i < res.data.length; i++) {
   rows += translate(rowTemp, {
    '{ID}': res.data[i].id,
    '{NAME}': res.data[i].name,
    '{VISIBLE_NAME}': res.data[i].visible_name,
    '{PHOTO}': res.data[i].photo || './img/profile.svg',
    '{MESSAGES}': res.data[i].message_count,
    '{FILES_SIZE}': '?',
    '{CREATED}': DateFormat(res.data[i].created)
   });
  }
  document.querySelector('#users').innerHTML = rows;
 } else document.querySelector('#users').innerHTML = '<br/>&emsp;No data...<br/><br/>';
}

async function setAliases(res) {
 document.querySelector('#aliases').innerHTML = '<br/>&emsp;Checking...<br/><br/>';
 var rows = '';
 var rowTemp = await getFileContent('html/aliases_row.html');
 if(res.data.length > 0) {
    for (var i = 0; i < res.data.length; i++) {
     rows += translate (rowTemp, {
      '{ID}': res.data[i].id,
      '{ALIAS}': res.data[i].alias,
      '{MAIL}': res.data[i].mail,
      '{CREATED}': DateFormat(res.data[i].created)
     });
    }
    document.querySelector('#aliases').innerHTML = rows;
 } else document.querySelector('#aliases').innerHTML = '<br/>&emsp;No data...<br/><br/>';
}

async function setAdmins(res) {
 document.querySelector('#admins').innerHTML = '<br/>&emsp;Checking...<br/><br/>';
 var rows = '';
 var rowTemp = await getFileContent('html/admins_row.html');
 if(res.data.length === 0) {
   localStorage.removeItem('admin_token')
   return window.location.reload();
 }
 for (var i = 0; i < res.data.length; i++) {
  rows += translate (rowTemp, {
   '{ID}': res.data[i].id,
   '{USER}': res.data[i].user,
   '{CREATED}': DateFormat(res.data[i].created)
  });
 }
 document.querySelector('#admins').innerHTML = rows;
}