# Project Summary

**Secure-Chat** 🔒💬 — a tiny, local-first real-time chat app built with Node.js and WebSockets.  
It’s made for learning and prototyping private messaging: run it on your machine, open a few browser tabs, and watch messages fly between clients in real time.

## What this does (plain English)
- Starts a simple Node.js server that serves a frontend and handles live chat connections.
- Lets multiple browser windows/tabs connect and send messages instantly using WebSockets.
- Designed to be lightweight so beginners can see how real-time chat works without a database or cloud setup.

## Who this is for
- Absolute beginners who want to learn how real-time apps work.
- Devs wanting a sandbox to test client-side encryption ideas.
- People who want a small project to tweak and learn Node + WebSockets.

## What you need (very small)
- Node.js installed (v14+ recommended).  
- Basic terminal / command-line knowledge.  
- A browser (Chrome/Firefox).

## Quick start (copy-paste)
```bash
# 1. clone
git clone git@github.com:jo4dan/Secure-Chat.git
cd Secure-Chat

# 2. install deps
npm install

# 3. run server
node server.js

# 4. open app
# open http://localhost:3000 in your browser (open multiple tabs to test)
