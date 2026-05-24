import chalk from "chalk";
import type { WxMessage, ParsedMessageItem } from "../../bot/message.js";

export function renderMessage(msg: WxMessage): string {
  const sender = msg.isFromBot ? chalk.gray("[bot]") : chalk.cyan(`[${msg.from}]`);
  const items = msg.items.map(renderItem).join(" ");
  return `${sender} ${items}`;
}

function renderItem(item: ParsedMessageItem): string {
  switch (item.type) {
    case "text": return item.text;
    case "image": return chalk.yellow("[image]");
    case "voice": return chalk.yellow("[voice]");
    case "file": return chalk.yellow(`[file: ${item.fileName}]`);
    case "video": return chalk.yellow("[video]");
    default: return chalk.gray("[unknown]");
  }
}
