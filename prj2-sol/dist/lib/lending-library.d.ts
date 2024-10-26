import { Errors } from 'cs544-js-utils';
import { LibraryDao } from './library-dao.js';
import * as Lib from './library.js';
/************************ Main Implementation **************************/
export declare function makeLendingLibrary(dao: LibraryDao): LendingLibrary;
export declare class LendingLibrary {
    private readonly dao;
    constructor(dao: LibraryDao);
    /** Clear out the underlying database */
    clear(): Promise<Errors.Result<void>>;
    /** Add one or more copies of a book */
    addBook(req: Record<string, any>): Promise<Errors.Result<Lib.XBook>>;
    /** Find books by search criteria */
    findBooks(req: Record<string, any>): Promise<Errors.Result<Lib.XBook[]>>;
    /** Checkout a book for a patron */
    /** Checkout a book for a patron */
    /** Checkout a book for a patron */
    checkoutBook(req: Record<string, any>): Promise<Errors.Result<void>>;
    /** Return a book for a patron */
    returnBook(req: Record<string, any>): Promise<Errors.Result<void>>;
}
//# sourceMappingURL=lending-library.d.ts.map