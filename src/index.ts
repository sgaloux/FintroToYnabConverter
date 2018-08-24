#!/usr/bin/env node
import path from "path";
import fs from "fs";
import papa from "papaparse";
import colors from "colors";
import pad from "pad";

import program from "commander";
import { cpus } from "os";

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

function convertRowToYnabFormat(fintroCsvRow: any, fields: string[]) {
  const amount = +fintroCsvRow[fields[3]].replace(".", "").replace(",", ".");
  return {
    Date: fintroCsvRow[fields[1]],
    Payee: fintroCsvRow[fields[5]],
    Category: "",
    Memo: fintroCsvRow[fields[6]],
    Outflow: amount < 0 ? Math.abs(amount) : 0,
    Inflow: amount > 0 ? Math.abs(amount) : 0
  };
}

program.arguments("<fintroFile>").action(fintroFile => {
  console.log(`file selected =>  ${fintroFile}`);
  if (!checkFileInput(fintroFile)) return;

  const fintroFileContent = fs.readFileSync(fintroFile, {
    encoding: "latin1"
  });

  const csvParsed = papa.parse(fintroFileContent.trim(), {
    delimiter: ";",
    header: true
  });
  if (csvParsed.errors.length > 0) {
    console.log(colors.red(`${csvParsed.errors.length} Errors occured : `));
    csvParsed.errors.forEach(e => {
      console.log(colors.red(` - ROW n° ${e.row} => ${e.message}`));
    });
  } else {
    const newFormat = csvParsed.data.map(row =>
      convertRowToYnabFormat(row, csvParsed.meta.fields)
    );
    const ynabCsv = papa.unparse(newFormat, {
      header: true,
      delimiter: ","
    });

    const newName = fintroFile.replace(".csv", "-YNAB.csv");

    fs.writeFileSync(newName, ynabCsv, { encoding: "utf-8" });

    console.log(colors.green(`YNAB File ${newName} written!`));
  }
});

program.parse(process.argv);
