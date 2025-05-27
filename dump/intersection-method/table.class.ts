import type { Viewport } from "./viewport.class";
import type { Row, Column, Cell } from "./types";

export class Table {
  public readonly pageCount: number = 2;
  private readonly columnChars: string[] = [...'abcdefghijklmnopqrstuvwxyz'];
  private columnDefaultWidth: number = 80;
  private rowDefaultHeight: number = 26;
  private rowsHeight = new Map<number, number>();
  private _spaceTableTop: number[] = [];
  private maxViewRows = 10000;

  public columns = new Map<number, Column>;
  public rows: Row[] = [];
  public cells = new Map<string, Cell>;
  public rowsCount: number = 0;
  public numberRowWidth: number = 50;

  constructor(private readonly viewport: Viewport) {
    this.setRowsCount();
    this.setColumns();
    this.initRows();
    this.initCells(this.maxViewRows);
  }

  get columnsCount(): number {
    return this.columnChars.length;
  }

  get maxRows(): number {
    return this.maxViewRows;
  }

  get spaceTableTop(): number {
    return this._spaceTableTop
      .reduce((sum, heightChunk) => sum + heightChunk, 0);
  }

  get previousRowsTotalHeight(): number {
    return this._spaceTableTop.length ? this._spaceTableTop[this._spaceTableTop.length - 1] : 0;
  }

  set spaceTableTop(direction: 'up' | 'down') {
    if (direction === 'up' &&  this._spaceTableTop.length) {
      this._spaceTableTop.pop();
      return;
    }

    const replacingRowsTotalHeight = this.rows.slice(this.rows.length - this.pageSize, this.rows.length - 1);

    const totalRowsHeightSum = replacingRowsTotalHeight
      .reduce((sum, { height }) => sum + height, 0);

    this._spaceTableTop.push(totalRowsHeightSum);
  }

  get pageSize(): number {
    return this.rowsCount / this.pageCount;
  }

  setRowsCount(): void {
    const baseRowsCountOnPage = Math.round(this.viewport.height / this.getRowDefaultHeightByZoom());
    const evenPageSize = baseRowsCountOnPage % 2 === 0
      ? baseRowsCountOnPage
      : baseRowsCountOnPage + 1;

    this.rowsCount = evenPageSize * this.pageCount;
  }

  getColumnDefaultWidthByZoom(baseColumnWidth: number = this.columnDefaultWidth): number {
    return Math.ceil(baseColumnWidth * this.viewport.zoomCoefficient);
  }

  getRowDefaultHeightByZoom(baseRowHeight: number = this.rowDefaultHeight): number {
    return Math.ceil(baseRowHeight * this.viewport.zoomCoefficient);
  }

  setColumns(): void {
    for (const [index, char] of this.columnChars.entries()) {
      const currentColumnData = this.columns.get(index);
      const columnWidth = currentColumnData?.width;

      const columnData = {
        title: char,
        width: this.getColumnDefaultWidthByZoom(columnWidth),
      };

      this.columns.set(index, columnData);
    }
  }

  initRows(): void {
    for (let rowIndex = 0; rowIndex < this.rowsCount; rowIndex += 1) {
      const rowTitle = rowIndex + 1;

      const rowData = {
        index: rowIndex,
        title: rowTitle,
        height: this.getRowDefaultHeightByZoom(),
      };

      this.rows.push(rowData)
    }
  }

  replaceRows(rowsFromStartIndex: number, rowsCount: number, transferDirection: 'up' | 'down'): void {
    const firstRowIndex = Math.max(rowsFromStartIndex, 0);
    const lastRowIndex = Math.min(firstRowIndex + rowsCount, this.rowsCount - 1);

    const isUp = transferDirection === 'up';
    const rowViewStartIndex = isUp
      ? Math.max((this.rows[0]?.index ?? 0) - rowsCount - 1, 0)
      : (this.rows[this.rows.length - 1]?.index ?? -1) + 1;
    let rowViewCurrentIndex = rowViewStartIndex;

    for (let rowIndex = firstRowIndex; rowIndex <= lastRowIndex; rowIndex += 1) {
      const rowNewIndex = isUp ? rowViewCurrentIndex : rowViewStartIndex + rowIndex;
      const rowTitle = rowNewIndex + 1;
      const newRowCurrentHeight = this.rowsHeight.get(rowNewIndex);
      const newRowUpdatedHeight = this.getRowDefaultHeightByZoom(newRowCurrentHeight);
      this.rowsHeight.set(rowNewIndex, newRowUpdatedHeight);
      rowViewCurrentIndex += 1;

      this.rows[rowIndex] = {
        index: rowNewIndex,
        title: rowTitle,
        height: newRowUpdatedHeight
      }
    }

    const transferringRows = this.rows.splice(firstRowIndex, rowsCount + 1);
    const newStartIndex = isUp ? 0 : this.rows.length;
    this.rows.splice(newStartIndex, 0, ...transferringRows);
  }

  initCells(rowsCount: number): void {
    for (let rowIndex = 0; rowIndex < rowsCount; rowIndex += 1) {
      for (let columnIndex = 0; columnIndex < this.columnsCount; columnIndex += 1) {
        const cellMapKey = `${rowIndex}_${columnIndex}`;

        const cellData: Cell = {
          formula: '',
          calculatedValue: '',
          type: 'String',
          formating: []
        }

        this.cells.set(cellMapKey, cellData);
      }
    }
  }

  getRowIndexInRowsArray(rowIndex: number): number {
    return this.rows
      .findIndex(({ index }) => index === rowIndex)!;
  }
}
