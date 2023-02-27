# The New E-Mail Protocol (NEMP) - server software roadmap

This document describes our development plan (aka roadmap) of NEMP server.

## Server core

|                   Feature                 |     Implemented    |
|-------------------------------------------|--------------------|
| Web server + SSL certificate + Web Socket | :heavy_check_mark: |
| Server status                             | :heavy_check_mark: |
| Admin accounts management                 | :heavy_check_mark: |
| Modules management                        |         :x:        |
| SQLite support                            | :heavy_check_mark: |
| MySQL support                             |         :x:        |
| PostgreSQL support                        |         :x:        |

## Protocol modules
|                   Feature                    |     Implemented    |
|----------------------------------------------|--------------------|
| Identity (DNS, Domains, users, aliases, ...) |   in development   |
| End to end encryption (ECC, RSA etc.)        |         :x:        |
| Plain text messages                          |         :x:        |
| Rich text messages                           |         :x:        |
| Multipart messages                           |         :x:        |
| Reply and forward messages                   |         :x:        |
| Newsletter system (template + variables)     |         :x:        |
| Contacts                                     |         :x:        |
| Contact sharing                              |         :x:        |
| Conversation folders                         |         :x:        |
| Server file transfer                         |         :x:        |
| Peer to peer file transfer                   |         :x:        |
| Images, audio and video files messages       |         :x:        |
| Stickers                                     |         :x:        |
| Voice messages                               |         :x:        |
| Video messages                               |         :x:        |
| Map location sharing                         |         :x:        |
| Contact blocking                             |         :x:        |
| Chat group (public and private)              |         :x:        |
| News group (public and private)              |         :x:        |
| Voice calls                                  |         :x:        |
| Video calls                                  |         :x:        |
| Chat bots                                    |         :x:        |
| Live streaming                               |         :x:        |
| Video conference calls                       |         :x:        |
| Calendar (with sharing)                      |         :x:        |
| Tasks (with sharing)                         |         :x:        |
| Followers                                    |         :x:        |
| Personal news feed (for followers)           |         :x:        |
| Stories (for followers)                      |         :x:        |

## Considered features:

- Local storage encryption for client application
- Password (+ finger etc.) protected for client application
- Message editing
- Serverless messages
- Disappearing messages
- Events (with sharing)
- Forum
- Live map location sharing (not just static point)
- E-commerce features (like Durger King on Telegram)
- Media news feed
- Profile bio
- Profile status
- Cryptocurrency integration
- Video filters
- Voice changer
- Multiplayer games between users
- Reels
- People nearby
