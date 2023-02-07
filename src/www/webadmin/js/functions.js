var page = '';
var ws;
var server = 'wss://' + window.location.host + (window.location.port != '' ? ':' + window.location.port : '') + '/';

let idData = {
    id: 0,
    secondary_id: 0
}, domainsData = [], usersInDomain = [], time = 700, item_name = '';

window.onload = async function() {
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

setTimeout(() => {
   getDomains();
}, time);

function setOptions() {
 let domainsSelect = document.querySelector('#select_domains');
 for (let i = 0; i < domainsData.length; i++) {
  let option = document.createElement('option');
  option.value = domainsData[i];
  option.innerHTML = domainsData[i];
  if(domainsSelect) {
   if(domainsSelect.children.length - 1 === domainsData.length) break;
   domainsSelect.append(option);  
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
  document.querySelector('#domains').innerHTML = '<br/>&emsp;Checking...<br/><br/>';
  replaceWindowState("/webadmin/domains");
  setTimeout(() => {
   getDomains();
  }, time);
 }
 if (name === 'users') {
  replaceWindowState("/webadmin/users");
  setTimeout(() => {
   getUsers();
  }, time);
 }
 if (name === 'aliases') {
  replaceWindowState("/webadmin/aliases");
  setTimeout(() => {
   getAliases();
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
   document.querySelector('#logbutton').setAttribute('onclick', '');
 wsSend({
  command: 'admin_login',
  user: document.querySelector('#user').value,
  pass: document.querySelector('#pass').value
 });
 document.querySelector('#logbutton').style.backgroundColor = '#A0A0A0';
 document.querySelector('#logbutton').innerHTML = '<span class="loader"></span>';
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
 dialogClose();
}

async function delAdminDialog(id, name) {
   idData.secondary_id = id;
   item_name = name;
   await getDialog('Delete admin ' + id, await getFileContent('html/admin_delete.html'));
}

async function delAdmin() {
   wsSend({
    command: 'admin_del_admin',
    id: idData.secondary_id,
    admin_token: localStorage.getItem('admin_token')
   });
   dialogClose();
}

async function addDomain() {
    await getDialog('Add domain', await getFileContent('html/domains_add.html'));
    document.querySelector('#domain_name').focus();
}
async function domainAdd() {
 let domain_name = document.querySelector('#domain_name');
 item_name = domain_name.value;
 wsSend({
  command: 'admin_add_domain',
  name: domain_name.value,
  admin_token: localStorage.getItem('admin_token')
 });
 dialogClose();
}

async function delDomainDialog(id, name) {
    idData.id = id;
    item_name = name;
    await getDialog('Delete domain ' + id, await getFileContent('html/domain_delete.html'));
}

async function delDomain() {
 wsSend({
  command: 'admin_del_domain',
  id: idData.id,
  admin_token: localStorage.getItem('admin_token')
 });
 dialogClose()
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
 let updated_name = document.querySelector('#updated_domain_name');
 item_name = updated_name.value;
 wsSend({
  command: 'admin_set_domain',
  id: idData.id,
  name: updated_name.value,
  admin_token: localStorage.getItem('admin_token')
 });
 dialogClose();
}

async function delAliasDialog(id, name) {
    idData.id = id;
    item_name = name;
    await getDialog('Delete alias ' + id, await getFileContent('html/alias_delete.html'));
}

async function delAlias() {
 wsSend({
  command: 'admin_del_aliases',
  id: idData.id,
  admin_token: localStorage.getItem('admin_token')
 });
 dialogClose()
}

async function addUser() {
 await getDialog('Add user', await getFileContent('html/users_add.html'));
 document.querySelector('#user_name').focus();
}
async function userAdd() {
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
 dialogClose();
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
  pass: updated_password.value,
  admin_token: localStorage.getItem('admin_token')
 });
 dialogClose();
}

async function delUserDialog(id, name) {
    idData.secondary_id = id;
    item_name = name;
    await getDialog('Delete user ' + id, await getFileContent('html/user_delete.html'));
}

async function addAlias() {
 await getDialog('Add user', await getFileContent('html/alias_add.html'));
 document.querySelector('#alias_name').focus();
}

async function aliasAdd() {
 let alias_name = document.querySelector('#alias_name');
 let mail = document.querySelector('#mail');
 item_name = alias_name.value;
 wsSend({
     command: 'admin_add_aliases',
     domain_id: idData.id,
     alias: alias_name.value,
     mail: mail.value,
     admin_token: localStorage.getItem('admin_token')
 });
 dialogClose();
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
 dialogClose();
}

async function delUser() {
 wsSend({
  command: 'admin_del_user',
  id: idData.secondary_id,
  admin_token: localStorage.getItem('admin_token')
 });
 dialogClose();
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
 idData.id = domain_id;
//  document.querySelector('#select_domains').value = idData.id;
 wsSend({
  command: 'admin_get_users',
  domain_id: domain_id,
  admin_token: localStorage.admin_token,
 });
}

async function getAliases(domain_id) {
 idData.id = domain_id;
 wsSend({
  command: 'admin_get_aliases',
  admin_token: localStorage.admin_token,
//   domain_id: document.querySelector('#select_domains').value
  domain_id: domain_id
 });
}

async function addAdmin() {
 await getDialog('Add user', await getFileContent('html/admin_add.html'));
 document.querySelector('#admin_name').focus();
}

async function adminAdd() {
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
 dialogClose();
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
 console.log('FROM SERVER:');
 console.log(data);
 data = JSON.parse(data);
//  console.log('data......', data);
 if ('error' in data) {
  if (data.error == 'admin_token_invalid') logout();
 } else {
  if(data.handshake) getDomains();
  if (data.command == 'admin_login') setAdminLogin(data);
  if (data.command == 'admin_logout') setAdminLogout(data);
  if (data.command == 'admin_sysinfo') setSysInfo(data);
  if (data.command == 'admin_get_domains') {
   for(let i = 0; i < data.data.length; i++) {
      domainsData.push(data.data[i].id);
      domainsData = [...new Set(domainsData)];
   }
   setOptions();
   if (page === 'domains') setDomains(data);
   if (page === 'users') setUsersDomains(data);
   if (page === 'aliases') setAliasesDomains(data);
  }
  if (data.command == 'admin_get_users') setUsers(data);
  if (data.command == 'admin_get_aliases') setAliases(data);
  if (data.command == 'admin_get_admins') setAdmins(data);
  if (data.command == 'admin_del_domain') {
   getPage('admins');
   if(data.data !== undefined && data.data.error) {
    await getDialog('Delete domain Error', await getFileContent('html/error_message.html'));
    return document.querySelector("#err_success_message").innerHTML = data.data.message;
   }
   else {
      await getDialog('Delete Domain', await getFileContent('html/error_message.html'));
      return document.querySelector("#err_success_message").innerHTML = "Domain \"" + item_name + "\" removed successfully";
     }
  }
  if (data.command == 'admin_add_domain') {
   getPage('domains');
   if(data.data !== undefined && data.data.error) {
    await getDialog('Add domain Error', await getFileContent('html/error_message.html'));
    return document.querySelector("#err_success_message").innerHTML = data.data.message;
   }
   else {
    await getDialog('Add Domain', await getFileContent('html/error_message.html'));
    return document.querySelector("#err_success_message").innerHTML = "Added domain \"" + item_name + "\" successfully";
   }
  }
  if (data.command == 'admin_set_domain') {
   getPage('domains');
   if(data.data !== undefined && data.data.error) {
    await getDialog('Update Domain Erro', await getFileContent('html/error_message.html'));
    return document.querySelector("#err_success_message").innerHTML = data.data.message;
   }
   else {
    await getDialog('Update Domain', await getFileContent('html/error_message.html'));
    return document.querySelector("#err_success_message").innerHTML = "Updated domain \"" + item_name + "\" successfully";
   }
  }
  if (data.command == 'admin_add_user') {
   getPage('users');
   if(data.data !== undefined && data.data.error) {
    await getDialog('Add User Error', await getFileContent('html/error_message.html'));
    return document.querySelector("#err_success_message").innerHTML = data.data.message;
   }
   else {
    await getDialog('Add User', await getFileContent('html/error_message.html'));
    return document.querySelector("#err_success_message").innerHTML = "Added user \"" + item_name + "\" successfully";
   }
  }
  if (data.command == 'admin_set_user') {
   getPage('users');
   if(data.data !== undefined && data.data.error) {
    await getDialog('Update User Error', await getFileContent('html/error_message.html'));
    return document.querySelector("#err_success_message").innerHTML = data.data.message;
   }
   else {
    await getDialog('Update User', await getFileContent('html/error_message.html'));
    return document.querySelector("#err_success_message").innerHTML = "Updated user \"" + item_name + "\" successfully";
   }
  }
  if (data.command == 'admin_del_user') {
   getPage('users');
   await getDialog('Delete User', await getFileContent('html/error_message.html'));
   return document.querySelector("#err_success_message").innerHTML = "Removed user \"" + item_name + "\" successfully";
  }
  if (data.command == 'admin_add_aliases') {
   getPage('aliases');
   if(data.data !== undefined && data.data.error) {
      await getDialog('Add Alias Error', await getFileContent('html/error_message.html'));
      return document.querySelector("#err_success_message").innerHTML = data.data.message;
   }
   else {
    await getDialog('Add Alias', await getFileContent('html/error_message.html'));
    return document.querySelector("#err_success_message").innerHTML = "Added alias \"" + item_name + "\" successfully";
   }
  }
  if (data.command == 'admin_set_aliases') {
   getPage('aliases');
   if(data.data !== undefined && data.data.error) {
      await getDialog('Update Alias Error', await getFileContent('html/error_message.html'));
      return document.querySelector("#err_success_message").innerHTML = data.data.message;
   }
   else {
    await getDialog('Update Alias', await getFileContent('html/error_message.html'));
    return document.querySelector("#err_success_message").innerHTML = "Updatedm alias \"" + item_name + "\" successfully";
   }
  }
  if (data.command == 'admin_add_admin') {
   getPage('admins');
   if(data.data !== undefined && data.data.error) {
      await getDialog('Add Admin Error', await getFileContent('html/error_message.html'));
      return document.querySelector("#err_success_message").innerHTML = data.data.message;
   }
   else {
    await getDialog('Add Admin', await getFileContent('html/error_message.html'));
    return document.querySelector("#err_success_message").innerHTML = "Added admin \"" + item_name + "\" successfully";
   }
  }
  if (data.command == 'admin_set_admin') {
   getPage('admins');
   if(data.data !== undefined && data.data.error) {
      await getDialog('Update Admin Error', await getFileContent('html/error_message.html'));
      return document.querySelector("#err_success_message").innerHTML = data.data.message;
   }
   else {
    await getDialog('Update Admin', await getFileContent('html/error_message.html'));
    return document.querySelector("#err_success_message").innerHTML = "Updated admin \"" + item_name + "\" successfully";
   }
  }
  if (data.command == 'admin_del_aliases') {
   getPage('aliases');
   await getDialog('Delete Alias', await getFileContent('html/error_message.html'));
   return document.querySelector("#err_success_message").innerHTML = "Removed alias \"" + item_name + "\" successfully";
  }
  if (data.command == 'admin_del_admin') {
   getPage('admins');
   if(data.data !== undefined && data.data.error) {
      await getDialog('Delete Admin Error', await getFileContent('html/error_message.html'));
      return document.querySelector("#err_success_message").innerHTML = data.data.message;
   }
   else {
      await getDialog('Delete Admin', await getFileContent('html/error_message.html'));
      return document.querySelector("#err_success_message").innerHTML = "Removed admin \"" + item_name + "\" successfully";
   }
  }
 }
}

async function wsSend(data) {
 if (ws.readyState === 1) {
  console.log('TO SERVER:');
  console.log(data);
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
  error.innerHTML = res.data.message;
  document.querySelector('#logbutton').style.backgroundColor = 'var(--primary-color)';
  document.querySelector('#logbutton').innerHTML = 'Login';
  document.querySelector('#logbutton').setAttribute('onclick', 'login()');
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
    '{CREATED}': new Date(res.data[i].created).toLocaleString()
    });
  }
  document.querySelector('#domains').innerHTML = rows;
 } else document.querySelector('#domains').innerHTML = '<br/>&emsp;No data...<br/><br/>';
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
    '{PHOTO}': res.data[i].photo,
    '{MESSAGES}': res.data[i].message_count,
    '{FILES_SIZE}': '?',
    '{CREATED}': new Date(res.data[i].created).toLocaleString()
   });
  }
  document.querySelector('#users').innerHTML = rows;
 } else document.querySelector('#users').innerHTML = '<br/>&emsp;No data...<br/><br/>';
}

async function setAliases(res) {
 document.querySelector('#aliases').innerHTML = '<br/>&emsp;Checking...<br/><br/>';
 var rows = '';
 var rowTemp = await getFileContent('html/aliases_row.html');
 let domainsSelect = document.querySelector('#select_domains');
 if(res.data.length > 0) {
    for (var i = 0; i < res.data.length; i++) {
     rows += translate (rowTemp, {
      '{ID}': res.data[i].id,
      '{ALIAS}': res.data[i].alias,
      '{MAIL}': res.data[i].mail,
      '{CREATED}': new Date(res.data[i].created).toLocaleString()
     });
    }
    document.querySelector('#aliases').innerHTML = rows;
 } else document.querySelector('#aliases').innerHTML = '<br/>&emsp;No data...<br/><br/>';
}

async function setAdmins(res) {
 document.querySelector('#admins').innerHTML = '<br/>&emsp;Checking...<br/><br/>';
 var rows = '';
 var rowTemp = await getFileContent('html/admins_row.html');
 console.log('no of admins yet.... ', res.data.length);
 if(res.data.length === 0) {
   console.log('none left in admins....');
   localStorage.removeItem('admin_token')
   return window.location.reload();
 }
 for (var i = 0; i < res.data.length; i++) {
  rows += translate (rowTemp, {
   '{ID}': res.data[i].id,
   '{USER}': res.data[i].user,
   '{CREATED}': new Date(res.data[i].created).toLocaleString()
  });
 }
 document.querySelector('#admins').innerHTML = rows;
}
