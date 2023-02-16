# The New E-Mail Protocol (NEMP) - server software roadmap

This document describes our development plan (aka roadmap) of NEMP server.

## Server

|                   Feature                 |     Implemented    |
|-------------------------------------------|--------------------|
| Web server + SSL certificate + Web Socket | :heavy_check_mark: |
| DNS and server to server communication    |         :x:        |

## Modules

|                   Feature                 | Implemented to server | Implemented to web mail client |
|-------------------------------------------|-----------------------|--------------------------------|
| Server administration                     |     in development    |           not needed           |
| SQLite support                            |   :heavy_check_mark:  |           not needed           |
| MySQL support                             |          :x:          |           not needed           |
| PostgreSQL support                        |          :x:          |           not needed           |
| End to end encryption (ECC, RSA etc.)     |          :x:          |               :x:              |
| Plain text messages                       |          :x:          |               :x:              |
| Rich text messages                        |          :x:          |               :x:              |
| Multipart messages                        |          :x:          |               :x:              |
| Reply and forward messages                |          :x:          |               :x:              |
| Message templates                         |       not needed      |               :x:              |
| Newsletter system (template + variables)  |          :x:          |               :x:              |
| Contacts                                  |          :x:          |               :x:              |
| Contact sharing                           |          :x:          |               :x:              |
| Conversion folders                        |          :x:          |               :x:              |
| Server file transfer                      |          :x:          |               :x:              |
| Peer to peer file transfer                |          :x:          |               :x:              |
| Images, audio and video files messages    |          :x:          |               :x:              |
| Stickers                                  |          :x:          |               :x:              |
| Voice messages                            |          :x:          |               :x:              |
| Video messages                            |          :x:          |               :x:              |
| Stickers                                  |          :x:          |               :x:              |
| Map location sharing                      |          :x:          |               :x:              |
| Contact blocking                          |          :x:          |               :x:              |
| Chat group (public and private)           |          :x:          |               :x:              |
| News group (public and private)           |          :x:          |               :x:              |
| Voice calls                               |          :x:          |               :x:              |
| Video calls                               |          :x:          |               :x:              |
| Chat bots                                 |          :x:          |               :x:              |
| Live streaming                            |          :x:          |               :x:              |
| Video conference calls                    |          :x:          |               :x:              |
| Calendar (with sharing)                   |          :x:          |               :x:              |
| Tasks (with sharing)                      |          :x:          |               :x:              |
| Followers                                 |          :x:          |               :x:              |
| Personal news feed (for followers)        |          :x:          |               :x:              |
| Stories (for followers)                   |          :x:          |               :x:              |

## Web admin

|     Feature    |     Implemented    |
|----------------|--------------------|
| Server status  | :heavy_check_mark: |
| Domains        | :heavy_check_mark: |
| User accounts  | :heavy_check_mark: |
| Aliases        | :heavy_check_mark: |
| Modules        |         :x:        |
| Admin accounts | :heavy_check_mark: |

## Web mail client

|                                    Feature                                   |     Implemented    |
|------------------------------------------------------------------------------|--------------------|
| Account management                                                           |         :x:        |
| Notifications                                                                |         :x:        |
| GIF feed                                                                     |         :x:        |
| Multi-language support                                                       |         :x:        |
| Filter (unread messages etc.)                                                |         :x:        |
| Search contacts                                                              |         :x:        |
| Search chat history                                                          |         :x:        |
| Encryption keys import and export                                            |         :x:        |
| Call list                                                                    |         :x:        |
| Message translation                                                          |         :x:        |
| Themes (backgrounds, contact size, font size, color scheme, night mode etc.) |         :x:        |

## Web developer console

|         Feature        |     Implemented    |
|------------------------|--------------------|
| Requests and responses | :heavy_check_mark: |
| Autoconnect            | :heavy_check_mark: |
| Pretty deminified JSON |         :x:        |

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
