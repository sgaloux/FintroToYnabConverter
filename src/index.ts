#!/usr/bin/env node

import inquirer, { Questions, Question } from "inquirer";
import colors from "colors";
import filePath from "inquirer-file-path";
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

const process = async () => {
  const file = await getSourceCSVFile();
  console.log("File selected", file);
};

process();
