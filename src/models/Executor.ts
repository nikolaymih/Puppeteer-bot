export interface IExecutors {
  id: string,
  entryId: string,
  isSuccessful: boolean,
  errorMessage: string,
  screenshotPaths: string[]
  executionTime?: string
}

export interface ICompleteLogger extends IExecutors {}