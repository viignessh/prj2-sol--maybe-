import { Errors } from 'cs544-js-utils';
import { LibraryDao } from './library-dao.js';
import * as Lib from './library.js';

/************************ Main Implementation **************************/

export function makeLendingLibrary(dao: LibraryDao) {
  return new LendingLibrary(dao);
}

export class LendingLibrary {
  constructor(private readonly dao: LibraryDao) {}

  /** Clear out the underlying database */
  async clear(): Promise<Errors.Result<void>> {
    const result = await this.dao.clear(); // Ensure dao.clear() is defined
    return result.isOk ? Errors.okResult(undefined) : Errors.errResult(result, 'DB');
  }

  /** Add one or more copies of a book */
  async addBook(req: Record<string, any>): Promise<Errors.Result<Lib.XBook>> {
    // Validate the incoming request
    const validation = Lib.validate<Lib.Book>('addBook', req);
    if (!validation.isOk) {
        return validation as Errors.Result<Lib.XBook>; // Cast to the expected type
    }

    const book = validation.val;

    // Check if the book already exists by ISBN
    const existingBookResult = await this.dao.findBookByISBN(book.isbn);
    
    if (existingBookResult.isOk) {
      if (existingBookResult.val) {
          // Compare with the existing book
          const fieldDiff = compareBook(existingBookResult.val, book);
          if (fieldDiff) {
              return Errors.errResult(`Inconsistent data on field ${fieldDiff}`, 'BAD_REQ');
          }
          // Update copies if they match
          const updateResult = await this.dao.updateCopies(book.isbn, book.nCopies || 1);
  
          // Return the book if the update was successful, else return a generic error
          return updateResult.isOk ? Errors.okResult(book) : Errors.errResult('Failed to update copies', 'DB');
      }
  } else {
      // Since existingBookResult is not OK, return an appropriate error
      return Errors.errResult("Failed to find the existing book", 'DB'); // Return a generic error message
  }
    // If the book does not exist, you can add it here
    const addResult = await this.dao.addBook(book);
    return addResult.isOk ? Errors.okResult(book) : addResult; // Return the result of adding the book
  }

  /** Find books by search criteria */
  async findBooks(req: Record<string, any>): Promise<Errors.Result<Lib.XBook[]>> {
    // Validate the incoming request
    const validation = Lib.validate<Lib.Find>('findBooks', req);
    if (!validation.isOk) {
        return Errors.errResult("Invalid search parameters", 'BAD_REQ');
    }

    const { search, index = 0, count = DEFAULT_COUNT } = validation.val;

    // Ensure the search term is valid
    if (!/\w{2,}/.test(search)) {
        return Errors.errResult('Search term must contain at least one word with two or more characters', 'BAD_REQ');
    }

    // Prepare the request object to match Lib.Find structure
    const findRequest: Lib.Find = { search, index, count };

    // Call DAO to find books
    const result = await this.dao.findBooks(findRequest); // Pass a single object

    // Return the results or handle errors without accessing non-existent properties
    return result.isOk 
        ? Errors.okResult(result.val as Lib.XBook[])  // Cast to the expected type if needed
        : Errors.errResult("Failed to retrieve books", 'DB'); // Generic error message
}



  
  /** Checkout a book for a patron */
  /** Checkout a book for a patron */
/** Checkout a book for a patron */
async checkoutBook(req: Record<string, any>): Promise<Errors.Result<void>> {
  // Validate the incoming request
  const validation = Lib.validate<Lib.CheckoutRequest>('checkoutBook', req);
  if (!validation.isOk) {
      return Errors.errResult("Invalid checkout parameters", 'BAD_REQ');
  }

  // Destructure validated parameters
  const { isbn, patronId } = validation.val;

  // Check if the book exists and has copies available
  const bookResult = await this.dao.findBookByISBN(isbn);
  if (!bookResult.isOk || !bookResult.val) {
      return Errors.errResult("Book not found", 'BOOK_NOT_FOUND');
  }

  const book = bookResult.val;

  // Check if there are copies available
  if (!book.nCopies || book.nCopies <= 0) {
      return Errors.errResult("No copies available for checkout", { code: 'NO_COPIES' });
  }

  // Check if the patron has already checked out this book
  const hasCheckedOutResult = await this.dao.hasPatronCheckedOutBook(isbn, patronId);
  if (hasCheckedOutResult.isOk && hasCheckedOutResult.val) {
      return Errors.errResult("Patron has already checked out this book", { code: 'ALREADY_CHECKED_OUT' });
  }

  // Proceed with the checkout
  const checkoutResult = await this.dao.checkoutBook(isbn, patronId);
  if (!checkoutResult.isOk) {
      return Errors.errResult("Failed to checkout book", 'CHECKOUT_FAILED');
  }

  return Errors.okResult(undefined);
}





  /** Return a book for a patron */
  async returnBook(req: Record<string, any>): Promise<Errors.Result<void>> {
    // Validate the request
    const validation = Lib.validate<Lib.Lend>('returnBook', req);
    if (!validation.isOk) {
        return Errors.errResult('Validation failed', 'BAD_REQ');
    }

    const { isbn, patronId } = validation.val; // Ensure this is of the expected type

    // Check if the book exists
    const bookResult = await this.dao.findBookByISBN(isbn);
    if (!bookResult.isOk) return Errors.errResult('Database error', 'DB');
    if (!bookResult.val) return Errors.errResult('Book not found', 'BAD_REQ');

    // Call the DAO's returnBook method with the required parameters
    const returnResult = await this.dao.returnBook({ isbn, patronId });

    // Return appropriate error if return fails
    return returnResult.isOk ? Errors.okResult(undefined) : Errors.errResult('Return failed', 'DB');
}
}

// Default count for find requests
const DEFAULT_COUNT = 5;

/********************** Domain Utility Functions ***********************/

/** Compare fields of two books; return first differing field or undefined if identical */
function compareBook(book0: Lib.Book, book1: Lib.Book): string | undefined {
  if (book0.title !== book1.title) return 'title';
  if (book0.authors?.some((a: string, i: number) => a !== book1.authors?.[i])) return 'authors';
  if (book0.pages !== book1.pages) return 'pages';
  if (book0.year !== book1.year) return 'year';
  if (book0.publisher !== book1.publisher) return 'publisher';
  return undefined; // All fields match
}
