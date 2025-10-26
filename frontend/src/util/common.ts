export class TxnLine {
    date: Date;
    description: string;
    ref: string;
    debit: number;
    credit: number;
    value: number;
    isCredit: boolean;

    constructor(
        date: string | Date,
        description: string,
        ref: string,
        debit: any,
        credit: any
    ) {
        const getNum = (data: any): number => {
            const newData =
                typeof data === "string" ? data.replace(/[^0-9.]/g, "") : data;
            if (isNaN(parseFloat(newData))) {
                return 0.0;
            }
            return parseFloat(newData);
        };

        this.date = typeof date === "string" ? new Date(date) : date;
        this.description = description;
        this.ref = ref;
        this.debit = getNum(debit);
        this.credit = getNum(credit);
        this.isCredit = this.credit > 0;
        this.value = this.credit ? this.credit : -this.debit;
    }
}

export interface IDBDocument {
    // id?: number;
    reference: string;
    amount: number;
    tags: string;
    description: string;
    date: string;
}

export interface ITransaction {
    reference: string;
    amount: number;
    tags: string[];
    description: string;
    date: string;
}
