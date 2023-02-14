# The New E-Mail Protocol (NEMP) - protocol documentation

**IMPORTANT NOTE:** This is just a draft. It is not the final version of protocol.

## Table of contents

- [Introduction](#introduction)
- [Admin to server communication](#a2s)
  - [Admin login](#a2s-login)
  - [Admin logout](#a2s-logout)
  - [Domains management](#a2s-domains)
    - [List domains](#a2s-domains-list)
    - [Add a new domain](#a2s-domains-add)
    - [Set the existing domain](#a2s-domains-set)
    - [Delete the domain](#a2s-domains-del)
  - [Users management](#a2s-users)
    - [List users](#a2s-users-list)
    - [Add a new users](#a2s-users-add)
    - [Set the existing user](#a2s-users-set)
    - [Delete the user](#a2s-users-del)
  - [Aliases management](#a2s-aliases)
    - [List aliases](#a2s-aliases-list)
    - [Add a new alias](#a2s-aliases-add)
    - [Set the existing alias](#a2s-aliases-set)
    - [Delete the alias](#a2s-aliases-del)
  - [Admins management](#a2s-admins)
    - [List admins](#a2s-admins-list)
    - [Add a new admin](#a2s-admins-add)
    - [Set the existing admin](#a2s-admins-set)
    - [Delete the admin](#a2s-admins-del)
- [User to server communication](#u2s)
  - [User login](#u2s-login)
  - [User logout](#u2s-login)
  - [Server info](#u2s-serverinfo)
  - [User info](#u2s-userinfo)
  - [Encryption](#u2s-encryption)
    - [Set encryption key and algorithm](#u2s-encryption-set)
  - [Contacts management](#u2s-contacts)
    - [List contacts](#u2s-contacts-list)
    - [Add a new contact](#u2s-contacts-add)
    - [Set the existing contact](#u2s-contacts-set)
    - [Delete the contact](#u2s-contacts-del)
  - [Groups management](#u2s-groups)
    - [List all public groups on server](#u2s-groups-list)
    - [Create a new group](#u2s-groups-create)
    - [Set the existing group](#u2s-groups-set)
    - [Delete the group](#u2s-groups-del)
    - [List group admins](#u2s-groups-admins)
    - [List group users](#u2s-groups-users)
  - [Messages](#u2s-messages)
    - [Send message to user](#u2s-messages-send2user)
    - [Send message to group](#u2s-messages-send2group)
    - [Receive message from user](#u2s-messages-receiveuser)
    - [Receive message from user in group](#u2s-messages-receivegroup)
- [Server to server communication](#s2s)

## Introduction <a name="introduction"></a>

- Server accepts all the requests in form of web socket messages.
- Web sockets are running within the HTTPS server.
- HTTPS server has to run on default 443 port to communicate with other servers properly
- All the requests and responses are in JSON format.
- It is strongly recommended to send the JSON data in compact format.

## Admin to server communication <a name="a2s"></a>

- Serves for server administration (eg. admin login, server stats, user accounts / aliases management, admins management etc.)

### Admin login <a name="a2s-login"></a>

- Admin has to be logged in in order to manage the server. If the login is successful, they'll get the admin token that has to be sent in every request

- Request example:

```json
{
 "api_name": "admin_sysinfo",
 "admin_token": "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

- Response example:

```json
{
 "app_name": "New Mail Server",
 "app_version": "0.01",
 "os_name": "Linux",
 "os_version": "5.10.0-19-amd64",
 "cpu_model": "Intel(R) Xeon(R) CPU E5-2673 v4 @ 2.30GHz",
 "cpu_cores": 40,
 "cpu_arch": "x64",
 "cpu_load": 0,
 "ram_total": 8332619776,
 "ram_free": 7842000896,
 "hostname": "mail",
 "networks": [
  {
   "ens1": [
    "192.168.0.5",
    "12ab::34cd:56ef:7890:1234"
   ]
  }, {
   "ens1": [
    "40.30.20.10",
    "12ab::34cd:56ef:7890:4321"
   ]
  }
 ],
 "uptime": "8 days, 17 hours, 32 minutes, 52 seconds"
}
```

### Admin logout <a name="a2s-logout"></a>

### Domains management <a name="a2s-domains"></a>

#### Domains list: <a name="a2s-domains-list"></a>

- Request example:

```json
{
 "api_name": "admin_get_domains",
 "admin_token":"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

- Response example:

```json
[
 {
  "id": 1,
  "name": "domain1.tld",
  "created":"2023-11-25 14:57:03"
 }, {
  "id": 2,
  "name": "domain2.tld",
  "created": "2023-11-26 16:21:08"
 }
]
```

#### Add a new domain <a name="a2s-domains-add"></a>

#### Set the existing domain <a name="a2s-domains-set"></a>

#### Delete the domain <a name="a2s-domains-del"></a>


### Users management <a name="a2s-users"></a>

#### Users list <a name="a2s-users-list"></a>

#### Add a new user <a name="a2s-users-add"></a>

#### Set the existing user <a name="a2s-users-set"></a>

#### Delete the user <a name="a2s-users-del"></a>


### Aliases management <a name="a2s-aliases"></a>

#### Aliases list <a name="a2s-aliases-list"></a>

#### Add a new alias <a name="a2s-aliases-add"></a>

#### Set the existing alias <a name="a2s-aliases-set"></a>

#### Delete the alias <a name="a2s-aliases-del"></a>


### Admins management <a name="a2s-admins"></a>

#### Admins list <a name="a2s-admins-list"></a>

#### Add a new admin <a name="a2s-admins-add"></a>

#### Set the existing admin <a name="a2s-admins-set"></a>

#### Delete the admin <a name="a2s-admins-del"></a>


```json
```

## User to server communication <a name="u2s"></a>

### User login <a name="u2s-login"></a>

- User logs in using their e-mail address and password. The additional verification is possible (2FA etc.).
- If the login is successful, they'll get user token that is sent in all requests.
- User tokens may expire if they are not used for longer time period.
- User tokens are stored in the server database and users store it localy.
- If the user has more tokens for the same account (for example from more devices), they can delete other tokens by their request.

### Server info <a name="u2s-serverinfo"></a>

- Users can request other server's information such as maximum message length accepted, maximum file size accepted etc.

### User info <a name="u2s-userinfo"></a>

- Users can request other user's information such as their client software and its version, visible name, photo etc.

### Contacts management <a name="u2s-contacts"></a>

- Contacts for each user are stored server side.
- Users are able to manage them.
- All the contacts stored on the server are encrypted by end to end encryption

### Message <a name="u2s-messages"></a>

- Users can send messages to other users within the same server or to users on other servers as well.
- Message can contain the text or file
- Text messages are in [Markdown](https://www.markdownguide.org/) format.
- Files can contain any data. Client software may process the data in their own way (eg. image, audio. video or other type od data can be viewed within the client software in chat)
- Maximum message length and file size can be regulated by server.
- All the messages are end to end encrypted. Users can choose the encryption algorithm from those supported by server. Users store their private key and share their public key on the server. Other users (including those from other servers) can ask server for user's public key and encryption algorithm and they get it. Public key and algorithm is saved for each message on server. User can change encryption key and algorithm anytime.

#### Send message to user <a name="u2s-messages-send2user"></a>
#### Send message to group <a name="u2s-messages-send2group"></a>
#### Receive message from user <a name="u2s-messages-receiveuser"></a>
#### Receive message from user in group <a name="u2s-messages-receivegroup"></a>

## Server to server communication <a name="s2s"></a>

```json
```
