# Codenames

This is toy project. It is [Codenames](https://boardgamegeek.com/boardgame/178900/codenames) 
built with WebRTC and Quasar/Vue.  Check out the [Game/ directory](frontend/src/pages/Game) 
and peek around there for relevant source code.

![What it looks like](https://i.imgur.com/6nQv4F5.png)

## Motivation

I needed to evaluate data connections under WebRTC.


## Building

```
cp .env.template .env
docker-compose up -d # for development
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d # for production
```
