import Table from './table.class';

export default class VirtualScroll {
  private observer: IntersectionObserver | null = null;
  private itemEl: HTMLDivElement | null = null;
  private itemContentEl: HTMLDivElement | null = null;
  private startIndex: number = 0;
  private endIndex: number = 0;
  private topSentinel: HTMLDivElement | null = null;
  private bottomSentinel: HTMLDivElement | null = null;
  private scrollHandler: (() => void) | null = null;
  private rowsBuffer = 10;
  private table: Table | null = null;

  constructor(
    private readonly container: HTMLDivElement,
    private readonly availableRowsCount: number,
    private readonly defaultRowHeight: number,
  ) {
    console.log('yes');
    this.init();
    this.addScrollListener();
  }

  private init(): void {
    this.table = new Table(
      this.container,
      this.availableRowsCount,
      this.defaultRowHeight,
      this.rowsBuffer,
      this.renderVisibleRows.bind(this),
    );

    this.itemEl = this.table.tableEl;
    this.itemContentEl = this.table.tableContentEl;

    this.createSentinelElements();
    this.renderVisibleRows();
  }

  private createSentinelElements(): void {
    if (!this.itemEl) {
      return;
    }

    this.topSentinel = document.createElement('div');
    this.topSentinel.classList.add("sentinel");
    this.topSentinel.style.top = '0';
    this.itemEl.appendChild(this.topSentinel);

    this.bottomSentinel = document.createElement('div');
    this.bottomSentinel.classList.add("sentinel");
    this.itemEl.appendChild(this.bottomSentinel);

    this.observer = new IntersectionObserver(this.renderVisibleRows.bind(this), {
      root: this.container,
      threshold: 0,
    });

    this.observer.observe(this.topSentinel);
    this.observer.observe(this.bottomSentinel);
  }

  private addScrollListener(): void {
    this.scrollHandler = () => {
      const updatedStartRowIndex = this.getUpdatedStartIndex();
      const isLessFirstRowIndex = updatedStartRowIndex < this.startIndex;
      const isMoreLastRowIndex = updatedStartRowIndex > this.endIndex - this.availableRowsCount;

      if (isLessFirstRowIndex || isMoreLastRowIndex) {
        this.renderVisibleRows();
      }
    }

    this.container.addEventListener('scroll', this.scrollHandler);
  }

  private renderVisibleRows(): void {
    if (!this.itemContentEl || !this.table) {
      return;
    }

    this.table.cancelCellSelection();

    const updatedStartRowIndex = this.getUpdatedStartIndex();

    this.startIndex = Math.max(0, updatedStartRowIndex - this.rowsBuffer);
    this.endIndex = Math.min(
      this.availableRowsCount - 1,
      this.startIndex + this.table.visibleRowsCount + this.rowsBuffer
    );

    const translateY = this.getRowsTotalHeight(0, this.startIndex);

    this.table.rowHeadersContainerElement.style.transform = `translateY(${translateY}px)`;
    this.itemContentEl.style.transform = `translateY(${translateY}px)`;

    this.table.hideRows();

    let contentIndex = 0;
    let previousRowsHeight = 0;

    for (let rowIndex = this.startIndex; rowIndex <= this.endIndex; rowIndex += 1) {
      this.table.renderRow(rowIndex, contentIndex, previousRowsHeight);
      previousRowsHeight += this.table.rows.get(rowIndex) ?? 0;
      contentIndex += 1;
    }



    this.updateSentinelsPosition();
  }

  private getUpdatedStartIndex(): number {
    if (!this.table) {
      return 0;
    }

    const scrollTop = this.container.scrollTop;
    let rowStartIndex = 0;
    let rowsTotalHeight = 0;

    while (scrollTop > rowsTotalHeight) {
      const rowHeight = this.table!.rows.get(rowStartIndex) ?? 0;

      rowsTotalHeight = rowsTotalHeight + rowHeight;
      rowStartIndex  += 1;
    }

    return rowStartIndex;
  }

  private getRowsTotalHeight(startIndex: number, endIndex: number): number {
    if (!this.table || (startIndex === 0 && endIndex === 0)) {
      return 0;
    }

    let totalRowsHeight = 0;

    for (let rowIndex = startIndex; rowIndex <= endIndex; rowIndex += 1) {
      totalRowsHeight += this.table.rows.get(rowIndex)!;
    }

    return totalRowsHeight;
  }

  private updateSentinelsPosition(): void {
    if (!this.topSentinel || !this.bottomSentinel || !this.table) {
      return;
    }

    const topSentinelOffsetPx = 10;

    this.topSentinel.style.top = `${Math.max(0, this.getRowsTotalHeight(0, this.startIndex) - topSentinelOffsetPx)}px`;
    this.topSentinel.style.width =`${this.table.cellsTotalWidth}px`;

    this.bottomSentinel.style.top = `${this.getRowsTotalHeight(0, this.endIndex) + this.table.tableHeaderHeightPx * 2}px`;
    this.bottomSentinel.style.width =`${this.table.cellsTotalWidth}px`;
  }

  destroy(): void {
    if (!this.observer || !this.scrollHandler) {
      return;
    }

    this.observer.disconnect();
    this.container.removeEventListener('scroll', this.scrollHandler);
    this.table = null;
    this.container.innerHTML = '';
  }
}
