import {IReq} from '@src/routes/types/types';
import {IRes} from '@src/routes/types/express/misc';
import HttpStatusCodes from '@src/common/HttpStatusCodes';
import {IEntry, MulterRequest} from '@src/models/Entry';
import EntryService from '@src/services/EntryService';
import schedule, { Job } from 'node-schedule';
import {mainPuppeteer} from '@src/puppeteer';

/**
 * Add one entry.
 */
async function add(req: IReq<IEntry>, res: IRes) {
  const entry = req.body;

  const id = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const purchaseDoc = (req as unknown as MulterRequest).files.purchaseDoc?.[0]?.filename ?? null;
  const powerAttorney = (req as unknown as MulterRequest).files.powerAttorney?.[0]?.filename ?? null;

  const enrichedEntry: IEntry = {...entry, id, purchaseDoc, powerAttorney};

  const entries = await EntryService.addOne(enrichedEntry);

  scheduleTask(entry.startDay, async () => {
    await mainPuppeteer()
  });

  return res.status(HttpStatusCodes.CREATED).send(entries);
}

function scheduleTask(dateString: string, taskFn: () => void): Job {
  // Convert the date string to a JavaScript Date object
  const scheduledDate = new Date(dateString);

  // Validate the date
  if (isNaN(scheduledDate.getTime())) {
    throw new Error('Invalid date format. Ensure it is in "YYYY-MM-DD HH:mm:ss".');
  }

  // Schedule the task
  const job = schedule.scheduleJob(scheduledDate, taskFn);
  console.log(job);

  console.log(`Task scheduled for: ${dateString}`);
  return job;
}

/**
 * Get all with future dates.
 */
async function getAllFuture(req: IReq, res: IRes) {
  const futureEntries = await EntryService.getAll();

  return res.status(HttpStatusCodes.OK).json(futureEntries);
}

/**
 * Delete a single entry
 */
async function deleteEntry(req: IReq, res: IRes) {
  const id = req.params.id;
  await EntryService.deleteEntry(id);

  res.status(HttpStatusCodes.OK).end();
}

export default {
  add,
  getAllFuture,
  deleteEntry,
} as const;