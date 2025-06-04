import type { Cell as CellData } from './types';

export default class Cell {
  private readonly defaultCellBorderRightColor = '#999';
  private readonly selectedCellBorderColor = '#3483eb';

  private currentCellWidthPx: number = 0;
  private cellData: CellData | null = null;
  private _cellRowIndex: number = 0;
  private _cellColIndex: number = 0;
  private columnHeaderCellEl: HTMLDivElement | null = null;
  private rowHeaderCellEl: HTMLDivElement | null = null;

  constructor(
    private readonly cellEl: HTMLDivElement,
    private readonly cells: Map<string, CellData>,
    private readonly cellPaddingPx: number
  ) {
    this.currentCellWidthPx = Number(this.cellEl.style.width.slice(0, -2));
    this._cellRowIndex = Number(this.cellEl.getAttribute('data-row'));
    this._cellColIndex = Number(this.cellEl.getAttribute('data-column'));
    this.columnHeaderCellEl = document.querySelector(`[data-column-header-index="${this.cellColIndex}"]`);
    this.rowHeaderCellEl = document.querySelector(`[data-row-header-index="${this.cellRowIndex}"]`);

    this.cellData = this.cells.get(`${this.cellRowIndex}_${this.cellColIndex}`)!;
  }

  public get cellRowIndex(): number {
    return this._cellRowIndex;
  }

  public get cellColIndex(): number {
    return this._cellColIndex;
  }

  public selectCell(): void {
    const updatedCellWidth = this.currentCellWidthPx + this.cellPaddingPx;

    this.cellEl.style.width = `${updatedCellWidth}px`;
    this.cellEl.style.boxSizing = 'border-box';
    this.cellEl.style.border = `3px solid ${this.selectedCellBorderColor}`;

    this.selectRowColumnHeaderCells();

    this.currentCellWidthPx = updatedCellWidth;
  }

  public unselectCell(): void {
    const updatedCellWidth = this.currentCellWidthPx - this.cellPaddingPx;

    this.cellEl.style.width = `${updatedCellWidth}px`;
    this.cellEl.style.border = `0`;
    this.cellEl.style.boxSizing = 'content-box';
    this.cellEl.style.borderRight = `1px solid ${this.defaultCellBorderRightColor}`;

    this.unselectRowColumnHeaderCells();

    this.currentCellWidthPx = updatedCellWidth;
  }

  private selectRowColumnHeaderCells(): void {
    if (!this.columnHeaderCellEl || !this.rowHeaderCellEl) {
      return;
    }

    this.columnHeaderCellEl.classList.add('selected');
    const columnHeaderWidthPx = Number(this.columnHeaderCellEl.style.width.slice(0, -2));
    this.columnHeaderCellEl.style.width = `${columnHeaderWidthPx - 1}px`;
    this.rowHeaderCellEl.classList.add('selected');
  }

  private unselectRowColumnHeaderCells(): void {
    if (!this.columnHeaderCellEl || !this.rowHeaderCellEl) {
      return;
    }

    this.columnHeaderCellEl.classList.remove('selected');
    const columnHeaderWidthPx = Number(this.columnHeaderCellEl.style.width.slice(0, -2));
    this.columnHeaderCellEl.style.width = `${columnHeaderWidthPx + 1}px`;
    this.rowHeaderCellEl.classList.remove('selected');
  }

  public destroy(): void {
    this.cellData = null;
  }
}
