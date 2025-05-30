import type {Cell, Column, TableMode} from "./types";
import TableCell from './cell.class';
import DragAndDrop from "./drag-and-drop.class";

export default class Table {
  private readonly columnChars: string[] = [...'abcdefghijklmnopqrstuvwxyz'];
  private readonly columnDefaultWidthPx: number = 80;
  private readonly rowHeaderCellWidthPx = 63;
  private readonly _tableEl = document.createElement("div");
  private readonly _rowHeadersContainerElement = document.createElement("div");
  private readonly _tableContentEl = document.createElement("div");

  public readonly cellPaddingPx: number = 12;
  public readonly tableHeaderHeightPx: number = 28;

  private _cells = new Map<string, Cell>();
  private _columns = new Map<number, Column>();
  private _tableRowHeaderCellElements: HTMLDivElement[] = [];
  private _tableRowElements: HTMLDivElement[] = [];
  private tableMode: TableMode = 'read';
  private selectedCell: TableCell | null = null;

  constructor(
    private readonly container: HTMLDivElement,
    private readonly availableRowsCount: number,
    private readonly rowHeight: number,
    private readonly visibleRowsCount: number,
    private readonly rowsBuffer: number,
  ) {
    this.init();
  }

  private init(): void {
    this._tableEl.classList.add("table");
    this._tableEl.style.height = `${this.availableRowsCount * this.rowHeight}px`;
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

  get tableRowHeaderCellElements() {
    return this._tableRowHeaderCellElements;
  }

  get tableRowElements() {
    return this._tableRowElements;
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

      if (this.selectedCell) {
        this.selectedCell.unselectCell();
        this.selectedCell = null;
      }

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
    if (this.selectedCell) {
      this.selectedCell.unselectCell();
      this.selectedCell = null;
    }
  }

  private setColumns(): void {
    const columnHeadersContainer = document.createElement("div");
    columnHeadersContainer.classList.add("column-headers-container");

    let cellsTotalWidth = this.rowHeaderCellWidthPx;
    for (let columnIndex = 0; columnIndex < this.columnChars.length; columnIndex += 1) {
      const title = this.columnChars[columnIndex];
      const width = this.columnDefaultWidthPx;

      this._columns.set(columnIndex, {
        title,
        width
      });

      const columnHeaderCellEl = document.createElement("div");
      columnHeaderCellEl.classList.add("column-header-cell", "cell");
      columnHeaderCellEl.style.width = `${width}px`;
      columnHeaderCellEl.textContent = title;
      columnHeaderCellEl.style.transform = `translateX(${cellsTotalWidth}px)`;

      const dragAndDrop = new DragAndDrop(
        this.container,
        columnHeadersContainer,
        cellsTotalWidth,
        this.columns.get(columnIndex)!
      );

      dragAndDrop.setColumnAnchor();

      columnHeadersContainer.appendChild(columnHeaderCellEl);

      cellsTotalWidth += width + this.cellPaddingPx;
    }

    columnHeadersContainer.style.width = `${cellsTotalWidth}px`;
    this.tableEl.appendChild(columnHeadersContainer);
  }

  private setCells(): void {
    for (let rowIndex = 0; rowIndex < this.availableRowsCount; rowIndex += 1) {
      for (let columnIndex = 0; columnIndex < this._columns.size; columnIndex += 1) {
        this._cells.set(`${rowIndex}_${columnIndex}`, {
          formula: '',
          calculatedValue: `${rowIndex}, ${columnIndex}`,
          type: 'String',
          formating: []
        });
      }
    }
  }

  private createRowHTMLElements(): void {
    const rowElementsCount = this.visibleRowsCount + this.rowsBuffer * 2;

    for (let rowIndex = 0; rowIndex < rowElementsCount; rowIndex += 1) {
      const rowEl = document.createElement("div");
      rowEl.classList.add("row");
      rowEl.setAttribute("data-row-index", `${rowIndex}`);
      rowEl.setAttribute("data-row-array-index", `${rowIndex}`);
      rowEl.style.height = `${this.rowHeight}px`;
      rowEl.style.display = "none";

      let previousCellsWidth = 0;

      const rowHeaderCellElement = this.getRowHeaderCell(rowIndex, this.rowHeight);
      this._tableRowHeaderCellElements.push(rowHeaderCellElement);
      this.rowHeadersContainerElement.appendChild(rowHeaderCellElement);

      this.columns.forEach((column, columnIndex) => {
        const cellElement = this.getCellElement(rowIndex, column, columnIndex, previousCellsWidth);
        rowEl.appendChild(cellElement);

        previousCellsWidth += column.width + this.cellPaddingPx;
      });

      rowEl.style.width = `${previousCellsWidth}px`;

      this._tableRowElements.push(rowEl);
      this.tableContentEl.appendChild(rowEl);
    }
  }

  private getRowHeaderCell(rowIndex: number, rowHeight: number): HTMLDivElement {
    const rowHeaderCellElement = document.createElement("div");
    rowHeaderCellElement.classList.add("cell");
    rowHeaderCellElement.style.height = `${rowHeight}px`;
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
    const rowHeaderCellElement = this.tableRowHeaderCellElements[rowContentBlockIndex];
    rowHeaderCellElement.style.transform = `translateY(${previousRowsHeight + this.tableHeaderHeightPx + 1}px)`;
    rowHeaderCellElement.style.display = "flex";
    rowHeaderCellElement.textContent = `${rowIndex + 1}`;

    const tableRowEl = this.tableRowElements[rowContentBlockIndex];
    tableRowEl.setAttribute("data-row-index", `${rowIndex}`);
    tableRowEl.setAttribute("data-row-array-index", `${rowContentBlockIndex}`);
    tableRowEl.style.transform = `translateY(${previousRowsHeight}px)`;
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
    }
  }
}
