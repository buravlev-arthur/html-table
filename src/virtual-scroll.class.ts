import Table from './table.class';

export default class VirtualScroll {
  private observer: IntersectionObserver | null = null;
  private itemEl: HTMLDivElement | null = null;
  private itemContentEl: HTMLDivElement | null = null;
  private visibleRowsCount: number = 0;
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
    private readonly rowHeight: number,
  ) {
    this.init();
    this.addScrollListener();
  }

  private init(): void {
    this.visibleRowsCount = Math.ceil(this.container.clientWidth / this.rowHeight);

    this.table = new Table(
      this.container,
      this.availableRowsCount,
      this.rowHeight,
      this.visibleRowsCount,
      this.rowHeight,
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
    this.bottomSentinel.style.bottom = '0';
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
      const scrollTop = this.container.scrollTop;
      const newStartIndex = Math.floor(scrollTop / this.rowHeight);
      const isLessFirstRowIndex = newStartIndex < this.startIndex;
      const isMoreLastRowIndex = newStartIndex > this.endIndex - this.availableRowsCount;

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

    const scrollTop = this.container.scrollTop;

    this.startIndex = Math.max(0, Math.floor(scrollTop / this.rowHeight) - this.rowsBuffer);
    this.endIndex = Math.min(
      this.availableRowsCount - 1,
      this.startIndex + this.visibleRowsCount + this.rowsBuffer
    );

    this.table.rowHeadersContainerElement.style.transform = `translateY(${this.startIndex * this.rowHeight}px)`;
    this.itemContentEl.style.transform = `translateY(${this.startIndex * this.rowHeight}px)`;

    this.table.hideRows();

    let contentIndex = 0;
    let previousRowsHeight = 0;

    for (let rowIndex = this.startIndex; rowIndex <= this.endIndex; rowIndex += 1) {
      this.table.renderRow(rowIndex, contentIndex, previousRowsHeight);
      previousRowsHeight += this.rowHeight;
      contentIndex += 1;
    }

    this.updateSentinelsPosition();
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
