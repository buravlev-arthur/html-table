export default class RowDragAndDrop {
  private rowAnchorEl: HTMLElement = document.createElement("div");
  private anchorTopPositionPx = 0;
  private boundaries: number[] = [];
  private topBoundaryOffsetPx = 10;
  private bottomBoundaryOffsetPx = 20;
  private dragOverListener: ((event: DragEvent) => void) | null = null;
  private mouseUpListener: ((event: MouseEvent) => void) | null = null;

  constructor(
    private readonly tableContainer: HTMLDivElement,
    private readonly tableContentEl: HTMLElement,
    private readonly rowHeadersContainer: HTMLElement,
    private cellTranslateY: number,
    private _rowIndex: number,
    private readonly rowContentBlockIndex: number,
    private readonly rows: Map<number, number>,
    private readonly tableHeaderHeightPx: number,
    private readonly rerenderRows: () => void
  ) {
    const topBoundary = this.cellTranslateY + this.topBoundaryOffsetPx;
    const bottomBoundary = this.tableContainer.getBoundingClientRect().bottom - this.bottomBoundaryOffsetPx;

    this.anchorTopPositionPx = this.cellTranslateY + this.rowHeight;
    this.boundaries = [topBoundary, bottomBoundary];

    this.setRowAnchor();
  }

  public set rowIndex(rowIndex: number) {
    this._rowIndex = rowIndex;
  }

  get rowHeight(): number {
    return this.rows.get(this._rowIndex) ?? 0;
  }

  public setTopPosition(topPositionPx: number) {
    this.anchorTopPositionPx = topPositionPx + this.tableHeaderHeightPx;
    this.rowAnchorEl.style.transform = `translateY(${this.anchorTopPositionPx}px)`;
    this.cellTranslateY = this.anchorTopPositionPx - this.rowHeight;
    this.boundaries[0] = this.cellTranslateY + this.topBoundaryOffsetPx;
  }

  private setRowAnchor(): void {
    this.rowAnchorEl.classList.add("row-anchor");
    this.rowAnchorEl.setAttribute("draggable", "true");
    this.rowAnchorEl.style.transform = `translateY(${this.anchorTopPositionPx}px)`;

    this.listenDragAndDropRow();

    this.rowHeadersContainer.appendChild(this.rowAnchorEl);
  }

  public hideRowAnchorEl(): void {
    this.rowAnchorEl.style.display = "none";
  }

  public showRowAnchorEl(): void {
    this.rowAnchorEl.style.display = "block";
  }

  private listenDragAndDropRow() {
    this.rowAnchorEl.addEventListener("mousedown", this.listenMouseDownEvent.bind(this));
    this.rowAnchorEl.addEventListener("dragstart", this.dragStartListener.bind(this));
    this.rowAnchorEl.addEventListener("dragend", this.dragEndListener.bind(this));
  }

  private listenMouseDownEvent() {
    this.dragOverListener = (event) => {
      this.listenDragOverTableContainer(event);
    };

    this.mouseUpListener = () => {
      this.listenMouseUpEvent();
    }

    this.rowAnchorEl.addEventListener("mouseup", this.mouseUpListener);

    this.tableContainer.style.overflow = "hidden";
    this.tableContainer.addEventListener('dragover', this.dragOverListener);
  }

  private listenMouseUpEvent(): void {
    this.tableContainer.style.overflow = "auto";
  }

  private dragStartListener(event: DragEvent) {
    if (this.mouseUpListener) {
      this.rowAnchorEl.removeEventListener("mouseup", this.mouseUpListener);
      this.mouseUpListener = null;
    }

    this.rowAnchorEl.classList.add("active");

    const transparentImg = new Image();
    transparentImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';  // пустое изображение 1x1
    event.dataTransfer!.setDragImage(transparentImg, 0, 0);
  }

  private dragEndListener() {
    this.rowAnchorEl.classList.remove("active");
    this.tableContainer.style.overflow = "auto";

    const cellBottomPositionPx = Number(this.rowAnchorEl.style.transform.slice(11).slice(0, -3));
    this.rows.set(this._rowIndex, cellBottomPositionPx - this.cellTranslateY);

    if (this.dragOverListener) {
      this.tableContainer.removeEventListener("dragover", this.dragOverListener);
      this.dragOverListener = null;
    }

    this.rerenderRows();
  }

  private listenDragOverTableContainer(event: MouseEvent) {
    event.preventDefault();

    const [ topBoundary, bottomBoundary ] = this.boundaries;
    const containerRect = this.tableContainer.getBoundingClientRect();
    const tableContentBlockTopPx = this.tableContentEl.getBoundingClientRect().top;
    const tableContentBlockTranslateYPx = Number(this.tableContentEl.style.transform.slice(11).slice(0, -3));

    const scrollTop = this.tableContainer.scrollTop - tableContentBlockTranslateYPx;
    const scrollTopWithTableHeaderPx =  scrollTop + this.tableHeaderHeightPx;
    const cellTopScrollShift = scrollTopWithTableHeaderPx > this.cellTranslateY
      ? scrollTopWithTableHeaderPx - this.cellTranslateY
      : 0;

    const minTranslateYPx = Math.max(topBoundary + cellTopScrollShift, event.clientY + scrollTop - containerRect.top);
    const translateYPx = Math.min(bottomBoundary + scrollTop, minTranslateYPx);

    this.rowAnchorEl.style.transform = `translateY(${translateYPx}px)`;
    this.rowAnchorEl.style.left = `${containerRect.left}px`;
  }
}
