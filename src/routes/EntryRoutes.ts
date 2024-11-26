import {IReq} from '@src/routes/types/types';
import {IRes} from '@src/routes/types/express/misc';
import HttpStatusCodes from '@src/common/HttpStatusCodes';
import {IEntry, MulterRequest} from '@src/models/Entry';
import EntryService from '@src/services/EntryService';
import {mainPuppeteer} from '@src/puppeteer';
import {scheduleTask} from '@src/util/misc';

/**
 * Add one entry.
 */
async function add(req: IReq<IEntry>, res: IRes) {
  const entry = req.body;

  const id = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const purchaseDoc = (req as unknown as MulterRequest).files.purchaseDoc?.[0]?.filename ?? null;
  const powerAttorney = (req as unknown as MulterRequest).files.powerAttorney?.[0]?.filename ?? null;
  const issuedOn = entry?.issuedOn.replace(/-/g, '.');

  const enrichedEntry: IEntry = {...entry, id, purchaseDoc, powerAttorney, issuedOn};

  const entries = await EntryService.addOne(enrichedEntry);

  scheduleTask(entry.startDay, async () => {
    await mainPuppeteer(enrichedEntry);
  });

  return res.status(HttpStatusCodes.CREATED).send(entries);
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