import Database from "better-sqlite3";
import type { IDBDocument, ITransaction } from "../util/common.js";

class DBController {
    // Singleton
    static #instance: DBController;
    public static get instance(): DBController {
        if (!DBController.#instance) {
            DBController.#instance = new DBController();
        }
        return DBController.#instance;
    }

    #db: Database.Database;
    private get db(): Database.Database {
        return this.#db;
    }

    private constructor() {
        this.#db = new Database("finance.db");
        this.db
            .prepare(
                `CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT,reference TEXT,amount REAL NOT NULL,tags TEXT,description TEXT,date TEXT NOT NULL)`
            )
            .run();
    }

    static getDbDocument(txn: ITransaction): IDBDocument {
        return {
            ...txn,
            tags: txn.tags.join(","),
        };
    }

    static getTransaction(txn: IDBDocument): ITransaction {
        return {
            ...txn,
            tags: txn.tags ? txn.tags.split(",") : [],
        };
    }

    add(txn: ITransaction): number {
        const stmt = this.db.prepare(
            `INSERT INTO transactions (reference, amount, tags, description, date) VALUES (?, ?, ?, ?, ?)`
        );
        const doc = DBController.getDbDocument(txn);
        const info = stmt.run(
            doc.reference,
            doc.amount,
            doc.tags,
            doc.description,
            doc.date
        );
        return info.lastInsertRowid as number;
    }

    getAll(): ITransaction[] {
        const rows = this.db
            .prepare(`SELECT * FROM transactions ORDER BY date DESC`)
            .all() as IDBDocument[];
        return rows.map(DBController.getTransaction);
    }

    findByReference(ref: string): ITransaction | undefined {
        const row = this.db
            .prepare(`SELECT * FROM transactions WHERE reference = ?`)
            .get(ref) as IDBDocument;
        if (!row) return undefined;
        return DBController.getTransaction(row);
    }

    search(term: string): ITransaction[] {
        const rows = this.db
            .prepare(
                `
                SELECT * FROM transactions
                WHERE tags LIKE ? OR description LIKE ? OR reference LIKE ?
                `
            )
            .all(`%${term}%`, `%${term}%`, `%${term}%`) as IDBDocument[];
        return rows.map(DBController.getTransaction);
    }

    update(id: number, data: Partial<ITransaction>): void {
        const existing = this.db
            .prepare(`SELECT * FROM transactions WHERE id = ?`)
            .get(id) as IDBDocument;
        if (!existing) throw new Error("Transaction not found");

        const updated = {
            ...existing,
            ...data,
            tags: data.tags ? data.tags.join(",") : existing.tags,
        };

        this.db
            .prepare(
                `
                UPDATE transactions
                SET reference = ?, amount = ?, tags = ?, description = ?, date = ?
                WHERE id = ?
                `
            )
            .run(
                updated.reference,
                updated.amount,
                updated.tags,
                updated.description,
                updated.date,
                id
            );
    }

    delete(id: number): void {
        this.db.prepare(`DELETE FROM transactions WHERE id = ?`).run(id);
    }
}

export const dbController = DBController.instance;
