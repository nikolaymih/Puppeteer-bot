import {IEntry} from '@src/models/Entry';
import EntryRepo from '@src/repos/EntryRepo';
import {mainPuppeteer} from '@src/puppeteer';
import {scheduleTask} from '@src/util/misc';

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

/**
 * Reschedule future executions.
 */
async function rescheduleExecutions(): Promise<void> {
  const futureExecutions = await EntryRepo.getFuture();

  if (futureExecutions.length === 0) {
    return;
  }

  futureExecutions.forEach((entry) => {
    scheduleTask(entry.startDay, async () => {
      await mainPuppeteer(entry);
    });
  });
}

// **** Export default **** //

export default {
  addOne,
  getAll,
  deleteEntry,
  rescheduleEvents: rescheduleExecutions,
} as const;