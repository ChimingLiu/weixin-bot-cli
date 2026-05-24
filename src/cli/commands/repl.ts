import { Command } from "commander";
import chalk from "chalk";
import { ILinkClient } from "../../core/ilink-client.js";
import { CDNHandler } from "../../media/cdn.js";
import { WxBot } from "../../bot/bot.js";
import { ConfigManager } from "../config.js";
import { ILINK_BASE_URL } from "../../core/constants.js";
import { Repl } from "../repl/repl.js";

export const replCommand = new Command("repl")
  .description("Start interactive REPL mode")
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

    console.log(chalk.blue("wx-bot-cli REPL — type /help for commands\n"));

    await bot.start();

    const repl = new Repl(bot);
    await repl.start();
  });
