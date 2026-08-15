export type ItemType =
  | "Weapon"
  | "Armor"
  | "Shield"
  | "Unit"
  | "Mag"
  | "Material"
  | "Consumable"
  | "Other";

export type DropRecord = {
  id: string;
  difficultyId: number;
  difficulty: string;
  sectionId: string;
  episode: number;
  area: string;
  enemy: string;
  dar: number;
  item: string;
  itemType: ItemType;
  rate: string | null;
  denominator: number | null;
  searchText: string;
};

export type MatrixDrop = {
  sectionId: string;
  item: string;
  itemType: ItemType;
  rate: string | null;
  denominator: number | null;
};

export type MatrixRow = {
  id: string;
  difficultyId: number;
  difficulty: string;
  episode: number;
  area: string;
  enemy: string;
  dar: number;
  drops: MatrixDrop[];
};

export type DropTablePayload = {
  records: DropRecord[];
  matrixRows: MatrixRow[];
  syncedAt: string;
  sourceUrl: string;
};
