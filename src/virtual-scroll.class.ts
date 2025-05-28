import {Cell, Column} from "./types";

export default class VirtualScroll {
  private readonly columnDefaultWidth: number = 80;
  private readonly tableHeaderHeightPx: number = 28;
  private readonly columnChars: string[] = [...'abcdefghijklmnopqrstuvwxyz'];
  private readonly cellPaddingPx: number = 12;

  private observer: IntersectionObserver | null = null;
  private tableEl: HTMLDivElement | null = null;
  private tableContentEl: HTMLDivElement | null = null;
  private visibleRowsCount: number = 0;
  private startIndex: number = 0;
  private endIndex: number = 0;
  private topSentinel: HTMLDivElement | null = null;
  private bottomSentinel: HTMLDivElement | null = null;
  private scrollHandler: (() => void) | null = null;
  private rowsBuffer = 10;
  private tableRowElements: HTMLDivElement[] = [];
  private tableRowHeaderCellElements: HTMLDivElement[] = [];
  private columns = new Map<number, Column>();
  private cells = new Map<string, Cell>();
  private rowHeadersContainerElement: HTMLDivElement | null = null;

  constructor(
    private readonly container: HTMLDivElement,
    private readonly availableRowsCount: number,
    private readonly rowHeight: number,
  ) {
    this.container = container;
    this.availableRowsCount = availableRowsCount;
    this.rowHeight = rowHeight;

    this.init();
    this.addScrollListener();
  }

  private init(): void {
    this.tableEl = document.createElement("div");
    this.tableEl.classList.add("table");
    this.tableEl.style.height = `${this.availableRowsCount * this.rowHeight}px`;
    this.container.appendChild(this.tableEl);

    this.rowHeadersContainerElement = document.createElement("div");
    this.rowHeadersContainerElement.classList.add("row-headers-container");
    this.tableEl.appendChild(this.rowHeadersContainerElement);

    this.tableContentEl = document.createElement("div");
    this.tableContentEl.classList.add("table-content");
    this.tableEl.appendChild(this.tableContentEl);

    this.visibleRowsCount = Math.ceil(this.container.clientWidth / this.rowHeight);

    this.setColumns();
    this.setCells();
    this.createRowHTMLElements();
    this.createSentinelElements();
    this.renderVisibleRows();
  }

  setColumns(): void {
    if (!this.tableEl) {
      return;
    }

    const rowHeaderCellWidthPx = 63;
    const columnHeadersContainer = document.createElement("div");
    columnHeadersContainer.classList.add("column-headers-container");

    let cellsTotalWidth = rowHeaderCellWidthPx;
    for (let columnIndex = 0; columnIndex < this.columnChars.length; columnIndex += 1) {
      const title = this.columnChars[columnIndex];
      const width = this.columnDefaultWidth;

      this.columns.set(columnIndex, {
        title,
        width
      });

      const columnHeaderCellEl = document.createElement("div");
      columnHeaderCellEl.classList.add("column-header-cell", "cell");
      columnHeaderCellEl.style.width = `${width}px`;
      columnHeaderCellEl.textContent = title;
      columnHeaderCellEl.style.transform = `translateX(${cellsTotalWidth}px)`;

      columnHeadersContainer.appendChild(columnHeaderCellEl);

      cellsTotalWidth += width + this.cellPaddingPx;
    }

    columnHeadersContainer.style.width = `${cellsTotalWidth}px`;
    this.tableEl.appendChild(columnHeadersContainer);
  }

  setCells(): void {
    for (let rowIndex = 0; rowIndex < this.availableRowsCount; rowIndex += 1) {
      for (let columnIndex = 0; columnIndex < this.columns.size; columnIndex += 1) {
        this.cells.set(`${rowIndex}_${columnIndex}`, {
          formula: '',
          calculatedValue: `${rowIndex}, ${columnIndex}`,
          type: 'String',
          formating: []
        });
      }
    }
  }

  private createRowHTMLElements(): void {
    if (!this.tableContentEl || !this.rowHeadersContainerElement) {
      return;
    }

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
      this.tableRowHeaderCellElements.push(rowHeaderCellElement);
      this.rowHeadersContainerElement.appendChild(rowHeaderCellElement);

      this.columns.forEach((column, columnIndex) => {
        const cellElement = this.getCellElement(rowIndex, column, columnIndex, previousCellsWidth);
        rowEl.appendChild(cellElement);

        previousCellsWidth += column.width + this.cellPaddingPx;
      });

      rowEl.style.width = `${previousCellsWidth}px`;

      this.tableRowElements.push(rowEl);
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

  private createSentinelElements(): void {
    if (!this.tableEl) {
      return;
    }

    this.topSentinel = document.createElement('div');
    this.topSentinel.classList.add("sentinel");
    this.topSentinel.style.top = '0';
    this.tableEl.appendChild(this.topSentinel);

    this.bottomSentinel = document.createElement('div');
    this.bottomSentinel.classList.add("sentinel");
    this.bottomSentinel.style.bottom = '0';
    this.tableEl.appendChild(this.bottomSentinel);

    this.observer = new IntersectionObserver(this.renderVisibleRows.bind(this), {
      root: this.container,
      threshold: 0,
    });

    this.observer.observe(this.topSentinel);
    this.observer.observe(this.bottomSentinel);
  }

  private addScrollListener(): void {
    this.scrollHandler = () => {
      const scrollTop = this.container.scrollTop;
      const newStartIndex = Math.floor(scrollTop / this.rowHeight);
      const isLessFirstRowIndex = newStartIndex < this.startIndex;
      const isMoreLastRowIndex = newStartIndex > this.endIndex;

      if (isLessFirstRowIndex || isMoreLastRowIndex) {
        this.renderVisibleRows();
      }
    }

    this.container.addEventListener('scroll', this.scrollHandler);
  }

  private renderVisibleRows(): void {
    if (!this.tableContentEl || !this.rowHeadersContainerElement) {
      return;
    }

    const scrollTop = this.container.scrollTop;

    this.startIndex = Math.max(0, Math.floor(scrollTop / this.rowHeight) - this.rowsBuffer);
    this.endIndex = Math.min(
      this.availableRowsCount - 1,
      this.startIndex + this.visibleRowsCount + this.rowsBuffer
    );

    this.rowHeadersContainerElement.style.transform = `translateY(${this.startIndex * this.rowHeight}px)`;
    this.tableContentEl.style.transform = `translateY(${this.startIndex * this.rowHeight}px)`;

    this.hideRows();

    let contentIndex = 0;
    let previousRowsHeight = 0;

    for (let rowIndex = this.startIndex; rowIndex <= this.endIndex; rowIndex += 1) {
      this.renderRow(rowIndex, contentIndex, previousRowsHeight);
      previousRowsHeight += this.rowHeight;
      contentIndex += 1;
    }

    this.updateSentinelsPosition();
  }

  hideRows(): void {
    for (const [index, rowElement] of this.tableRowElements.entries()) {
      rowElement.style.display = "none";
      this.tableRowHeaderCellElements[index].style.display = "none";
    }
  }

  private renderRow(rowIndex: number, rowContentBlockIndex: number, previousRowsHeight: number): void {
    if (!this.tableContentEl) {
      return;
    }

    const rowHeaderCellElement = this.tableRowHeaderCellElements[rowContentBlockIndex];
    rowHeaderCellElement.style.transform = `translateY(${previousRowsHeight + this.tableHeaderHeightPx}px)`;
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

  private updateSentinelsPosition(): void {
    if (!this.topSentinel || !this.bottomSentinel) {
      return;
    }

    const topSentinelOffsetPx = 10;
    this.topSentinel.style.top = `${Math.max(0, this.startIndex * this.rowHeight - topSentinelOffsetPx)}px`;
    this.bottomSentinel.style.top = `${(this.endIndex + 1) * this.rowHeight}px`;
  }

  destroy(): void {
    if (!this.observer || !this.scrollHandler) {
      return;
    }

    this.observer.disconnect();
    this.container.removeEventListener('scroll', this.scrollHandler);
  }
}
