# The New E-Mail Protocol (NEMP) - server installation and configuration

## Before the installation

Before you start the server installation, you need to have Linux server with root access and your own domain name.

Then add this domain record in your DNS for your NEMP server:

- **A** record of your NEMP server, eg.: **A - nemp.domain.tld** targeting your NEMP server IP address

Now for each domain you'd like to use with your NEMP server add this record:

- **TXT** record that identifies your NEMP server, eg.: **domain.tld TXT nemp=nemp.domain.tld:443**

## Installation

These are the installation instructions of this software for the different Linux distributions.

**IMPORTANT NOTE**: It is recommended to install this software on a clean OS installation, otherwise it may cause that other software previously installed on your server could stop working properly due to this. You are using this software at your own risk.

### Debian / Ubuntu Linux

Log in as "root" on your server and run the following commands to download the necessary dependencies and the latest version of this software from GitHub:

```console
apt update
apt -y upgrade
apt -y install curl git screen certbot whiptail
cd /root/
curl -fsSL https://deb.nodesource.com/setup_19.x | bash -
apt -y install nodejs
npm i -g npm
git clone https://github.com/libersoft-org/nemp-server.git
cd nemp-server/src/
npm i
```

### CentOS / RHEL / Fedora Linux

Log in as "root" on your server and run the following commands to download the necessary dependencies and the latest version of this software from GitHub:

```console
dnf -y update
dnf -y install git curl screen certbot whiptail
cd /root/
curl -fsSL https://rpm.nodesource.com/setup_19.x | bash -
dnf -y install nodejs
npm i -g npm
git clone https://github.com/libersoft-org/nemp-server.git
cd nemp-server/src/
npm i
```

## Configuration

**1. After the installation is completed, you need to create a new server settings file using:**

```console
node index.js --create-settings
```

**2. Create a new database file using:**

```console
node index.js --create-database
```

**3. Create a new admin account:**

```console
node index.js --create-admin
```

... and enter you admin name and password when prompted.

**4. Get your HTTPS certificate:**

```console
./cert.sh
```

**5. Set up the certificate auto renewal:**

Edit crontab using:

```console
crontab -e
```

... and add this line at the end:

```console
0 12 * * * /usr/bin/certbot renew --quiet
```

If you need some additional configuration, just edit the **settings.json** file.

## Start the server

Now you can just start the server using:

```console
./start.sh
```

You can attach the server screen using:

```console
screen -x nemp
```

To detach screen press **CTRL+A** and then **CTRL+D**.

Alternatively you can run server without using **screen** by:

```console
node index.js
```

To stop the server just press **CTRL+C**.

## Web Admin

- [**Installation instructions for NEMP Web Admin**](https://github.com/libersoft-org/nemp-admin-web/blob/main/INSTALL.md)

## Web Mail Client

- [**installation instructions for NEMP Web Client**](https://github.com/libersoft-org/nemp-client-web/blob/main/INSTALL.md)

## Developer Console

- [**Installation instructions for WebSocket Developer Console**](https://github.com/libersoft-org/websocket-console/blob/main/INSTALL.md)
