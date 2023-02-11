# The New E-Mail Protocol (NEMP) - frequently asked questions

## Is NEMP an e-mail or instant messenger?

NEMP is primarily the new generation of e-mail protocol. It replaces the old e-mail protocols (SMTP, IMAP, POP3 etc.), but it also combines it with modern instant messaging features and many more.

The advantages of classic e-mail protocols:

- Distributed server structure
- Aliases
- Automated messages (from servers, IoT devices etc.)
- Login identity for other software
- Rich text (for newsletters etc.)
- etc.

Modern features:

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

For full list of features, please take a look at [**ROADMAP.md**](./ROADMAP.md) file.

## Why is NEMP using conversations instead of folders?

Folders system (Inbox, Sent etc.) is very obsolete concept of message storing that was created before proper e-mail client software even existed. The original e-mail worked in file system structure where directories had files had roles of e-mail folders and messages. This concept was adopted in all e-mail clients that were released later. Storing the e-mails in folders is very impractical solution, because if you search for message history, you have to switch between folders and search the content of each message. On the other hand conversations resolve this problem and make history search very fast, clear and easy. You don't have to copy the history of conversation in every single message so it saves disk space on servers.

Custom folders in classic e-mail clients had some advantages and are present in NEMP client too. You can simply move whole conversations into folder (for example "Work", "Family" etc.). There is also a special non-conversation chat called "Own messages" where you can store your notes.

## Is NEMP client backward compatible with classic e-mail protocols (SMTP, IMAP, POP3)?

It is not backward compatible. In theory, it can be done in client software to support both old and new e-mail protocols, but our goal is to replace the old e-mail protocols with NEMP and not to maintain the software for both old and new. We let enthusiasts to create backward compatible client software if they want to, but we're not going to do it.

## Why is decentralization and distribution important?

In today world, where many governments and big corporations are continously censoring users' content, decentralized and distributed network structure is extremely important. Even if you run centrally a free and open source service like Signal, some governments can push you to censor some content or they can easily block your servers.

For example WhatsApp and many other centrally run messaging services are blocked in China which leads to inaccessibility of such service for more than 1 billion of people in China.

Running the decentralized and distributed network of messaging servers or serverless messaging software can resolve this problem. Classic e-mail servers are distributed. Everyone is able to buy a domain and VPS very cheap and run their own e-mail server. Most of the e-mail servers are not banned even in countries like China, where government is hugely blocking many foreign servers.

It is **highly recommended not to use messaging software that is not decentralized and / or distributed**. NEMP is fully distributed solution the same way like SMTP (classic e-mail). You can use [**high availability**](https://en.wikipedia.org/wiki/High-availability_cluster) solution for your server so you'll run your own decentralized network just to be sure you'll never lose your data if anything bad happens to your server.

## What is the difference between decentralized and distributed network?

**Decentralized network** means that you have many nodes on the same network, ideally run in different part of the world and by different provider. If some node is unavailable, you can just connect to other node.

**Distributed network** means that you have just a part of the network run either centralized or decentralized. For example if you run your e-mail server, you can attach it with your domain names and you run just the part of the network that is identified by e-mail addresses with your domain name. Servers are communicating with each other and they exchange the content.

Having a both decentralized and distributed solution is very important for stability of the network.

## Why is end-to-end encryption important?

The end-to-end encryption is really recommended for everyone. Your personal and business data are potentially exploitable.

For example:

- You don't want your personal photos and videos to be published online
- You don't want your business competitors to know your vendors, customers and other business data
- You don't want thieves to know when you leave your home
- You don't want hackers to know passwords and other sensitive data to other services you're using and potentionaly delete your data or blackmail you
- You don't want anyone to know your location

These are just few examples, there are many more.

It is **highly recommended not to use messaging software that does not use end-to-end encryption**.

## Why is important to use open source software?

Open source means that the source code of the software is published for free to everyone. This way, you or other people can review the code, point out its potential vulnerabilities and also propose how to fix it. Developers can easily adopt such fix and publish the new fixed verison. Everyone can also check that there is no malicious code in the software. This is not possible in case of proprietary (closed source) software.

It is **highly recommended not to trust and not to use messaging software that is not open source** (both server and client software).

## Comparison with other messaging software

| Software                            | Distributed / decentralized servers | End-to-end encryption |     Open source    |               Developed by               |
|-------------------------------------|-------------------------------------|-----------------------|--------------------|------------------------------------------|
| NEMP                                |          :heavy_check_mark:         |   :heavy_check_mark:  | :heavy_check_mark: | Liberland Software Foundation, Liberland |
| SMTP + IMAP (classic e-mail)        |          :heavy_check_mark:         |          :x:          |    some software   | Jon Postel and Suzanne Sluizer, USA      |
| WhatsApp                            |                 :x:                 |   :heavy_check_mark:  |         :x:        | Meta Platforms Inc., USA                 |
| RCS protocol (Google Messages etc.) |        mobile operators only        |     in development    |         :x:        | GSM Association, UK                      |
| WeChat                              |                 :x:                 |          :x:          |         :x:        | Tencent Holdings Ltd., China             |
| Facebook Messenger                  |                 :x:                 |          :x:          |         :x:        | Meta Platforms Inc., USA                 |
| Telegram                            |                 :x:                 |        optional       |  client apps only  | Telegram Group, UK                       |
| QQ                                  |                 :x:                 |          :x:          |         :x:        | Tencent Holdings Ltd., China             |
| iMessage                            |                 :x:                 |   :heavy_check_mark:  |         :x:        | Apple Inc., USA                          |
| SnapChat                            |                 :x:                 |       snaps only      |         :x:        |	Snap Inc., USA                           |
| Kik                                 |                 :x:                 |          :x:          |         :x:        |	MediaLab AI Inc., France                 |
| Skype                               |                 :x:                 |   :heavy_check_mark:  |         :x:        |	Microsoft Corporation, USA               |
| Discord                             |                 :x:                 |          :x:          |         :x:        | Discord Inc., USA                        |
| Viber                               |                 :x:                 |   :heavy_check_mark:  |         :x:        |	Rakuten, Japan                           |
| imo                                 |                 :x:                 |        optional       |         :x:        |	PageBites Inc., USA                      |
| LINE                                |                 :x:                 |   :heavy_check_mark:  |         :x:        |	Line Corporation, Japan                  |
| Hike                                |                 :x:                 |   :heavy_check_mark:  |         :x:        |	Hike Private Limited, India              |
| Zalo                                |                 :x:                 |          :x:          |         :x:        | Zalo Group, Vietnam                      |
| KakaoTalk                           |                 :x:                 |        optional       |         :x:        | Kakao Corp., South Korea                 |
| Signal                              |                 :x:                 |   :heavy_check_mark:  | :heavy_check_mark: |	Signal Foundation, USA                   |
| Threema                             |                 :x:                 |   :heavy_check_mark:  |  client apps only  | Threema GmbH, Switzerland                |
| Matrix protocol (Element etc.)      |          :heavy_check_mark:         |   :heavy_check_mark:  | :heavy_check_mark: |	The Matrix.org Foundation CIC, UK        |
| ICQ                                 |                 :x:                 |     AV files only     |         :x:        |	Mail.ru Group, Russia                    |

Please note that information in the table above might not be up to date.

## Matrix protocol is also open source, distributed and has end-to-end encryption. How does it differ from NEMP?

Matrix protocol is really an interesting software and together with NEMP it is probably the only software that is open source, uses end-to-end encryption and has distributed server structure. Here are the differences between NEMP and Matrix:

- NEMP is primarily a new generation of e-mail, not just an instant messenger
- NEMP has an intention to be fully featured messaging software with features like news groups, tasks, calendar, support ticketing system etc.
- NEMP client software is focused to be very user friendly and to have very clear user interface so it can be usable for both personal and business use

## What are the cases of security issues with instant messaging applications in past?

Here is the article from Amnesty International about how (un)safe is to use well known instant messaging applications:

- https://www.amnesty.org/en/latest/campaigns/2016/10/which-messaging-apps-best-protect-your-privacy/

Other articles related to security and controversies:

### WeChat

- https://en.wikipedia.org/wiki/WeChat#Controversies
- https://nordvpn.com/blog/is-wechat-safe/
- https://www.wsj.com/articles/wechat-becomes-a-powerful-surveillance-tool-everywhere-in-china-11608633003
- https://www.bloomberg.com/news/features/2022-07-12/wechat-is-china-s-beloved-surveillance-tool
- https://www.washingtonpost.com/opinions/2020/05/07/wechat-users-outside-china-face-surveillance-while-training-censorship-algorithms/
- https://www.cbc.ca/news/science/wechat-surveillance-users-outside-china-1.5558503

### QQ

- https://en.wikipedia.org/wiki/Tencent_QQ#Controversies_and_criticisms
- https://www.privateinternetaccess.com/blog/tencent-has-been-caught-spying-on-your-web-browsing-history-with-qq-messenger/

### Zalo

- https://e.vnexpress.net/news/news/zalo-suspected-to-collect-iphone-data-4123342.html

### ICQ

- https://en.wikipedia.org/wiki/ICQ#Cooperation_with_Russian_intelligence_services

### SnapChat

- https://en.wikipedia.org/wiki/Snapchat#Controversies

### WhatsApp

- https://en.wikipedia.org/wiki/WhatsApp#Controversies_and_criticism

### iMessage

- https://en.wikipedia.org/wiki/IMessage#Security_and_privacy

### Telegram

- https://en.wikipedia.org/wiki/Telegram_(software)#Security

### Kik

- https://en.wikipedia.org/wiki/Kik_Messenger#Security

### Skype

- https://en.wikipedia.org/wiki/Skype#Security_and_privacy

### Viber

- https://en.wikipedia.org/wiki/Viber#Security_audit

### LINE

- https://en.wikipedia.org/wiki/Line_(software)#Security

### Hike

- https://en.wikipedia.org/wiki/Hike_Messenger#Privacy_&_Security

### Signal

- https://en.wikipedia.org/wiki/Signal_(software)#Security

### Threema

- https://en.wikipedia.org/wiki/Threema#Privacy
