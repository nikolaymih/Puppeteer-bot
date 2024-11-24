import {IEntry} from '@src/models/Entry';

export interface IExecutors {
  id: string,
  entryId: string,
  isSuccessful: boolean,
  errorMessage: string,
  screenshotNames: string[]
}

export interface ICompleteLogger extends IExecutors, IEntry {}