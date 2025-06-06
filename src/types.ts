export type TableMode = 'read' | 'write';

export type Column = {
  title: string;
  width: number;
}

export type Cell = {
  formula: string;
  calculatedValue?: string;
  type: CellType;
  formating: CellFormatOption[];
}

export type CellElement = {
  DOMElement: HTMLDivElement;
  rowIndex: number;
  columnIndex: number;
}

export type CellType = 'Date' | 'String' | 'Number';

export enum CellFormatOption {
  'BOLD' = 'bold',
  'ITALIC' = 'italic',
  'UNDERLINED' = 'underlined',
}
