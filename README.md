# TwitchBingoExtension

[![Package Twitch Extension](https://github.com/ccorsano/TwitchBingoExtension/actions/workflows/package_twitchext.js.yml/badge.svg?branch=main)](https://github.com/ccorsano/TwitchBingoExtension/actions/workflows/package_twitchext.js.yml)
[![Publish Frontend Docker Image](https://github.com/ccorsano/TwitchBingoExtension/actions/workflows/docker-publish-frontend.yml/badge.svg)](https://github.com/ccorsano/TwitchBingoExtension/actions/workflows/docker-publish-frontend.yml)

WIP : Twitch Live Bingo

# How to run
## Prerequisite
- node 14.x (or 15.x)
- yarn
- .net 5 for the backend

## Using Twitch developer rig
- Install Twitch developer rig
- Open the "Viewer Live Bingo.json" extension manifest
- Run the frontend
- Run the backend

## Altenatively
```
cd TwitchBingoService
dotnet watch run

cd twitch-bingo-extension
yarn start
```
