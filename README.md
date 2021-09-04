# Baby Koala

![](logo.jpg)

Discord Bot for Monash Esports Club

## Modules

- **discord** - The `discord.js` module for interacting with Discord's official API. Additionally, it uses the guild members fetch function to retrieve all the currently registered members.
- **mongo** - A NoSQL database that allows the bot to persist and synchronize settings, users and user points data.
- **cron** - The `node-cron` module allows for easy scheduling of users data synchronization task with a cron expression. The schedule is stored in the `Settings` collection.

## Commands

- **/leaderboard** - View game leaderboard
  - *game*: The name of the game to display
- **/user** - View your records
  - *game*: The name of the game to display
