import { Command } from "commander";
import chalk from "chalk";
import { ILinkClient } from "../../core/ilink-client.js";
import { CDNHandler } from "../../media/cdn.js";
import { WxBot } from "../../bot/bot.js";
import { ConfigManager } from "../config.js";
import { ILINK_BASE_URL } from "../../core/constants.js";
import { renderMessage } from "../repl/renderer.js";

export const listenCommand = new Command("listen")
  .description("Listen for incoming messages and print to stdout")
  .option("--account <name>", "Account to use", "default")
  .action(async (options: { account: string }) => {
    const config = new ConfigManager();
    const account = config.getAccount(options.account);

    if (!account) {
      console.error(chalk.red(`Account "${options.account}" not found. Run: wx-bot-cli login`));
      process.exit(1);
    }

    const client = new ILinkClient({
      baseUrl: account.baseUrl || ILINK_BASE_URL,
      token: account.token,
      uin: account.uin,
    });
    const cdn = new CDNHandler(client);
    const bot = new WxBot(client, cdn);

    console.log(chalk.blue("Listening for messages... (Ctrl+C to stop)\n"));

    bot.on("message", (msg) => {
      console.log(renderMessage(msg));
    });

    bot.on("error", (err: Error) => {
      console.error(chalk.red(`Error: ${err.message}`));
    });

    await bot.start();

    process.on("SIGINT", () => {
      console.log(chalk.gray("\nStopping..."));
      bot.stop();
      process.exit(0);
    });
  });
