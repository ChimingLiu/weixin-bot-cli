import { Command } from "commander";
import chalk from "chalk";
import { ILinkClient } from "../../core/ilink-client.js";
import { CDNHandler } from "../../media/cdn.js";
import { WxBot } from "../../bot/bot.js";
import { ConfigManager } from "../config.js";
import { ILINK_BASE_URL } from "../../core/constants.js";
import type { WxMessage } from "../../bot/message.js";

function extractText(msg: WxMessage): string {
  const parts: string[] = [];
  for (const item of msg.items) {
    if (item.type === "text") {
      parts.push(item.text);
    } else {
      parts.push(`[${item.type}]`);
    }
  }
  return parts.join(" ");
}

function waitForMessage(
  bot: WxBot,
  filter: (msg: WxMessage) => boolean,
  timeoutMs: number
): Promise<WxMessage | null> {
  return new Promise<WxMessage | null>((resolve) => {
    const timer = setTimeout(() => {
      bot.removeListener("message", onMessage);
      resolve(null);
    }, timeoutMs);

    function onMessage(msg: WxMessage) {
      if (msg.isFromBot) return;
      if (!filter(msg)) return;

      clearTimeout(timer);
      bot.removeListener("message", onMessage);
      resolve(msg);
    }

    bot.on("message", onMessage);
  });
}

export const approveCommand = new Command("approve")
  .description(
    "Send a message and wait for the user's reply (blocking)\n" +
      "Without --to, waits for the first incoming message to discover the user."
  )
  .option("--to <userId>", "Target WeChat user ID (defaults to most recent sender)")
  .requiredOption("--text <message>", "Message to send")
  .option("--timeout <seconds>", "Timeout in seconds", "300")
  .option("--account <name>", "Account to use", "default")
  .action(
    async (options: {
      to?: string;
      text: string;
      timeout: string;
      account: string;
    }) => {
      const config = new ConfigManager();
      const account = config.getAccount(options.account);

      if (!account) {
        console.error(
          chalk.red(
            `Account "${options.account}" not found. Run: wx-bot-cli login`
          )
        );
        process.exit(1);
      }

      const timeoutMs = Number(options.timeout) * 1000;
      if (isNaN(timeoutMs) || timeoutMs <= 0) {
        console.error(chalk.red("Invalid timeout value."));
        process.exit(1);
      }

      const client = new ILinkClient({
        baseUrl: account.baseUrl || ILINK_BASE_URL,
        token: account.token,
        uin: account.uin,
      });
      const cdn = new CDNHandler(client);
      const bot = new WxBot(client, cdn);

      let targetUserId = options.to;

      // Start the bot (begins long-polling for messages)
      await bot.start().catch((err) => {
        console.error(chalk.red(`Bot error: ${err.message}`));
        process.exit(1);
      });

      // If no --to, wait for the first message to discover the user
      if (!targetUserId) {
        console.error(
          chalk.gray("No --to specified, waiting for a message to discover user...")
        );

        const firstMsg = await waitForMessage(bot, () => true, timeoutMs);

        if (!firstMsg) {
          console.error(
            chalk.yellow(`TIMEOUT: No message received within ${options.timeout}s`)
          );
          bot.stop();
          process.exit(1);
        }

        targetUserId = firstMsg.from;
        console.error(chalk.gray(`Discovered user: ${targetUserId}`));
      }

      // Send the approval question
      try {
        await bot.sendText(targetUserId, options.text);
        console.error(
          chalk.gray(`Message sent to ${targetUserId}, waiting for reply...`)
        );
      } catch (err) {
        console.error(chalk.red(`Send failed: ${(err as Error).message}`));
        bot.stop();
        process.exit(1);
      }

      // Wait for reply from the target user
      const reply = await waitForMessage(
        bot,
        (msg) => msg.from === targetUserId,
        timeoutMs
      );

      bot.stop();

      if (!reply) {
        console.error(
          chalk.yellow(
            `TIMEOUT: No reply from ${targetUserId} within ${options.timeout}s`
          )
        );
        process.exit(1);
      }

      // stdout = clean text for programmatic consumption
      process.stdout.write(extractText(reply) + "\n");
      process.exit(0);
    }
  );
