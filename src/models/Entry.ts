export interface IEntry {
  id: string,
  representative: string,
  firstName: string,
  middleName: string,
  lastName: string,
  securityNumber: string,
  documentNumber: string,
  issuedOn: string,
  issuer: string,
  bullstat: string,
  regNumber: string,
  purchaseDoc: string | null,
  powerAttorney: string | null,
  parentEntryId: string,
  startDay?: string,
  isPrimaryNum: boolean,
}

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

export interface MulterRequest extends Request {
  files: {
    purchaseDoc?: UploadedFile[];
    powerAttorney?: UploadedFile[];
  };
}