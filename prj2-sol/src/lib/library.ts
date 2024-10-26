import { Errors } from 'cs544-js-utils';
import { zodToResult } from './zod-utils.js';
import { z } from 'zod';

const GUTENBERG_YEAR = 1448;
const NOW_YEAR = new Date().getFullYear();

// Specify key in zod validator to get value as message after
// passing through zodToResult()
const MSGS = {
  'msg.isbn':  'isbn must be of the form "ddd-ddd-ddd-d"',
  'msg.nonEmpty': 'must be non-empty',
  'msg.oneOrMoreAuthors': 'must have one or more authors',
  'msg.publishYear': `must be a past year on or after ${GUTENBERG_YEAR}`,
};

// Use zod to force Book to have the following fields:
//   isbn: a ISBN-10 string of the form ddd-ddd-ddd-d.
const Book =  z.object({
  isbn: z.string().regex(/^\d{3}-\d{3}-\d{3}-\d$/, { message: MSGS['msg.isbn'] }),
  
  //   title: a non-empty string.
  title: z.string().min(1, { message: MSGS['msg.nonEmpty'] }),
  
  //   authors: a non-empty array of non-empty strings.
  authors: z.array(z.string().min(1, { message: MSGS['msg.nonEmpty'] })).min(1, { message: MSGS['msg.oneOrMoreAuthors'] }),
  
  //   pages: a positive integer.
  pages: z.number().int().positive(),
  
  //   year: an integer within the range [GUTENBERG_YEAR, NOW_YEAR].
  year: z.number().int().gte(GUTENBERG_YEAR, { message: MSGS['msg.publishYear'] }).lte(NOW_YEAR),
  
  //   publisher: a non-empty string.
  publisher: z.string().min(1, { message: MSGS['msg.nonEmpty'] }),
  
  //   nCopies: an optional positive integer
  nCopies: z.number().int().positive().optional(),
});

export type Book = z.infer<typeof Book>;

const XBook = Book.required();
export type XBook = z.infer<typeof XBook>;

// Use zod to force Find to have the following fields:
//   search: a string which contains at least one word of two-or-more \w.
const Find = z.object({
  search: z.string().regex(/\b\w{2,}\b/, { message: MSGS['msg.nonEmpty'] }),
  
  //   index: an optional non-negative integer.
  index: z.number().int().nonnegative().optional(),
  
  //   count: an optional non-negative integer.
  count: z.number().int().nonnegative().optional(),
});
export type Find = z.infer<typeof Find>;

// Use zod to force Lend to have the following fields:
//   isbn: a ISBN-10 string of the form ddd-ddd-ddd-d.
const Lend = z.object({
  isbn: z.string().regex(/^\d{3}-\d{3}-\d{3}-\d$/, { message: MSGS['msg.isbn'] }),
  
  //   patronId: a non-empty string.
  patronId: z.string().min(1, { message: MSGS['msg.nonEmpty'] }),
});
export type Lend = z.infer<typeof Lend>;

const VALIDATORS: Record<string, z.ZodSchema> = {
  addBook: Book,
  findBooks: Find,
  checkoutBook: Lend,
  returnBook: Lend,
};

export function validate<T>(command: string, req: Record<string, any>): Errors.Result<T> {
  const validator = VALIDATORS[command];
  return (validator)
    ? zodToResult(validator.safeParse(req), MSGS)
    : Errors.errResult(`no validator for command ${command}`);
}

export type CheckoutRequest = {
  isbn: string;    // ISBN of the book to be checked out
  patronId: string; // ID of the patron checking out the book
};

// In library.ts
export type ReturnRequest = {
  isbn: string;     // Required ISBN of the book
  patronId: string; // Required ID of the patron
};
