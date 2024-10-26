import * as mongo from 'mongodb';
import { Errors } from 'cs544-js-utils';
import * as Lib from './library.js';
export declare function makeLibraryDao(dbUrl: string): Promise<Errors.Result<LibraryDao>>;
export declare class LibraryDao {
    private client;
    private db;
    constructor(client: mongo.MongoClient, db: mongo.Db);
    static make(dbUrl: string): Promise<Errors.Result<LibraryDao>>;
    findBookByISBN(isbn: string): Promise<Errors.Result<Lib.Book | null>>;
    updateCopies(isbn: string, nCopies: number): Promise<Errors.Result<void>>;
    addBook(book: Lib.Book): Promise<Errors.Result<Lib.Book>>;
    clear(): Promise<Errors.Result<void>>;
    findBooks(req: Lib.Find): Promise<Errors.Result<Lib.XBook[]>>;
    checkoutBook(isbn: string, patronId: string): Promise<Errors.Result<void>>;
    hasPatronCheckedOutBook(isbn: string, patronId: string): Promise<Errors.Result<boolean>>;
    returnBook(req: Record<string, any>): Promise<Errors.Result<void>>;
    close(): Promise<Errors.Result<void>>;
}
//# sourceMappingURL=library-dao.d.ts.map