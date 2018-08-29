import papa from "papaparse";
import fs from "fs";
import colors from "colors";
import _ from "lodash";
import moment from "moment";
import * as path from "path";

export class AccountsProcessor {
  private noCheckNumber = 1;
  private accountsFiles: { [account: string]: string[] } = {};

  constructor(private basePath: string) {}

  addFile(account: string, filename: string): void {
    if (this.accountsFiles[account] == undefined) {
      this.accountsFiles[account] = [];
    }
    this.accountsFiles[account].push(filename);
  }

  get accounts() {
    return Object.keys(this.accountsFiles);
  }

  processAll(): void {
    this.accounts.forEach(a => this.mergeAccountData(a));
  }

  private readFintroCsvFile = (file: string) => {
    const content = fs.readFileSync(path.join(this.basePath, file), {
      encoding: "latin1"
    });
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
  };

  private getCheckNumber(numberText: string): string {
    const final =
      numberText.length === 5
        ? `9999-${(this.noCheckNumber++).toString().padStart(4, "0")}`
        : numberText;
    return final;
  }

  private convertRowToYnabFormat(fintroCsvRow: any, fields: string[]) {
    const amount = +fintroCsvRow[fields[3]].replace(".", "").replace(",", ".");

    return {
      Check: this.getCheckNumber(fintroCsvRow[fields[0]]),
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

    console.log(`Processing account ${account}\n`, inOrder);
    const merged = inOrder
      .map(this.readFintroCsvFile)
      .map(fileCsv =>
        fileCsv.data.map(rowData =>
          this.convertRowToYnabFormat(rowData, fileCsv.meta.fields)
        )
      );

    const sorted = _.chain(merged)
      .flatten()
      .sortBy(["Check", "Date"])
      .value();

    const years = _.chain(sorted)
      .map(d => d.Date.year())
      .uniq()
      .value();

    years.forEach(year => {
      const data = _.chain(sorted)
        .filter(d => d.Date.year() === year)
        .map(d => ({ ...d, Date: d.Date.format("DD/MM/YYYY") }))
        .uniqBy("Check")
        .value();

      const ynabCsv = papa.unparse(data, {
        header: true,
        delimiter: ","
      });

      const newName = `${year}-${account}-YNAB.csv`;

      const dir = `${year}`;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }

      fs.writeFileSync(path.join(dir, newName), ynabCsv, {
        encoding: "utf-8"
      });
    });
  }
}
