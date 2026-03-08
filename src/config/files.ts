import type { filesSelect } from '$schema/files';

export const apportionmentTypeStandard = 'standard';
export const apportionmentTypeSpendPlan = 'spend-plan';
export const unknownFolderName = 'Unknown Folder';

export const filterTypeSpreadsheet = (file: Partial<filesSelect>) => {
  return file.fileType === apportionmentTypeStandard && !file.pdfUrl;
};
export const filterTypeLetter = (file: Partial<filesSelect>) => {
  return file.fileType === apportionmentTypeStandard && !!file.pdfUrl;
};
export const filterTypeSpendPlan = (file: Partial<filesSelect>) => {
  return file.fileType === apportionmentTypeSpendPlan;
};
