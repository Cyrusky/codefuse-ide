import { Injectable } from "@opensumi/di";
import { getShellPath } from "@opensumi/ide-core-node/lib/bootstrap/shell-path";
import { PtyService } from "@opensumi/ide-terminal-next/lib/node/pty";

import {
  bashIntegrationPath,
  initShellIntegrationFile,
} from "./shell-integration";
import type { ITerminalLaunchError } from "@opensumi/ide-terminal-next";

@Injectable({ multiple: true })
export class AIPtyService extends PtyService {
  async start(): Promise<ITerminalLaunchError | undefined> {
    const { shellLaunchConfig } = this;

    let ptyEnv: { [key: string]: string | undefined } | undefined;
    if (shellLaunchConfig.strictEnv) {
      ptyEnv = shellLaunchConfig.env as { [key: string]: string | undefined };
    } else {
      ptyEnv = {
        ...process.env,
        PATH: await getShellPath(),
        LC_ALL: `zh_CN.UTF-8`,
        LANG: `zh_CN.UTF-8`,
        ...shellLaunchConfig.env,
      };
    }

    if (shellLaunchConfig.executable?.includes("bash")) {
      await initShellIntegrationFile();
      if (!shellLaunchConfig.args) {
        shellLaunchConfig.args = [];
      }
      if (Array.isArray(shellLaunchConfig.args)) {
        shellLaunchConfig.args.push("--init-file", bashIntegrationPath);
      }
    }

    this._ptyOptions["env"] = ptyEnv;

    try {
      await this.setupPtyProcess();
      return undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      this.logger.error("IPty#spawn native exception", err);
      return {
        message: `A native exception occurred during launch (${err.message})`,
      };
    }
  }
}
