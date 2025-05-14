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
async function getAll(): Promise<IEntry[][]> {
  const futureEntries = await EntryRepo.getFuture();
  const groupedEntries: IEntry[][] = [];

  const parentEntries = futureEntries.filter(entry => entry.parentEntryId === '1');
  parentEntries.forEach(entry => groupedEntries.push([entry]));

  groupedEntries.forEach((entryArr, index) => {
    let currentId = entryArr[0].id;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const child = searchForChild(futureEntries, currentId);
      console.log(child, currentId);
      if (!child) break;

      groupedEntries[index].push(child);
      currentId = child.id;
    }
  });

  console.log(groupedEntries);

  return groupedEntries;
}

function searchForChild(entry: IEntry[], id: string) {
  return entry.find(e => e.parentEntryId === id);
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
    if (!entry.startDay) {
      return;
    }
    scheduleTask(entry.startDay, async () => {
      await mainPuppeteer(entry);
    });
  });
}

/**
 * Get child by parent id.
 */
function getChildByParentId(parentId: string): Promise<IEntry | undefined> {
  return EntryRepo.getChildByParentId(parentId);
}

// **** Export default **** //

export default {
  addOne,
  getAll,
  deleteEntry,
  rescheduleEvents: rescheduleExecutions,
  getChildByParentId,
} as const;