import { Command } from "commander";
import chalk from "chalk";
import { readFile } from "node:fs/promises";
import { ILinkClient } from "../../core/ilink-client.js";
import { CDNHandler } from "../../media/cdn.js";
import { WxBot } from "../../bot/bot.js";
import { ConfigManager } from "../config.js";
import { ILINK_BASE_URL } from "../../core/constants.js";
import { MessageItemType } from "../../core/types.js";

export const sendCommand = new Command("send")
  .description("Send a message to a WeChat user")
  .argument("<target>", "Target user ID")
  .argument("[message]", "Text message to send")
  .option("--image <path>", "Send an image file")
  .option("--file <path>", "Send a file")
  .option("--video <path>", "Send a video")
  .option("--account <name>", "Account to use", "default")
  .action(async (target: string, message: string | undefined, options: { image?: string; file?: string; video?: string; account: string }) => {
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

    try {
      if (options.image) {
        const data = await readFile(options.image);
        const media = await cdn.upload(data, MessageItemType.IMAGE);
        await bot.sendImage(target, media);
        console.log(chalk.green("Image sent."));
      } else if (options.file) {
        const data = await readFile(options.file);
        const fileName = options.file.split("/").pop() ?? "file";
        const media = await cdn.upload(data, MessageItemType.FILE, fileName);
        await bot.sendFile(target, media, fileName);
        console.log(chalk.green("File sent."));
      } else if (options.video) {
        const data = await readFile(options.video);
        const media = await cdn.upload(data, MessageItemType.VIDEO);
        await bot.sendVideo(target, media);
        console.log(chalk.green("Video sent."));
      } else if (message) {
        await bot.sendText(target, message);
        console.log(chalk.green("Message sent."));
      } else {
        console.error(chalk.red("Provide a message text or --image/--file/--video flag."));
        process.exit(1);
      }
    } catch (err) {
      console.error(chalk.red(`Send failed: ${(err as Error).message}`));
      process.exit(1);
    }
  });
