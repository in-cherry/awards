export type OpenedMysteryBoxRecord = {
  boxIndex: number;
  won: boolean;
  prizeId?: string;
  openedAt: string;
};

type MetadataObject = Record<string, unknown>;

function isMetadataObject(value: unknown): value is MetadataObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readOpenedMysteryBoxes(metadata: unknown): OpenedMysteryBoxRecord[] {
  if (!isMetadataObject(metadata)) {
    return [];
  }

  const raw = metadata.mysteryBoxOpened;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      if (!isMetadataObject(item)) {
        return null;
      }

      const boxIndex = item.boxIndex;
      const won = item.won;
      const prizeId = item.prizeId;
      const openedAt = item.openedAt;

      if (typeof boxIndex !== 'number' || !Number.isInteger(boxIndex) || boxIndex < 0) {
        return null;
      }

      if (typeof won !== 'boolean') {
        return null;
      }

      if (typeof openedAt !== 'string') {
        return null;
      }

      if (prizeId !== undefined && typeof prizeId !== 'string') {
        return null;
      }

      return {
        boxIndex,
        won,
        prizeId,
        openedAt,
      };
    })
    .filter((item): item is OpenedMysteryBoxRecord => item !== null);
}

export function appendOpenedMysteryBoxToMetadata(
  metadata: unknown,
  record: OpenedMysteryBoxRecord
): MetadataObject {
  const base: MetadataObject = isMetadataObject(metadata) ? { ...metadata } : {};
  const opened = readOpenedMysteryBoxes(base);

  const withoutSameBox = opened.filter((item) => item.boxIndex !== record.boxIndex);
  base.mysteryBoxOpened = [...withoutSameBox, record];

  return base;
}