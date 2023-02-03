# Frequently asked questions

## Is NEMP an e-mail or instant messenger?

NEMP is primarily the new generation of e-mail protocol. It replaces the old e-mail protocols (SMTP, IMAP, POP3 etc.). It combines the advantages of classic e-mail protocols with modern instant messaging features.

The advantages of classic e-mail protocols:

- Decentralized server structure
- Aliases
- Automated messages (from servers, IoT devices etc.)
- Login identity for other software
- Rich text (for newsletters etc.)
- etc.

The modern features:

- Instant messaging
- Voice and video messages
- Voice and video calls
- Large file transfers
- Encrypted data transfer
- End-to-end encryption
- Newsfeed
- Chat groups
- Chat bots
- Modern looking UI
- etc.

## Why is decentralization important?

In today world, some governments and big corporations are continously censoring users' content, decentralization is extremely important. Even if you run centrally a free and open source service like Signal, some governments can push you to censor some content or they can easily block your servers.

For example WhatsApp and many other centraly run messaging services are blocked in China which leads to inaccessibility of such service for more than 1 billion of people in China.

Running the decentralized network of messaging servers can resolve this problem. Classic e-mail servers are decentralized. Everyone is able to buy a domain and VPS for cheap and run their own e-mail server. Most of the e-mail servers are not banned even in countries like China, where government is hugely blocking many foreign servers.

It is **highly recommended not to use messaging software that is not decentralized**. If you run your own server software, no one can ever block you. It is recommend to use [**high availability solution**](https://en.wikipedia.org/wiki/High_availability) for your server so you'll run your own decentralized network just to be sure you'll never lose your data.

## Why is end-to-end encryption important?

The end-to-end encryption is really recommended for everyone. Your personal and business data are potentially exploitable.

For example:

- You don't want thieves to know when you leave your home
- You don't want your personal photos and videos to be published online
- You don't want hackers to know passwords and other sensitive data to other services you're using and potentionaly delete your data or blackmail you
- You don't want anyone to know your location
- You don't want your business competitors to know your vendors, customers and other business data

These are just few examples, there are many more.

It is **highly recommended not to use messaging software that does not use end-to-end encryption**.

## Why is important to use open source software?

Open source means that the source code of the software is published for free to everyone. This way you can check the code, point out its potential vulnerabilities and also propose how to fix it. Developers can easily adopt such fix and publish the new fixed verison. Everyone can also check that there is no malicious code in the software. This is not possible in case of proprietary (opposite of open source) software.

It is **highly recommended not to trust and not to use messaging software that is not open source** (both server and client software).

## Comparison with other messaging software

| Software                            | Decentralized servers | End-to-end encryption |     Open source    |               Developed by                    |
|-------------------------------------|-----------------------|-----------------------|--------------------|------------------------------------------|
| NEMP                                |   :heavy_check_mark:  |   :heavy_check_mark:  | :heavy_check_mark: | Liberland Software Foundation, Liberland |
| SMTP + IMAP (classic e-mail)        |   :heavy_check_mark:  |          :x:          |    some software   | Jon Postel and Suzanne Sluizer, USA      |
| WhatsApp                            |          :x:          |   :heavy_check_mark:  |         :x:        | Meta Platforms Inc., USA                 |
| RCS protocol (Google Messages etc.) | mobile operators only |     in development    |         :x:        | GSM Association, UK                      |
| WeChat                              |          :x:          |          :x:          |         :x:        | Tencent Holdings Ltd., China             |
| Facebook Messenger                  |          :x:          |          :x:          |         :x:        | Meta Platforms Inc., USA                 |
| Telegram                            |          :x:          |        optional       |  client apps only  | Telegram Group, UK                       |
| QQ                                  |          :x:          |          :x:          |         :x:        | Tencent Holdings Ltd., China             |
| iMessage                            |          :x:          |   :heavy_check_mark:  |         :x:        | Apple Inc., USA                          |
| SnapChat                            |          :x:          |          :x:          |         :x:        |	Snap Inc., USA                           |
| Kik                                 |          :x:          |          :x:          |         :x:        |	MediaLab AI Inc., France                 |
| Skype                               |          :x:          |   :heavy_check_mark:  |         :x:        |	Microsoft Corporation, USA               |
| Discord                             |          :x:          |          :x:          |         :x:        | Discord Inc., USA                        |
| Viber                               |          :x:          |   :heavy_check_mark:  |         :x:        |	Rakuten, Japan                           |
| imo                                 |          :x:          |        optional       |         :x:        |	PageBites Inc., USA                      |
| LINE                                |          :x:          |   :heavy_check_mark:  |         :x:        |	Line Corporation, Japan                  |
| Hike                                |          :x:          |   :heavy_check_mark:  |         :x:        |	Hike Private Limited, India              |
| Zalo                                |          :x:          |          :x:          |         :x:        | Zalo Group, Vietnam                      |
| Signal                              |          :x:          |   :heavy_check_mark:  | :heavy_check_mark: |	Signal Foundation, USA                   |
| Threema                             |          :x:          |   :heavy_check_mark:  |  client apps only  | Threema GmbH, Switzerland                |
| Matrix protocol (Element etc.)      |   :heavy_check_mark:  |   :heavy_check_mark:  | :heavy_check_mark: |	The Matrix.org Foundation CIC, UK        |
| ICQ                                 |          :x:          |     AV files only     |         :x:        |	Mail.ru Group, Russia                    |

Please note that information in the table above might not be up to date.

## Matrix protocol is also open source, decentralized and has end-to-end encryption. How does it differ from NEMP?

Matrix protocol is really an interesting software and together with NEMP it is probably the only software that is open source, has end-to-end encryption and a decentralized server structure. Here are the differences between NEMP and Matrix:

- NEMP is primarily a new generation of e-mail, not just an instant messenger
- NEMP has different features like newsfeed, video messages, large file transfers etc.
- NEMP client has a nicer and more user friendly UI than Element (the most popular Matrix protocol client) :-)

## Is NEMP client backward compatible with classic e-mail protocols (SMTP, IMAP, POP3)?

Right now it is not compatible, but in theory, it can be done in client software to support both old and new e-mail protocol. Maybe in future this feature will be added to NEMP client, but it is not our priority for now.
