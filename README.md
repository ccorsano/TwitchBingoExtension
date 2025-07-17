# Twitch Bingo Extension

[![Package Twitch Extension](https://github.com/ccorsano/TwitchBingoExtension/actions/workflows/package_twitchext.js.yml/badge.svg?branch=main)](https://github.com/ccorsano/TwitchBingoExtension/actions/workflows/package_twitchext.js.yml)
[![Publish Frontend Docker Image](https://github.com/ccorsano/TwitchBingoExtension/actions/workflows/docker-publish-frontend.yml/badge.svg)](https://github.com/ccorsano/TwitchBingoExtension/actions/workflows/docker-publish-frontend.yml)

# Twitch Live Bingo

## Description

Svelte rewrite: easier dev for me, lighter application to load.
Please consider this as a minimum viable version of this extension, and check regularly for updates.
Note: This extension is dependent on a extension service, which for this initial release is not scaled for a large viewing audience.

Customizable & interactive bingo games for streamers communities:
- Have yourself or your moderation team come up with stream events viewers should pay attention to.
- Let viewers spot and report the events as they appear on your stream
- Moderators as well as yourself can confirm or reject reported events
- When an event is reported, moderators have 2 minutes (configurable) to confirm it actually happened
- After the event is confirmed, viewers have a the same configurable grace period to report it

The extension will celebrate the most attentive viewers by posting messages on the chat.

## Feature summary

- Broadcaster can configure a number of bingo entries, meant to represent funny occurrences that happen regularly on his Stream
- These entries will be presented (randomized) on a configurable Bingo grid, to each participating Viewer
- Viewers must report the funny occurrences as they occur
- Moderators and the broadcaster must then confirm the occurrence
- Viewers must pay extra attention to the stream to complete their grid
- An EBS is used to keep track of the game and send notifications to moderators and viewers
- A Live Configuration view is provided for convenience, and mirror the features of the static Configuration page.

## Stack

### Twitch Extension
- Svelte 4
- Vite
- Typescript
- typesafe-i18n
- SMUI (for configuration screens)

### Extension Backend Service
- .net 7
- asp.net core
- Redis for storage

## How to run
### Prerequisite
- node 22.x
- .net 7 for the backend

### Configuration

This is a Twitch extension project, as such you will need a Twitch Extension project created on your console on the [![Twitch dev console](https://dev.twitch.tv)](https://dev.twitch.tv) in order to use the rig.

The client code will be using the Twitch extension helper to send authenticated request using the extension secret as a signing key, as described in Twitch extension development documentation.

In addition, to call into the Twitch Helix API (for user name resolution), the EBS uses a Twitch app ClientId and Secret, that you can request on the [![Twitch dev console](https://dev.twitch.tv)](https://dev.twitch.tv) as well.

Non-confidential settings can be set in the appsettings.json file.

Secrets are meant to be stored in secure storage.


#### Secrets and credentials

Secrets and credentials are loaded in the EBS as configuration.

For development, use the User Secrets feature as below or the Development appsetting.Development.json (but careful not to submit).

For deployment, Env variables will be loaded for configuration.

#### Setting required secrets for development

This is the crossplatform way, using the dotnet cli:
```
cd TwitchBingoService
dotnet user-secrets set "twitch:ExtensionId" "<your_twitch_extension_clientid>"
dotnet user-secrets set "twitch:ExtensionSecret" "<your_twitch_extension_secret>"
dotnet user-secrets set "twitch:ClientId" "<your_twitch_app_clientid>"
dotnet user-secrets set "twitch:ClientSecret" "<your_twitch_app_secret>"
```

### Using Twitch developer rig
- Install Twitch developer rig
- Open the "Viewer Live Bingo.json" extension manifest
- Run the frontend
- Run the backend

### Alternatively
```
cd TwitchBingoService
dotnet watch run

cd twitch-bingo-extension
npm run start
```
