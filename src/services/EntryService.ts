import {IEntry} from '@src/models/Entry';
import EntryRepo from '@src/repos/EntryRepo';

/**
 * Add one entry.
 */
function addOne(entry: IEntry): Promise<void> {
  return EntryRepo.add(entry);
}

/**
 * Get all with future dates.
 */
function getAll(): Promise<IEntry[]> {
  return EntryRepo.getFuture();
}

/**
 * Delete a single entry
 */
function deleteEntry(id: string): Promise<void> {
  return EntryRepo.deleteEntry(id);
}

// **** Export default **** //

export default {
  addOne,
  getAll,
  deleteEntry
} as const;