import { UserType } from '../schemas/User';
import { Token } from '../schemas/Token';
import * as PouchDB from 'pouchdb';

PouchDB.plugin(require('pouchdb-find'));

export const usersDb = new PouchDB<UserType>('USERS_DB');
export const tokensDB = new PouchDB<Token>('TOKENS_DB');
