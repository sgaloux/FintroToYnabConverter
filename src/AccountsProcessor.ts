import { IMatchedFile } from "./interfaces/IMatchedFile";
import papa from "papaparse";
import fs from "fs";
import colors from "colors";
import pad from "pad";
import _ from "lodash";
import moment from "moment";

export class AccountsProcessor {
  processAll(): void {
    this.accounts.forEach(a => this.mergeAccountData(a));
  }
  private accountsFiles: { [account: string]: string[] } = {};

  addFile(account: string, filename: string): void {
    if (this.accountsFiles[account] == undefined) {
      this.accountsFiles[account] = [];
    }
    this.accountsFiles[account].push(filename);
  }

  get accounts() {
    return Object.keys(this.accountsFiles);
  }

  private readFintroCsvFile(file: string) {
    const content = fs.readFileSync(file, { encoding: "latin1" });
    const csvParsed = papa.parse(content.trim(), {
      delimiter: ";",
      header: true
    });
    if (csvParsed.errors.length > 0) {
      console.log(colors.red(`${csvParsed.errors.length} Errors occured : `));
      csvParsed.errors.forEach(e => {
        console.log(colors.red(` - ROW n° ${e.row} => ${e.message}`));
      });
    }
    return csvParsed;
  }

  private convertRowToYnabFormat(fintroCsvRow: any, fields: string[]) {
    const amount = +fintroCsvRow[fields[3]].replace(".", "").replace(",", ".");
    return {
      Check: fintroCsvRow[fields[0]],
      Date: moment(fintroCsvRow[fields[1]], "DD/MM/YYYY"),
      Payee: fintroCsvRow[fields[5]],
      Category: "",
      Memo: fintroCsvRow[fields[6]],
      Outflow: amount < 0 ? Math.abs(amount) : 0,
      Inflow: amount > 0 ? Math.abs(amount) : 0
    };
  }

  mergeAccountData(account: string) {
    const accountToProcess = this.accountsFiles[account];

    if (!accountToProcess) throw new Error(`Account ${account} not managed...`);
    const inOrder = _.sortBy(accountToProcess);

    console.log(inOrder);
    const merged = inOrder
      .map(this.readFintroCsvFile)
      .map(fileCsv =>
        fileCsv.data.map(rowData =>
          this.convertRowToYnabFormat(rowData, fileCsv.meta.fields)
        )
      );

    const sorted = _.chain(merged)
      .flatten()
      .uniq()
      .sortBy(["Date"])
      .map(d => ({
        ...d,
        Date: d.Date.format("DD/MM/YYYY")
      }))
      .value();

    const ynabCsv = papa.unparse(sorted, { header: true, delimiter: "," });

    const newName = `${account}-YNAB.csv`;

    fs.writeFileSync(newName, ynabCsv, { encoding: "utf-8" });
  }
}
