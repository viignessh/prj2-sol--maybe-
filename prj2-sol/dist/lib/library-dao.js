import * as mongo from 'mongodb';
import { Errors } from 'cs544-js-utils';
import * as Lib from './library.js';
export async function makeLibraryDao(dbUrl) {
    return await LibraryDao.make(dbUrl);
}
const MONGO_OPTIONS = {
    ignoreUndefined: true,
};
/**
 * Compares two Book objects and returns the name of the first differing field
 * or undefined if they are the same.
 */
function compareBook(existingBook, newBook) {
    for (const key in existingBook) {
        if (existingBook.hasOwnProperty(key)) {
            const existingValue = existingBook[key]; // Type assertion
            const newValue = newBook[key]; // Type assertion
            if (existingValue !== newValue) {
                return key; // Return the name of the first differing field
            }
        }
    }
    return undefined; // Return undefined if all fields are the same
}
export class LibraryDao {
    client;
    db;
    constructor(client, db) {
        this.client = client;
        this.db = db;
    }
    static async make(dbUrl) {
        try {
            const client = new mongo.MongoClient(dbUrl, MONGO_OPTIONS);
            await client.connect();
            const db = client.db(); // Connect to default DB in URL
            // Create unique index on ISBN
            await db.collection('books').createIndex({ isbn: 1 }, { unique: true });
            // Create text index on title for text search
            await db.collection('books').createIndex({ title: 'text' });
            return Errors.okResult(new LibraryDao(client, db));
        }
        catch (error) {
            return Errors.errResult(error.message, { code: 'DB_CONNECTION_ERROR' });
        }
    }
    async findBookByISBN(isbn) {
        try {
            const book = await this.db.collection('books').findOne({ isbn });
            return book ? Errors.okResult(book) : Errors.okResult(null);
        }
        catch (error) {
            return Errors.errResult(error.message, { code: 'DB_FIND_ERROR' });
        }
    }
    async updateCopies(isbn, nCopies) {
        try {
            await this.db.collection('books').updateOne({ isbn }, { $inc: { nCopies } });
            return Errors.okResult(undefined);
        }
        catch (error) {
            return Errors.errResult(error.message, { code: 'DB_UPDATE_ERROR' });
        }
    }
    async addBook(book) {
        try {
            await this.db.collection('books').insertOne(book);
            return Errors.okResult(book);
        }
        catch (error) {
            return Errors.errResult(error.message, { code: 'DB_INSERT_ERROR' });
        }
    }
    async clear() {
        try {
            await this.db.collection('books').deleteMany({}); // Clears all books from the collection
            return Errors.okResult(undefined);
        }
        catch (error) {
            return Errors.errResult(error.message, { code: 'DB_CLEAR_ERROR' });
        }
    }
    async findBooks(req) {
        try {
            const collection = this.db.collection('books'); // Use the correct collection
            const normalizedSearchString = req.search.replace(/[^a-zA-Z0-9\s]/g, '');
            const searchWords = normalizedSearchString
                .split(' ')
                .filter(word => word.length > 1)
                .map(word => `"${word}"`) // Correctly quote the words for a text search
                .join(' ');
            const query = {
                $text: { $search: searchWords }
            };
            const projection = { _id: 0 }; // Exclude _id from the result
            const rawResults = await collection.find(query, { projection })
                .sort({ title: 1 })
                .skip(req.index)
                .limit(req.count)
                .toArray();
            // Map raw results to Lib.XBook type
            const results = rawResults.map(book => ({
                isbn: book.isbn,
                title: book.title,
                authors: book.authors,
                pages: book.pages,
                year: book.year,
                publisher: book.publisher,
                nCopies: book.nCopies
            }));
            return Errors.okResult(results);
        }
        catch (err) {
            return Errors.errResult(err.message, 'DB');
        }
    }
    async checkoutBook(isbn, patronId) {
        try {
            // Check if the book exists and has copies available
            const book = await this.db.collection('books').findOne({ isbn });
            if (book && book.nCopies && book.nCopies > 0) {
                // Decrease the number of copies
                await this.db.collection('books').updateOne({ isbn }, { $inc: { nCopies: -1 } });
                // Log the checkout in the checkouts collection
                await this.db.collection('checkouts').insertOne({
                    isbn,
                    patronId,
                    checkedOutAt: new Date() // Optional: record when it was checked out
                });
                return Errors.okResult(undefined);
            }
            else {
                return Errors.errResult('No copies available for checkout', { code: 'NO_COPIES' });
            }
        }
        catch (error) {
            return Errors.errResult(error.message, { code: 'DB_CHECKOUT_ERROR' });
        }
    }
    async hasPatronCheckedOutBook(isbn, patronId) {
        try {
            // Check the checkouts collection to see if this patron has checked out this book
            const checkoutRecord = await this.db.collection('checkouts').findOne({ isbn, patronId });
            return Errors.okResult(!!checkoutRecord); // Return true if a record exists, false otherwise
        }
        catch (error) {
            return Errors.errResult(error.message, { code: 'DB_CHECKOUT_ERROR' });
        }
    }
    async returnBook(req) {
        // Validate the incoming request
        const validation = Lib.validate('returnBook', req); // Assuming you have a ReturnRequest type defined in your Lib module
        if (!validation.isOk) {
            return Errors.errResult("Invalid return parameters", 'BAD_REQ');
        }
        const { isbn, patronId } = validation.val;
        try {
            // Check if the patron has checked out the book
            const checkoutRecord = await this.db.collection('checkouts').findOne({ isbn, patronId });
            // If no record exists, the return should be rejected
            if (!checkoutRecord) {
                return Errors.errResult("Patron has not checked out this book", { code: 'NOT_CHECKED_OUT' });
            }
            // Proceed to increase the number of copies
            await this.db.collection('books').updateOne({ isbn }, { $inc: { nCopies: 1 } });
            // Remove the checkout record to prevent repeated returns
            await this.db.collection('checkouts').deleteOne({ isbn, patronId });
            return Errors.okResult(undefined);
        }
        catch (error) {
            return Errors.errResult(error.message, { code: 'DB_RETURN_ERROR' });
        }
    }
    async close() {
        try {
            await this.client.close(); // Close the MongoDB connection
            return Errors.okResult(undefined); // Return a success result if closing succeeds
        }
        catch (error) {
            return Errors.errResult('Failed to close the MongoDB connection.', {
                code: 'CLOSE_ERROR',
                detail: error.message
            });
        }
    }
}
//# sourceMappingURL=library-dao.js.map