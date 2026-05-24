import Conf from "conf";

export interface AccountData {
  token: string;
  uin: string;
  baseUrl: string;
  createdAt: string;
}

interface ConfigSchema {
  accounts: Record<string, AccountData>;
  defaultAccount: string;
}

export class ConfigManager {
  private conf: Conf<ConfigSchema>;

  constructor() {
    this.conf = new Conf<ConfigSchema>({
      projectName: "wx-bot-cli",
      defaults: {
        accounts: {},
        defaultAccount: "default",
      },
    });
  }

  saveAccount(name: string, token: string, uin: string, baseUrl: string): void {
    const accounts = this.conf.get("accounts");
    accounts[name] = { token, uin, baseUrl, createdAt: new Date().toISOString() };
    this.conf.set("accounts", accounts);
  }

  getAccount(name: string): AccountData | undefined {
    const accounts = this.conf.get("accounts");
    return accounts[name];
  }

  getDefaultAccount(): AccountData | undefined {
    const name = this.conf.get("defaultAccount");
    return this.getAccount(name);
  }

  getDefaultAccountName(): string {
    return this.conf.get("defaultAccount");
  }

  setDefaultAccount(name: string): void {
    this.conf.set("defaultAccount", name);
  }

  listAccounts(): string[] {
    return Object.keys(this.conf.get("accounts"));
  }

  deleteAccount(name: string): void {
    const accounts = this.conf.get("accounts");
    delete accounts[name];
    this.conf.set("accounts", accounts);
  }
}
