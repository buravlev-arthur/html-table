import type {Cell, Column, TableMode, CellElement} from "./types";
import TableCell from './cell.class';
import ColumnDragAndDrop from "./column-drag-and-drop.class";
import RowDragAndDrop from "./row-drag-and-drop.class";
import ActionsPanel from "./actions-panel.class";

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
  private clickCellListener: ((event: MouseEvent) => void) | null = null;
  private columnAnchors: ColumnDragAndDrop[] = [];
  private rowAnchors: RowDragAndDrop[] = [];
  private _cellsTotalWidth: number = 0;
  private actionsPanel: ActionsPanel | null = null;

  constructor(
    private readonly container: HTMLDivElement,
    private availableRowsCount: number,
    private readonly rowDefaultHeight: number,
    private readonly rowsBuffer: number,
    private readonly renderVisibleRows: () => void,
    private readonly setAvailableRowsCount: (count: number) => number,
  ) {
    this.init();
  }

  private init(): void {
    this.actionsPanel = new ActionsPanel(
      this.addRow.bind(this),
      this.removeRow.bind(this),
      this.addColumn.bind(this),
      this.removeColumn.bind(this),
    );

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
    this.clickCellListener = (event: MouseEvent) => {
      if (!this.actionsPanel) {
        return;
      }

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

        const isRowsCountMoreThanOne = this.rows.size > 2;
        const isColumnsCountMoreThanOne = this.columns.size > 2;

        this.actionsPanel.setButtonsAvailable(isRowsCountMoreThanOne, isColumnsCountMoreThanOne);
      }

      this.selectedCell = cell;
    };

    this.container.addEventListener('click', this.clickCellListener);
  }

  public cancelCellSelection(): void {
    this.unselectCell();
  }

  private unselectCell(): void {
    this.removeSelectedCell();
  }

  private removeSelectedCell(): void {
    if (this.selectedCell) {
      this.selectedCell.unselectCell();
      this.selectedCell.destroy();
      this.selectedCell = null;

      if (this.actionsPanel) {
        this.actionsPanel.setButtonsDisabled();
      }
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
      const title = this.getColumnName(columnIndex);
      const width = this.columnDefaultWidthPx;

      this._columns.set(columnIndex, {
        title,
        width,
      });

      this.addColumnHeaderCellElements(columnIndex, width, title, cellsTotalWidth);
      this.addColumnAnchor(cellsTotalWidth, columnIndex);

      cellsTotalWidth += width + this.cellPaddingPx;
    }

    this.columnHeadersContainer.style.width = `${cellsTotalWidth}px`;
    this.tableEl.appendChild(this.columnHeadersContainer);
    this._cellsTotalWidth = cellsTotalWidth;
    this.tableEl.style.width = `${cellsTotalWidth}px`;
  }

  private addColumnAnchor(cellsTotalWidth: number, columnIndex: number): void {
    const anchorInstance = new ColumnDragAndDrop(
      this.container,
      this.columnHeadersContainer,
      cellsTotalWidth,
      columnIndex,
      this.columns.get(columnIndex)!,
      this.rowHeaderCellWidthPx,
      this.rerenderColumns.bind(this),
      this.toggleColumnAnchorsVisibility.bind(this),
    );

    this.columnAnchors.push(anchorInstance);
  }

  private addColumnHeaderCellElements(columnIndex: number, width: number, title: string, cellsTotalWidth: number): void {
    const columnHeaderCellEl = document.createElement("div");
    columnHeaderCellEl.classList.add("column-header-cell", "cell");
    columnHeaderCellEl.setAttribute('data-column-header-index', `${columnIndex}`);
    columnHeaderCellEl.style.width = `${width}px`;
    columnHeaderCellEl.textContent = title;
    columnHeaderCellEl.style.transform = `translateX(${cellsTotalWidth}px)`;

    this.columnHeadersContainer.appendChild(columnHeaderCellEl);
    this._tableColumnElements.push(columnHeaderCellEl);
  }

  toggleRowAnchorsVisibility(show: boolean): void {
    this.rowAnchors.forEach(rowAnchor => {
      const isActive = rowAnchor.rowAnchorEl.classList.contains('active');

      if (isActive) {
        return;
      }

      rowAnchor.rowAnchorEl.style.display = show ? 'block' : 'none';
    });
  }

  toggleColumnAnchorsVisibility(show: boolean): void {
    this.columnAnchors.forEach(columnAnchor => {
      const isActive = columnAnchor.columnAnchorEl.classList.contains('active');

      if (isActive) {
        return;
      }

      columnAnchor.columnAnchorEl.style.display = show ? 'block' : 'none';
    });
  }

  protected rerenderColumns(changedColumnIndex: number, changedCellTranslateX: number): void {
    this.unselectCell();

    let totalTranslateXPx = changedCellTranslateX;

    for (let columnIndex = changedColumnIndex; columnIndex < this.tableColumnElements.length; columnIndex += 1) {
      const column = this.columns.get(columnIndex)!;
      const cellRightPx = totalTranslateXPx + column.width;
      this.columnAnchors[columnIndex].setLeftPosition(cellRightPx);

      this.tableColumnElements[columnIndex].style.width = `${column.width}px`;
      this.tableColumnElements[columnIndex].style.transform = `translateX(${totalTranslateXPx}px)`;

      this.tableCellElements
        .filter(({ columnIndex: cellColumnIndex }) => cellColumnIndex ===  columnIndex)
        .forEach((cell: CellElement) => {
          cell.DOMElement.style.width = `${column.width}px`;
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
        this.rerenderRows.bind(this),
        this.toggleRowAnchorsVisibility.bind(this),
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
    rowHeaderCellElement.setAttribute('data-row-header-index', `${rowIndex}`)
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

  private addRow(position: 'before' | 'after'): void {
    if (!this.selectedCell) {
      return;
    }

    const selectedRowIndex = this.selectedCell.cellRowIndex;
    const addedRowIndex = position === 'before' ? selectedRowIndex : selectedRowIndex + 1;

    this.availableRowsCount = this.setAvailableRowsCount(this.availableRowsCount + 1)

    let previousRowHeight = 0;
    let previousCellsData: Cell[] = [];

    for (let rowIndex = addedRowIndex; rowIndex < this.availableRowsCount; rowIndex += 1) {
      const isFirstRow = rowIndex === addedRowIndex;
      const rowCurrentHeight = this.rows.get(rowIndex) ?? this.rowDefaultHeight;
      const cellsCurrentData: Cell[] = [];

      this._rows.set(rowIndex, isFirstRow ? this.rowDefaultHeight : previousRowHeight);

      for (let columnIndex = 0; columnIndex < this.columns.size; columnIndex += 1) {
        const cellKey = `${rowIndex}_${columnIndex}`;
        const cellCurrentData = this._cells.get(cellKey)!;

        const cellData = isFirstRow
          ? {
              formula: '',
              calculatedValue: '',
              type: 'String',
              formating: [],
            } as Cell
          : previousCellsData[columnIndex];

        this._cells.set(cellKey, cellData);
        cellsCurrentData.push(cellCurrentData);
      }

      previousRowHeight = rowCurrentHeight;
      previousCellsData = cellsCurrentData;
    }

    this.rerenderRows();
  }

  private removeRow(): void {
    if (!this.selectedCell) {
      return;
    }

    const selectedRowIndex = this.selectedCell.cellRowIndex;
    const updatedAvailableRowCount = this.availableRowsCount - 1;
    const lastRowIndex = this.rows.size - 1;

    this.availableRowsCount = this.setAvailableRowsCount(updatedAvailableRowCount);

    for (let rowIndex = selectedRowIndex; rowIndex < updatedAvailableRowCount; rowIndex += 1) {
      const nextRowHeight = this.rows.get(rowIndex + 1) ?? this.rowDefaultHeight;
      this._rows.set(rowIndex, nextRowHeight);

      for (let columnIndex = 0; columnIndex < this.columns.size; columnIndex += 1) {
        const cellKey = `${rowIndex}_${columnIndex}`;
        const nextRowCellKey = `${rowIndex + 1}_${columnIndex}`;
        const cellData = this.cells.get(nextRowCellKey)!;

        this._cells.set(cellKey, cellData);
      }
    }

    for (let columnIndex = 0; columnIndex < this.columns.size; columnIndex += 1) {
      this.cells.delete(`${lastRowIndex}_${columnIndex}`);
    }

    this.rows.delete(lastRowIndex);
    this.rerenderRows();
  }

  private getColumnName(columnIndex: number): string {
    if (columnIndex < 0) {
      return '';
    }

    let index = columnIndex;
    let columnName = '';

    do {
      columnName = String.fromCharCode(65 + (index % 26)) + columnName;
      index = Math.floor(index / 26) - 1;
    } while (index >= 0);

    return columnName;
  }

  private addColumn(position: 'before' | 'after'): void {
    if (!this.selectedCell) {
      return;
    }

    const selectedColumnIndex = this.selectedCell.cellColIndex;
    const addedColumnIndex = position === 'before' ? selectedColumnIndex : selectedColumnIndex + 1;
    const addedColumnTranslateXPx = this.tableColumnElements[addedColumnIndex]
      ? Number(this.tableColumnElements[addedColumnIndex].style.transform.slice(11).slice(0, -3))
      : Number(
          this.tableColumnElements[addedColumnIndex - 1].style.transform.slice(11).slice(0, -3)
        ) + this.columns.get(addedColumnIndex - 1)!.width + this.cellPaddingPx

    const columnTitle = this.getColumnName(this.columns.size);
    const lastCurrentColumnWidth = this.columns.get(this.columns.size - 2)!.width;

    this.columns.set(this.columns.size, {
      title: columnTitle,
      width: lastCurrentColumnWidth
    });

    this.addColumnHeaderCellElements(
      this.columns.size - 1,
      lastCurrentColumnWidth,
      columnTitle,
      this.cellsTotalWidth
    );

    let previousColumnData: Column = { title: '', width: 0 };
    let previousCellsData: Cell[] = [];

    for (let columnIndex = addedColumnIndex; columnIndex < this.columns.size; columnIndex += 1) {
      const isFirstColumn = columnIndex === addedColumnIndex;
      const currentColumnData: Column = this.columns.get(columnIndex)!;
      const cellsCurrentData: Cell[] = [];
      const columnData: Column = {
        title: currentColumnData.title,
        width: isFirstColumn ? this.columnDefaultWidthPx : previousColumnData.width,
      };

      this.columns.set(columnIndex, columnData);

      for (let rowIndex = 0; rowIndex < this.rows.size; rowIndex += 1) {
        const cellKey = `${rowIndex}_${columnIndex}`;
        const cellCurrentData = this._cells.get(cellKey)!;

        const cellData = isFirstColumn
          ? {
            formula: '',
            calculatedValue: '',
            type: 'String',
            formating: [],
          } as Cell
          : previousCellsData[rowIndex];

        this.cells.set(cellKey, cellData);

        cellsCurrentData.push(cellCurrentData);
      }

      previousColumnData = currentColumnData;
      previousCellsData = cellsCurrentData;
    }

    const lastColumnIndex = this.columns.size - 1;
    for (let rowIndex = 0; rowIndex < this.tableRowElements.length; rowIndex += 1) {
        const cellElement = this.getCellElement(
          rowIndex,
          this.columns.get(lastColumnIndex)!,
          lastColumnIndex,
          this.cellsTotalWidth - this.rowHeaderCellWidthPx
        );

        this.tableRowElements[rowIndex].appendChild(cellElement);
        this.tableCellElements.push({
          DOMElement: cellElement,
          rowIndex,
          columnIndex: lastColumnIndex,
        });
    }

    this.rerenderColumnAnchors();
    this.rerenderColumns(addedColumnIndex, addedColumnTranslateXPx);
    this.rerenderRows();
  }

  private removeColumn() {
    if (!this.selectedCell) {
      return;
    }

    const selectedColumnIndex = this.selectedCell.cellColIndex;
    const lastColumnIndex = this.columns.size - 1;
    const removedColumnTranslateXPx = Number(
      this.tableColumnElements[selectedColumnIndex].style.transform.slice(11).slice(0, -3)
    );

    for (let columnIndex = selectedColumnIndex; columnIndex < this.columns.size - 1; columnIndex += 1) {
      this.columns.set(columnIndex, this.columns.get(columnIndex + 1)!);

      for (let rowIndex = 0; rowIndex < this.rows.size; rowIndex += 1) {
        const cellKey = `${rowIndex}_${columnIndex}`;
        const nextCellKey = `${rowIndex}_${columnIndex + 1}`;

        this.cells.set(cellKey, this.cells.get(nextCellKey)!);
      }
    }

    for (let rowIndex = 0; rowIndex < this.rows.size; rowIndex += 1) {
      const cellKey = `${rowIndex}_${lastColumnIndex}`;
      this.cells.delete(cellKey);
    }

    this.tableCellElements = this.tableCellElements
      .filter(({ columnIndex }) => columnIndex !== lastColumnIndex);

    for (let rowElIndex = 0; rowElIndex < this.tableRowElements.length; rowElIndex += 1) {
      const lastCellEl = this.tableRowElements[rowElIndex]
        .querySelector(`[data-column="${lastColumnIndex}"]`);

      if (lastCellEl) {
        this.tableRowElements[rowElIndex].removeChild(lastCellEl);
      }
    }

    this.columns.delete(lastColumnIndex);
    this._tableColumnElements.pop();
    const lastColumnHeaderEl = this.columnHeadersContainer.querySelector(`[data-column-header-index="${lastColumnIndex}"]`);

    if (lastColumnHeaderEl) {
      this.columnHeadersContainer.removeChild(lastColumnHeaderEl);
    }

    this.rerenderColumnAnchors();
    this.rerenderColumns(selectedColumnIndex, removedColumnTranslateXPx);
    this.rerenderRows();
  };

  private rerenderColumnAnchors(): void {
    this.columnHeadersContainer.querySelectorAll('.column-anchor').forEach((anchorEl, anchorIndex) => {
      this.columnHeadersContainer.removeChild(anchorEl);
      this.columnAnchors[anchorIndex].destroy();
    });

    this.columnAnchors = [];

    let totalColumnsWidth = this.rowHeaderCellWidthPx;
    this.columns.forEach((column: Column, columnIndex) => {
      this.addColumnAnchor(totalColumnsWidth, columnIndex);
      totalColumnsWidth += column.width + this.cellPaddingPx;
    });
  }

  public destroy(): void {
    if (this.clickCellListener) {
      this.container.removeEventListener('click', this.clickCellListener);
    }

    if (this.selectedCell) {
      this.removeSelectedCell();
    }

    this.cells.clear();
    this.columns.clear();
    this.rows.clear();
    this._tableColumnElements = [];
    this.tableCellElements = [];
    this._tableRowHeaderCellElements = [];
    this._tableRowElements = [];

    this.rowAnchors.forEach((rowAnchor) => {
      rowAnchor.destroy();
    });
    this.rowAnchors = [];

    this.columnAnchors.forEach((columnAnchor) => {
      columnAnchor.destroy();
    });
    this.columnAnchors = [];
  }
}
