# Fishite 🐟
Swim with the world!

By: Carmelo Sanchez, Austin Jackson, Dylan Stellman

For: Term project in CIS 437

## Main Features
### Real-Time Websocket Connections
Everyone will move in real time, on your screen; on theirs!

![fishite-swim-demo](https://github.com/user-attachments/assets/075822fe-a7ea-43ab-873e-3a251d26e658)

### Real-Time Chat
Everyone can chat to each other and their message will appear above their heads!

![fishite-chat-demo](https://github.com/user-attachments/assets/98250844-f128-4310-80b1-24b48ae56dd3)

### Real-Time Events
Random events will take place where you must dodge and react to your environment, but becareful! If you get hit, you will lose coins!

![fishite-shark-demo](https://github.com/user-attachments/assets/26c01286-cfe8-49ae-a614-a1dd1d76b4bb)

## Side Features
* Fish Customization
* Create Your Own Username
* Coins
* Music
* Press SPACE to blow bubbles

## Cloud Services Used
* Load Balancer
* Cloud Storage
* Cloud Run
* Cloud Scheduler
* Pub/Sub

## How Do the Cloud Services Interact With Each Other?

Load Balancer is connected to the fishite-dist bucket, which has the files publically available for the load balancer to serve them on an ip address. AWS Route 53 DNS was used to create a subdomain from paledusk.net to fishite.paledusk.net. This allowed us to secure a safe connection through SSL. Client can now connect to the website via fishite.paledusk.net

The client then connected to the Cloud Run server through HTTPS. 

The Cloud Run server holds all the main logic for the game, and updates the positions of whatever client moved, to every other client. It is set up with 1 GB of memory and 2 CPUs. Currently, due to low player count, it is meant to only ever spin up 2 instances MAX. This is due to one instance of the server easily able to hold 40 people (thats our highest tested). The server also has session affinity turned on, meaning that if someone were to connect, a cookie is handed out to the browser, allowing them to reconnect, if at all possible, to the same instance at which the cookie was handed out from. This is great as if Cloud run were to ever spin up a second server, if you disconnected, it would try to connect you back to the server you disconnected from. Or if the websocket had a forced refresh, which will happen after 1 hour. 

The Cloud Run server is connected to the Cloud Storage fishite-coins bucket. It will store the amount of coins to the uuid of the player.

The Cloud Run server is subscribed to the pub/sub, which will cause the events to play based on whichever event was called. Shark event is the one and only event.

A CRON Job is running every minute (was supposed to be 5 minutes, but was shortened for demo(is also currently paused)). The CRON job will trigger the pub/sub.

<img width="1640" height="704" alt="Fishite-Cloud-Communication" src="https://github.com/user-attachments/assets/a0e2e536-0c26-4c23-8cf7-7e4f088a9dd2" />

## Steps to Running on Cloud

### Step 1: Create Server on Cloud Run

Move the server folder into your cloud shell and execute the command (inside the directory):

```npm install```

```gcloud run deploy {SERVERNAME} --source . --platform managed -- region us-east1 --allow-unauthenticated --port {port} --session-affinity```

This will build your fishite server and it will give you an HTTPS link. You can use this link to run the server locally and bundle it into your client
You can then make any manual configurations inside the GUI console. Examples: Increasing the memory to 1GB, increasing CPU from 1 to 2

### Step 2: Create Bucket to hold files

Create a bucket to hold the coins JSON and another bucket to hold the build/bundled files of your client. You can build your client by running the command:

``` npm run build ```

This will compile your files and place them in ```.\dist\```

Note: It is best to set all of the cloud features up first, so you can place the links needed in the server, and in the client.

Move those files and upload them to the dist bucket when ready.

Make sure all files are public in the dist folder, this can be done by going to the bucket's Permissions tab in the Cloud Console, click Grant Access, add allUsers as a principal, assign the Storage Object Viewer role, and confirm the public access prompt. This is important for later.

### Step 3.0: Configure Firewall

Go to VPC firewall and create a rule that will allow and open port 80 and 443. This is HTTP and HTTPS, important for our cloud run server and load balancer.

### Step 3.1: Create Load Balancer

Go to the Load Balancer GUI in the console and create the balancer. 

Frontend: Name it, Make sure if you set up HTTPS, you have a domain to use, and a DNS server where you can create an A record and CAA record for the Cert. Have the A record point to the ip address given to you after you set up the load balancer initially.

Backend: Use the fishite-dist bucket you created earlier. Since it is public, the load balancer will have no problem accessing all the files. Should be ready to host immediately.

### Step 4: Create Event Subscription

Go to Pub/Sub in the console and create your subscription to the event in the console. 

Edit the Server source to subscribe to the event end point.

### Step 5: Create CRON job to run the event

Go to Cloud Scheduler and create a cloud schedule to triggle a pub/sub event. 

Ours has the message body 

```{"event": "shark-event"}```

This can be whatever event you can create, and whatever you set up the client to do, and the server to emit.

This is how we trigger the pub/sub, to which, will trigger it on the server since that is where the pub/sub enpoint is, then it will display on all clients.

## Steps to Running Locally
run:
``` npm install && cd server && npm install ```


### Start the Backend in a Terminal

``` npm run server ```

### Start the Frontend in a Different Terminal

``` npm run dev ```
