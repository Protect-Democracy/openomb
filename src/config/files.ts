import type { filesSelect } from '$schema/files';

export const apportionmentTypeStandard = 'standard' as const;
export const apportionmentTypeSpendPlan = 'spend-plan' as const;
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
