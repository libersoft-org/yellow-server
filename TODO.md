# Bugs

- API: adminEditAdmin and adminEditAdmin - when empty password is provided, it should not change the password to empty one
- API: adminEditAdmin and adminEditAdmin - check if the same user with a different user ID already exists

# Features

- Send hashed passwords directly from client apps (client, admin), don't hash them on server
- Add more certificates per domain
- Replace HTTP 1.1 + WebSocket with HTTP 3 + WebTransport

# Test
