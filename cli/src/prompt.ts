import readline from "node:readline";

export function promptYesNo(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY || !process.stderr.isTTY) {
      resolve(false);
      return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

export function promptOverwrite(filepath: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY || !process.stderr.isTTY) {
      resolve(true);
      return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
    rl.question(`\x1b[33m⚠\x1b[0m ${filepath} already exists. Overwrite? (y/N): `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}
