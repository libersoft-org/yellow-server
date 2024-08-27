# Yellow Server - installation and configuration

These are the installation instructions of this software for the different Linux distributions.

## 1. Get your domain and set DNS records

Before you start the server installation your **own domain** name.

Add these domain records in your DNS for your AMTP server:

### **A** records of your AMTP servers

- This record defines your AMTP servers' domain names
- You need at least 1 such record

**Example:**

```
amtp1.example.com. IN A 123.123.123.1
amtp2.example.com. IN A 123.123.123.2
amtp3.example.com. IN A 123.123.123.3
```

### TXT - AMTP-SERVERS záznam:

- This record defines your AMTP servers.
- Servers are sorted by priority. If any of the server is unavailable, the next one is used instead.
- If no network port is defined, then port 443 is used by default.

**Example:**

```
subdomain.example.com. IN TXT "amtp-servers=amtp1.example.com,amtp2.example.com:12345,amtp3.example.com:23456"
```

This record refines that for accounts at domain: **subdomain.example.com** are used the following AMTP servers:

```
amtp1.example.com at port 443
amtp2.example.com at port 12345
amtp3.example.com at port 23456
```

## 2. Server installation

**IMPORTANT NOTE**: It is recommended to install this software on a clean OS installation, otherwise it may cause that other software previously installed on your server could stop working properly due to this. You are using this software at your own risk.

Log in as "root" on your server and run the following commands to download the necessary dependencies and the latest version of this software from GitHub:

### Debian / Ubuntu Linux

```sh
apt update
apt -y upgrade
apt -y install curl unzip git screen certbot
curl -fsSL https://bun.sh/install | bash
source /root/.bashrc
git clone https://github.com/libersoft-org/yellow-server.git
cd yellow-server/src/
```

### CentOS / RHEL / Fedora Linux

```sh
dnf -y update
dnf -y install curl unzip git screen certbot
curl -fsSL https://bun.sh/install | bash
source /root/.bashrc
git clone https://github.com/libersoft-org/yellow-server.git
cd yellow-server/src/
```

## 3. Configuration

### Create a new server settings file using:

```console
./start.sh --create-settings
```

### Create a new database file using:

```console
./start.sh --create-database
```

### Create a new admin account:

```console
./start.sh --create-admin
```

... and enter you admin name and password when prompted.

### Get your HTTPS certificate:

```console
./cert.sh
```

### Set up the certificate auto renewal:

Edit crontab using:

```console
crontab -e
```

... and add this line at the end:

```console
0 12 * * * /usr/bin/certbot renew --quiet
```

### To edit additional configuration, just edit the "settings.json" file:

- **web** section:
  - **standalone** - true / false (**true** = run a standalone web server with a defined network ports, **false** = run it as a Unix socket and connect it through other web server's proxy)
  - **http_port** - your HTTP server's network port (ignored if you're not running a standalone server)
  - **https_port** - your HTTPS server's network port (ignored if you're not running a standalone server)
  - **certificates_path** - path to your HTTPS certificates
  - **socket_path** - path to a Unix socket file (ignored if you're running standalone server)
  - **web_paths** - array with web server routes and disk paths
- **other** section:
  - **session_admin** - how many seconds we store admins' sessions - for example: 600 = 10 minutes
  - **session_user** - how many seconds we store users' sessions - for example: 2592000 = 30 days
  - **session_cleaner** - after how many seconds should we check for old sessions - for example: 600 = every 10 minutes
  - **db_file** - your server database file path
  - **log_file** - the path to your log file (ignored if log_to_file is false)
  - **log_to_file** - if you'd like to log to console and log file (true) or to console only (false)

## 3. Start the server

a) to start the server in **console**:

```bash
./start.sh
```

b) to start the server in **console** in **hot reload** (dev) mode:

```bash
./start-hot.sh
```

c) to start the server in **screen**:

```bash
./start-screen.sh
```

d) to start the server in **screen** in **hot reload** (dev) mode:

```bash
./start-hot-screen.sh
```

To detach screen press **CTRL+A** and then **CTRL+D**.

To stop the server just press **CTRL+C**.
