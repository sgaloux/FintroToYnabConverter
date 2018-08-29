#!/usr/bin/env node
import path from "path";
import fs from "fs";
import papa from "papaparse";
import colors from "colors";
import pad from "pad";

import program from "commander";
import { AccountsProcessor } from "./AccountsProcessor";
import { IMatchedFile } from "./interfaces/IMatchedFile";

function checkFileInput(file: string) {
  if (!fs.existsSync(file)) {
    console.log(colors.red(`'${file}' is not a file`));
    return false;
  }
  if (!file.toLowerCase().endsWith(".csv")) {
    console.log(colors.red("The file must be a *.csv"));
    return false;
  }
  return true;
}

function matchStructure(file: string): IMatchedFile | null {
  const regex = /^(BE\d{14})-(\d{8}).csv$/gm;
  const m = regex.exec(file);
  if (m === null) return null;
  return {
    account: m[1],
    filename: file
  };
}

function scanFolder(folder: string) {
  const files = fs.readdirSync(folder);

  const processor = new AccountsProcessor(folder);

  const validFiles = files
    .map(matchStructure)
    .filter(s => s !== null) as IMatchedFile[];

  validFiles.forEach(f => processor.addFile(f.account, f.filename));
  processor.processAll();
}

program
  .command("scan")
  .alias("s")
  .description(
    "Scan a folder for fintro exports (csv files), merge and convert them to ynab format"
  )
  .arguments("<folder>")
  .action(scanFolder);

program.parse(process.argv);
