import { Command } from "commander";
import qrcode from "qrcode-terminal";
import chalk from "chalk";
import { AuthManager } from "../../core/auth.js";
import { ConfigManager } from "../config.js";
import { ILINK_BASE_URL } from "../../core/constants.js";
import { generateUin } from "../../media/crypto.js";

export const loginCommand = new Command("login")
  .description("Scan QR code to login to WeChat")
  .option("--account <name>", "Account name to save as", "default")
  .action(async (options: { account: string }) => {
    const config = new ConfigManager();
    const auth = new AuthManager(ILINK_BASE_URL);

    console.log(chalk.blue("Starting WeChat login..."));

    try {
      const { qrcodeId, qrImageUrl } = await auth.startLogin();

      console.log(chalk.yellow("\nScan this QR code with WeChat:\n"));

      if (qrImageUrl.startsWith("data:")) {
        console.log(chalk.gray("[QR code is a data URI — scan the image from the URL below]"));
        console.log(chalk.cyan(qrImageUrl.slice(0, 80) + "..."));
      } else if (qrImageUrl) {
        qrcode.generate(qrImageUrl, { small: true });
      } else {
        qrcode.generate(`https://ilinkai.weixin.qq.com/ilink/bot/qrcode/${qrcodeId}`, { small: true });
      }

      console.log(chalk.gray("\nWaiting for scan confirmation..."));

      const { token, baseUrl, botId } = await auth.pollLoginStatus(qrcodeId);

      const uin = generateUin();
      config.saveAccount(options.account, token, uin, baseUrl);

      console.log(chalk.green(`\nLogin successful! Saved as account "${options.account}".`));
      console.log(chalk.gray(`Bot ID: ${botId}`));
      console.log(chalk.gray(`Token: ${token.slice(0, 8)}...`));
    } catch (err) {
      console.error(chalk.red(`Login failed: ${(err as Error).message}`));
      process.exit(1);
    }
  });
