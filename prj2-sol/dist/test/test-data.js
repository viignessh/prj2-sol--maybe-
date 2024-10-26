import Path from 'path';
import { readJson } from 'cs544-node-utils';
const BOOKS = await getTestBooks(); //yeah for top-level awaits!!
export { BOOKS, };
//bit messy, but don't want to copy data;
//also, import json requires experimental import assertions
async function getTestBooks() {
    const dataPath = Path.join(process.env.HOME, 'CS544/prj2/prj2-sol/data/books.json');
    const readResult = await readJson(dataPath);
    if (readResult.isOk === false)
        throw readResult.errors;
    return readResult.val;
}
//# sourceMappingURL=test-data.js.map