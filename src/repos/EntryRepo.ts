import {IEntry} from '@src/models/Entry';
import orm from './MockOrm';
import moment from 'moment';

async function add(entry: IEntry): Promise<void> {
  const db = await orm.openDb();

  db.entries.push(entry);
  return orm.saveDb(db);
}

async function getFuture(): Promise<IEntry[]> {
  const db = await orm.openDb();
  return db.entries.filter(entry => !moment(entry.startDay).isBefore(moment()));
}

async function deleteEntry(id: string): Promise<void> {
  const db = await orm.openDb();
  db.entries = db.entries.filter(entry => entry.id !== id);

  return orm.saveDb(db);
}

async function getChildByParentId(parentId: string): Promise<IEntry | undefined> {
  const db = await orm.openDb();
  return db.entries.find(entry => entry.parentEntryId === parentId);
}

// **** Export default **** //

export default {
  add,
  getFuture,
  deleteEntry,
  getChildByParentId
} as const;