import { Client, ClientOptions } from "discord.js";

(async () => {
  const options: ClientOptions = { intents: 'GUILD_MESSAGES' };

  const client: Client = new Client(options);
  
  await client.login(process.env.BOT_TOKEN);
})();
