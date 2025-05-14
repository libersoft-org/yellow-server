#!/usr/bin/env python3

import sys

host = sys.argv[1]

print(f"""
CREATE USER IF NOT EXISTS username IDENTIFIED BY 'password';
CREATE DATABASE IF NOT EXISTS yellow;
GRANT ALL ON yellow.* TO username;

""")


