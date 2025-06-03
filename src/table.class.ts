import type {Cell, Column, TableMode, CellElement} from "./types";
import TableCell from './cell.class';
import ColumnDragAndDrop from "./column-drag-and-drop.class";
import RowDragAndDrop from "./row-drag-and-drop.class";

export default class Table {
  private readonly columnChars: string[] = [...'abcdefghijklmnopqrstuvwxyz'];
  private readonly columnDefaultWidthPx: number = 80;
  private readonly rowHeaderCellWidthPx = 63;
  private readonly _tableEl = document.createElement("div");
  private readonly _rowHeadersContainerElement = document.createElement("div");
  private readonly _tableContentEl = document.createElement("div");
  private readonly columnHeadersContainer = document.createElement("div");

  public readonly cellPaddingPx: number = 12;
  public readonly tableHeaderHeightPx: number = 28;

  private _cells = new Map<string, Cell>();
  private _rows = new Map<number, number>;
  private _columns = new Map<number, Column>();
  private _tableColumnElements: HTMLDivElement[] = [];
  private tableCellElements: CellElement[] = [];
  private _tableRowHeaderCellElements: HTMLDivElement[] = [];
  private _tableRowElements: HTMLDivElement[] = [];
  private tableMode: TableMode = 'read';
  private selectedCell: TableCell | null = null;
  private columnAnchors: ColumnDragAndDrop[] = [];
  private rowAnchors: RowDragAndDrop[] = [];
  private _cellsTotalWidth: number = 0;

  constructor(
    private readonly container: HTMLDivElement,
    private readonly availableRowsCount: number,
    private readonly rowDefaultHeight: number,
    private readonly rowsBuffer: number,
    private readonly renderVisibleRows: () => void,
  ) {
    this.init();
  }

  private init(): void {
    this.setRows();

    this._tableEl.classList.add("table");
    this._tableEl.style.height = `${this.totalRowsHeight + this.tableHeaderHeightPx * 2}px`;
    this.container.appendChild(this.tableEl);

    this._rowHeadersContainerElement.classList.add("row-headers-container");
    this.tableEl.appendChild(this.rowHeadersContainerElement);

    this._tableContentEl.classList.add("table-content");
    this._tableEl.appendChild(this.tableContentEl);

    this.setColumns();
    this.setCells();
    this.createRowHTMLElements();
    this.listenTableClick();
  }

  public get visibleRowsCount(): number {
    const averageRowHeight = this.totalRowsHeight / this.rows.size;
    return Math.ceil(this.container.clientHeight / averageRowHeight);
  }

  get totalRowsHeight(): number {
    let totalRowsHeight = 0;
    this._rows.forEach((rowHeight: number) => totalRowsHeight += rowHeight);

    return totalRowsHeight;
  }

  get cellsTotalWidth(): number {
    return this._cellsTotalWidth;
  }

  get tableRowHeaderCellElements() {
    return this._tableRowHeaderCellElements;
  }

  get tableRowElements() {
    return this._tableRowElements;
  }

  get tableColumnElements() {
    return this._tableColumnElements;
  }

  get rows() {
    return this._rows;
  }

  get cells() {
    return this._cells;
  }

  get columns() {
    return this._columns;
  }

  get tableEl() {
    return this._tableEl;
  }

  get tableContentEl() {
    return this._tableContentEl;
  }

  get rowHeadersContainerElement() {
    return this._rowHeadersContainerElement;
  }

  listenTableClick(): void {
    this.container.addEventListener('click', (event: MouseEvent) => {
      const clickedEl = event.target;
      const isCellEl = Boolean(clickedEl) && (clickedEl as HTMLElement).hasAttribute('data-row');

      this.unselectCell();

      if (!isCellEl) {
        return;
      }

      const cell = new TableCell(
        clickedEl as HTMLDivElement,
        this.cells,
        this.cellPaddingPx,
      );

      if (this.tableMode === 'read') {
        cell.selectCell();
      }

      this.selectedCell = cell;
    });
  }

  public cancelCellSelection(): void {
    this.unselectCell();
  }

  private unselectCell(): void {
    if (this.selectedCell) {
      this.selectedCell.unselectCell();
      this.selectedCell = null;
    }
  }

  private setRows(): void {
    for (let rowIndex = 0; rowIndex < this.availableRowsCount; rowIndex += 1) {
      this._rows.set(rowIndex, this.rowDefaultHeight);
    }
  }

  private setColumns(): void {
    this.columnHeadersContainer.classList.add("column-headers-container");

    let cellsTotalWidth = this.rowHeaderCellWidthPx;
    for (let columnIndex = 0; columnIndex < this.columnChars.length; columnIndex += 1) {
      const title = this.columnChars[columnIndex];
      const width = this.columnDefaultWidthPx;

      this._columns.set(columnIndex, {
        title,
        width,
      });

      const columnHeaderCellEl = document.createElement("div");
      columnHeaderCellEl.classList.add("column-header-cell", "cell");
      columnHeaderCellEl.style.width = `${width}px`;
      columnHeaderCellEl.textContent = title;
      columnHeaderCellEl.style.transform = `translateX(${cellsTotalWidth}px)`;

      this.columnHeadersContainer.appendChild(columnHeaderCellEl);
      this._tableColumnElements.push(columnHeaderCellEl);

      const anchorInstance = new ColumnDragAndDrop(
        this.container,
        this.columnHeadersContainer,
        cellsTotalWidth,
        columnIndex,
        this.columns.get(columnIndex)!,
        this.rowHeaderCellWidthPx,
        this.rerenderColumns.bind(this),
      );

      this.columnAnchors.push(anchorInstance);

      cellsTotalWidth += width + this.cellPaddingPx;
    }

    this.columnHeadersContainer.style.width = `${cellsTotalWidth}px`;
    this.tableEl.appendChild(this.columnHeadersContainer);
    this._cellsTotalWidth = cellsTotalWidth;
    this.tableEl.style.width = `${cellsTotalWidth}px`;
  }

  protected rerenderColumns(changedColumnIndex: number, changedCellTranslateX: number): void {
    this.unselectCell();

    let totalTranslateXPx = changedCellTranslateX;

    for (let columnIndex = changedColumnIndex; columnIndex < this.tableColumnElements.length; columnIndex += 1) {
      const column = this.columns.get(columnIndex)!;
      const cellRightPx = totalTranslateXPx + column.width;
      this.columnAnchors[columnIndex].setLeftPosition(cellRightPx);

      if (columnIndex === changedColumnIndex) {
        this.tableColumnElements[columnIndex].style.width = `${column.width}px`;
      }

      this.tableColumnElements[columnIndex].style.transform = `translateX(${totalTranslateXPx}px)`;

      this.tableCellElements
        .filter(({ columnIndex: cellColumnIndex }) => cellColumnIndex ===  columnIndex)
        .forEach((cell: CellElement) => {
          if (cell.columnIndex === changedColumnIndex) {
            cell.DOMElement.style.width = `${column.width}px`;
          }

          cell.DOMElement.style.transform = `translateX(${totalTranslateXPx - this.rowHeaderCellWidthPx}px)`;
        });

      totalTranslateXPx = cellRightPx + this.cellPaddingPx;
    }

    this.columnHeadersContainer.style.width = `${totalTranslateXPx}px`;
    this.tableEl.style.width = `${totalTranslateXPx}px`;
    this._cellsTotalWidth = totalTranslateXPx;

    this.tableRowElements.forEach((rowEl: HTMLElement) => {
      rowEl.style.width = `${totalTranslateXPx - this.rowHeaderCellWidthPx}px`;
    })
  }

  private rerenderRows(): void {
    this.renderVisibleRows();
    this._tableEl.style.height = `${this.totalRowsHeight + this.tableHeaderHeightPx * 2}px`;
  }

  private setCells(): void {
    for (let rowIndex = 0; rowIndex < this.availableRowsCount; rowIndex += 1) {
      for (let columnIndex = 0; columnIndex < this._columns.size; columnIndex += 1) {
        this._cells.set(`${rowIndex}_${columnIndex}`, {
          formula: '',
          calculatedValue: `${rowIndex}, ${columnIndex}`,
          type: 'String',
          formating: [],
        });
      }
    }
  }

  private createRowHTMLElements(): void {
    const rowElementsCount = this.visibleRowsCount + this.rowsBuffer * 2;

    for (let rowIndex = 0; rowIndex < rowElementsCount; rowIndex += 1) {
      const rowEl = document.createElement("div");
      const rowHeight = this.rows.get(rowIndex)!;
      rowEl.classList.add("row");
      rowEl.setAttribute("data-row-index", `${rowIndex}`);
      rowEl.setAttribute("data-row-array-index", `${rowIndex}`);
      rowEl.style.height = `${rowHeight}px`;
      rowEl.style.display = "none";

      let previousCellsWidth = 0;

      const rowHeaderCellElement = this.getRowHeaderCell(rowIndex);
      this._tableRowHeaderCellElements.push(rowHeaderCellElement);
      this.rowHeadersContainerElement.appendChild(rowHeaderCellElement);

      const anchorInstance = new RowDragAndDrop(
        this.container,
        this.tableContentEl,
        this.rowHeadersContainerElement,
        0,
        rowIndex,
        rowIndex,
        this.rows,
        this.tableHeaderHeightPx,
        this.rerenderRows.bind(this)
      );

      this.rowAnchors.push(anchorInstance)

      this.columns.forEach((column, columnIndex) => {
        const cellElement = this.getCellElement(rowIndex, column, columnIndex, previousCellsWidth);
        rowEl.appendChild(cellElement);

        this.tableCellElements.push({
          DOMElement: cellElement,
          rowIndex,
          columnIndex,
        });

        previousCellsWidth += column.width + this.cellPaddingPx;
      });

      rowEl.style.width = `${previousCellsWidth}px`;

      this._tableRowElements.push(rowEl);
      this.tableContentEl.appendChild(rowEl);
    }
  }

  private getRowHeaderCell(rowIndex: number): HTMLDivElement {
    const rowHeaderCellElement = document.createElement("div");
    rowHeaderCellElement.classList.add("cell");
    rowHeaderCellElement.style.height = `${this.rows.get(rowIndex)}px`;
    rowHeaderCellElement.textContent = String(rowIndex + 1);
    rowHeaderCellElement.style.display = "none";

    return rowHeaderCellElement;
  }

  private getCellElement(rowIndex: number, column: Column, columnIndex: number, previousCellsWidth: number): HTMLDivElement {
    const cellElement = document.createElement("div");
    cellElement.classList.add("cell");
    cellElement.setAttribute('data-row', `${rowIndex}`);
    cellElement.setAttribute('data-column', `${columnIndex}`);
    cellElement.style.width = `${column.width}px`;
    cellElement.style.transform = `translateX(${previousCellsWidth}px)`;
    cellElement.textContent = this.cells.get(`${rowIndex}_${columnIndex}`)?.calculatedValue ?? '';

    return cellElement;
  }

  public renderRow(rowIndex: number, rowContentBlockIndex: number, previousRowsHeight: number): void {
    const rowHeight = this.rows.get(rowIndex)!;
    const rowHeaderCellElement = this.tableRowHeaderCellElements[rowContentBlockIndex];
    const isNotLastRow = rowIndex < this.rows.size - 1;

    if (!rowHeaderCellElement) {
      return;
    }

    rowHeaderCellElement.style.transform = `translateY(${previousRowsHeight + this.tableHeaderHeightPx + 1}px)`;
    rowHeaderCellElement.style.height = `${rowHeight}px`;
    rowHeaderCellElement.style.display = "flex";
    rowHeaderCellElement.textContent = `${rowIndex + 1}`;

    this.rowAnchors[rowContentBlockIndex].setTopPosition(previousRowsHeight + rowHeight);
    this.rowAnchors[rowContentBlockIndex].rowIndex = rowIndex;

    if (isNotLastRow) {
      this.rowAnchors[rowContentBlockIndex].showRowAnchorEl();
    }

    const tableRowEl = this.tableRowElements[rowContentBlockIndex];
    tableRowEl.setAttribute("data-row-index", `${rowIndex}`);
    tableRowEl.setAttribute("data-row-array-index", `${rowContentBlockIndex}`);
    tableRowEl.style.transform = `translateY(${previousRowsHeight}px)`;
    tableRowEl.style.height = `${rowHeight}px`;
    tableRowEl.style.display = 'flex';

    tableRowEl.querySelectorAll('.cell').forEach((cellElement, cellIndex) => {
      cellElement.setAttribute('data-row', `${rowIndex}`);
      cellElement.textContent = this.cells.get(`${rowIndex}_${cellIndex}`)?.calculatedValue ?? '';
    });
  }

  public hideRows(): void {
    for (const [index, rowElement] of this.tableRowElements.entries()) {
      rowElement.style.display = "none";
      this.tableRowHeaderCellElements[index].style.display = "none";
      this.rowAnchors[index].hideRowAnchorEl();
    }
  }
}
