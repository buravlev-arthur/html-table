import type { Cell as CellData } from './types';

export default class Cell {
  private readonly defaultCellBorderRightColor = '#999';
  private readonly selectedCellBorderColor = '#3483eb';

  private currentCellWidthPx: number = 0;
  private cellData: CellData | null = null;
  private cellRowIndex: number = 0;
  private cellColIndex: number = 0;

  constructor(
    private readonly cellEl: HTMLDivElement,
    private readonly cells: Map<string, CellData>,
    private readonly cellPaddingPx: number
  ) {
    this.currentCellWidthPx = Number(this.cellEl.style.width.slice(0, -2));
    this.cellRowIndex = Number(this.cellEl.getAttribute('data-row'));
    this.cellColIndex = Number(this.cellEl.getAttribute('data-column'));

    this.cellData = this.cells.get(`${this.cellRowIndex}_${this.cellColIndex}`)!;
  }

  public selectCell(): void {
    const updatedCellWidth = this.currentCellWidthPx + this.cellPaddingPx;

    this.cellEl.style.width = `${updatedCellWidth}px`;
    this.cellEl.style.boxSizing = 'border-box';
    this.cellEl.style.border = `3px solid ${this.selectedCellBorderColor}`;

    this.currentCellWidthPx = updatedCellWidth;
  }

  public unselectCell(): void {
    const updatedCellWidth = this.currentCellWidthPx - this.cellPaddingPx;

    this.cellEl.style.width = `${updatedCellWidth}px`;
    this.cellEl.style.border = `0`;
    this.cellEl.style.boxSizing = 'content-box';
    this.cellEl.style.borderRight = `1px solid ${this.defaultCellBorderRightColor}`;

    this.currentCellWidthPx = updatedCellWidth;
  }

  public destroy(): void {
    this.cellData = null;
  }
}
