# How to extend unrupt to work when the recipient isn't currently active

### Aim

* A user can call a party who isn't currently available and leave a message
* the new message is available to the called party when they choose to listen
* the message should feel like an extension of a pre-existing conversation
* the recipient should be able to speak and the reply will go to the originator

### Un-goal
Re-inventing voicemail.

### Implied requirements
* an endpoint that is always active and acts on behalf of an unavailable user (call this the 'proxy')
* the ability to switch between conversations (since during a period of inactivity a user may have recieved
 multiple messages from multiple senders )

Which implies
* named users
* multiple conversations.
* storage for ordered messages within a conversation 

* ability to listen/respond to messages on either the proxy (assumed to be a desktop computer) and the user's mobile devices

* communication channel between the 'proxy' and devices - is this link 'up' whenever an unrupt page is loaded on a device ?
* communication between the devices (to sync the conversation state) -or does this go through the proxy?
* trust relationships between devices (establish common ownership + roles)

* presence status on sending side (you'll phrase things differently if your recipient isn't immediately available)

### Questions
* do all calls go to the proxy first?
* is the 'truth' about the state of conversations stored in the proxy (only) or is there a consensus?
* are the recordings encrypted at rest - or just inflight?
* (key management ?)
* are the devices usable if the proxy is unreachable?
* if multiple devices are available to take a call, which one gets it?
* how does a conversation move to 'live'?
* what about video ? Do we capture that too, or is a still presented ?
* can a live call be 'transfered' between devices?
* can the proxy be used as user endpoint?


#Worklist
Based on reasonable assumptions about the above, we need

1) database of users - means to add, remove, list, delete users
2) database of my devices - means to add, remove, list, delete devices
(probably use QR codes for both)
3) database of conversations and messages - including audio data, status etc
4) notification of inbound messages
5) code to redirect inbound call to devices 
6) code to capture messages if no device accepts the call
 (note the capture should start immediately, allowing the caller to start speaking irrespective of the device state)
7) code to show that new messages have arrived in a conversation
8) code to play messages *and mark them as played* 
9) code to sync state back to the proxy
10) integration into existing unrupt

#Conclusion:
This is quite a lot of work. A couple of months perhaps.

