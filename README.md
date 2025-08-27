# StartCam

WebRTC video streaming from phone to PC over VPN network.

## Overview

Simple Node.js server with WebSocket signaling that enables:
- Phone (streamer.html) captures camera and streams video
- PC (viewer.html) receives and displays video stream
- All devices connected via VPN for direct peer-to-peer communication

## Tech Stack

- Node.js + WebSocket for signaling server
- simple-peer for WebRTC abstraction
- Vanilla HTML/JS (no frameworks)
- Docker for containerization

## Quick Start

### Docker (Recommended)

```bash
docker-compose up
```

Access:
- Streamer (phone): `http://<server-ip>:3000/streamer.html`
- Viewer (PC): `http://<server-ip>:3000/viewer.html`

### Manual

```bash
npm install
npm start
```

## Architecture

1. Node.js server serves static files + WebSocket signaling
2. Phone creates WebRTC offer, sends via WebSocket
3. PC receives offer, creates answer, sends back
4. Direct peer-to-peer video streaming begins
5. No STUN/TURN needed (VPN handles connectivity)

## Network Requirements

- All devices on same VPN network
- Server accessible on chosen port (default: 3000)
- WebRTC compatible browsers on phone/PC