#!/usr/bin/env node

import inquirer, { Questions, Question } from "inquirer";
import colors from "colors";
import fs from "fs";
import filePath from "inquirer-file-path";
import path from "path";
import papa from "papaparse";
import pad from "pad";

inquirer.registerPrompt("filepath", filePath);

const getSourceCSVFile = async () => {
  const fileQuestion = {
    type: "filepath",
    name: "fintrocsv",
    message: "Please select input csv file (Fintro format)",
    basePath: "./"
  } as Question;

  const questions: Questions<{ fintrocsv: string }> = [fileQuestion];

  while (true) {
    const answers = await inquirer.prompt(questions);
    if (answers.fintrocsv.endsWith(".csv")) {
      return answers.fintrocsv;
    }
    console.log(colors.red("The file selected is not a CSV file !"));
  }
};

(async () => {
  const file = await getSourceCSVFile();
  const fileSelected = path.join("./", file);
  const fintroFileContent = fs.readFileSync(fileSelected, {
    encoding: "utf-8"
  });
  console.log("source read, nb lines : ", fintroFileContent.split("\n").length);

  const csvParsed = papa.parse(fintroFileContent, {
    delimiter: ";",
    header: true
  });
  if (csvParsed.errors.length > 0) {
    console.log(colors.red(`${csvParsed.errors.length} Errors occured : `));
    csvParsed.errors.forEach(e => {
      console.log(colors.red(pad(15, e.message)));
    });
  } else {
  }
})();
