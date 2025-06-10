#!/usr/bin/env python3

import sys, os

host = sys.argv[1]
messages_host = os.environ.get('MESSAGES_HOST', 'localhost')

print(f"""

USE yellow;
INSERT INTO admins (username, password) VALUES ('admin', '$argon2id$v=19$m=65536,t=20,p=1$Vmb9bCJSHUOJDiS+amdMkzxTljfkanX0JKsYecdBCkQ$slQjytnGeh4/ScqmXOJ6mjjfdmu/9eVSd6dV032nrm8');
INSERT INTO modules (name, connection_string) VALUES ('org.libersoft.messages', 'ws://{messages_host}:25001/');
#INSERT INTO modules (name, connection_string) VALUES ('org.libersoft.messages2', 'ws://localhost:25002/');
#INSERT INTO modules (name, connection_string) VALUES ('org.libersoft.dating2', 'ws://localhost:25003/');
INSERT INTO domains (name) VALUES ('{host}');
INSERT INTO domains (name) VALUES ('example.com');
""")


def users(host):
	for base in ['forward_test_user', 'user']:
		for i in range(1, 5):
			username = f'{base}{i}'
			print(f"""INSERT INTO users (username, id_domains, visible_name, password) VALUES ('{username}', (SELECT id FROM domains WHERE name = '{host}'), '{username}@{host}', '$argon2id$v=19$m=65536,t=20,p=1$Vmb9bCJSHUOJDiS+amdMkzxTljfkanX0JKsYecdBCkQ$slQjytnGeh4/ScqmXOJ6mjjfdmu/9eVSd6dV032nrm8');""")


users('example.com')
users(host)
