import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

import readline from "node:readline";

import chalk, { type ChalkInstance } from "chalk";
import { TxnLine } from "./util/common.js";
import { dbController } from "./db/controller.js";

const FINANCE_FOLDER_PATH = "/home/srikar/Documents/finance";
let ABORT_ERR_FLAG = false;

async function handleTxn(txn: TxnLine | null) {
    if (!(txn instanceof TxnLine)) {
        return;
    }

    const Interface = readline.promises.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const txnType: { emoji: string; color: ChalkInstance } = txn.isCredit
        ? { emoji: "🟢", color: chalk.green }
        : { emoji: "🔴", color: chalk.red };

    const coloredAmount = txnType.color(
        `${Math.abs(txn.value)} ${txnType.emoji}`
    );

    const OUTPUT = `Date: ${txn.date.toLocaleString()}; Amount: ${coloredAmount}; Description: ${txn.description}\n`;

    try {
        const answer = await Interface.question(OUTPUT);
        if (!answer) throw "Empty response";
        dbController.add({
            amount: txn.value,
            date: txn.date.toISOString(),
            description: txn.description,
            reference: txn.ref,
            tags: answer.split(","),
        });
    } catch (error: any) {
        if (error?.code === "ABORT_ERR") {
            console.log(chalk.red("Process aborted manually..."));
            ABORT_ERR_FLAG = true;
        }
        console.log(chalk.red(error));
    }

    Interface.close();
    return;
}

function getTxnLineFromLine(line: string): TxnLine | null {
    if (!line || line.length === 0) return null;
    const values = line.split("\t").map((x) => x.trim());
    const txnDate = values[0];
    // const valueDate = values[1];
    const description = values[2];
    const ref = values[3];
    const debit = values[4];
    const credit = values[5];
    // const balance = values[6];

    const txn = new TxnLine(
        txnDate || "",
        description || "",
        ref || "",
        debit || "",
        credit || ""
    );
    return isNaN(txn.date as any) ? null : txn;
}

async function readFolder(folderPath: string) {
    if (!existsSync(folderPath)) {
        return;
    }

    const files = readdirSync(folderPath).filter((f) => f.endsWith(".xls"));

    if (files.length === 0) {
        return;
    }

    for (const file of files) {
        const fullPath = join(folderPath, file);
        console.log("Reading: ", fullPath);
        const data = readFileSync(fullPath, { encoding: "utf-8" });

        const lines = data.split("\n");

        let hasStarted = false;
        for (let i = 0; i < lines.length; i++) {
            if (hasStarted) {
                const txn = getTxnLineFromLine(lines[i] || "");
                await handleTxn(txn);
                if (ABORT_ERR_FLAG) return;
            }

            if (lines[i]?.includes("Txn Date")) {
                hasStarted = true;
                continue;
            }
        }

        return;
    }
}

if (import.meta.main) {
    readFolder(FINANCE_FOLDER_PATH);
}
