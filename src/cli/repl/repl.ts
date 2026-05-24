import * as readline from "node:readline";
import chalk from "chalk";
import type { WxBot } from "../../bot/bot.js";
import type { WxMessage } from "../../bot/message.js";
import { renderMessage } from "./renderer.js";

export class Repl {
  private rl: readline.Interface;
  private bot: WxBot;
  private lastSender: string | null = null;

  constructor(bot: WxBot) {
    this.bot = bot;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.green("> "),
    });
  }

  async start(): Promise<void> {
    this.bot.on("message", (msg: WxMessage) => {
      this.lastSender = msg.from;
      console.log(renderMessage(msg));
      this.rl.prompt();
    });

    this.bot.on("error", (err: Error) => {
      console.error(chalk.red(`Error: ${err.message}`));
    });

    this.rl.on("line", async (line: string) => {
      const input = line.trim();
      if (!input) { this.rl.prompt(); return; }

      if (input.startsWith("/")) {
        await this.handleCommand(input);
        this.rl.prompt();
        return;
      }

      let target = this.lastSender;
      let text = input;

      const atMatch = input.match(/^@(\S+)\s+(.+)$/);
      if (atMatch) {
        target = atMatch[1];
        text = atMatch[2];
      }

      if (!target) {
        console.log(chalk.yellow("No target. Use @userId <message> or wait for a message."));
        this.rl.prompt();
        return;
      }

      try {
        await this.bot.sendText(target, text);
      } catch (err) {
        console.error(chalk.red(`Send failed: ${(err as Error).message}`));
      }

      this.rl.prompt();
    });

    this.rl.on("close", () => {
      this.bot.stop();
      process.exit(0);
    });

    this.rl.prompt();
  }

  private async handleCommand(input: string): Promise<void> {
    const [cmd, ...args] = input.split(/\s+/);

    switch (cmd) {
      case "/help":
        console.log(chalk.blue("Commands:"));
        console.log("  /quit              Exit REPL");
        console.log("  /send <user> <msg> Send to specific user");
        console.log("  /clear             Clear screen");
        break;
      case "/quit":
        this.bot.stop();
        process.exit(0);
      case "/send": {
        const [user, ...msgParts] = args;
        const msg = msgParts.join(" ");
        if (user && msg) {
          await this.bot.sendText(user, msg);
        } else {
          console.log(chalk.yellow("Usage: /send <userId> <message>"));
        }
        break;
      }
      case "/clear":
        console.clear();
        break;
      default:
        console.log(chalk.yellow(`Unknown command: ${cmd}. Type /help for help.`));
    }
  }
}
