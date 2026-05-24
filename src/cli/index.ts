import { Command } from "commander";
import { loginCommand } from "./commands/login.js";
import { sendCommand } from "./commands/send.js";
import { listenCommand } from "./commands/listen.js";
import { replCommand } from "./commands/repl.js";

const program = new Command();

program
  .name("wx-bot-cli")
  .description("WeChat bot CLI based on iLink protocol")
  .version("0.1.0")
  .option("--account <name>", "Account name", "default")
  .option("--verbose", "Verbose logging");

program.addCommand(loginCommand);
program.addCommand(sendCommand);
program.addCommand(listenCommand);
program.addCommand(replCommand);

program.parse();
