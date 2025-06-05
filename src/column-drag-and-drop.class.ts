import type { Column } from "./types";

export default class ColumnDragAndDrop {
  private readonly _columnAnchorEl: HTMLDivElement = document.createElement("div");
  private dragOverListener: ((event: DragEvent) => void) | null = null;
  private mouseUpListener: ((event: MouseEvent) => void) | null = null;
  private dragStartListener: ((event: DragEvent) => void) | null = null;
  private dragEndListener: ((event: DragEvent) => void) | null = null;
  private mouseDownListener: ((event: MouseEvent) => void) | null = null;
  private anchorLeftPositionPx: number = 0;
  private boundaries: number[] = [];
  private readonly leftBoundaryOffset: number = 10;
  private readonly rightBoundaryOffset: number = 30;

  constructor(
    private readonly tableContainer: HTMLDivElement,
    private readonly columnHeadersContainer: HTMLDivElement,
    private cellTranslateX: number,
    private readonly columnIndex: number,
    private column: Column,
    private readonly rowHeaderCellWidthPx: number,
    private readonly rerenderColumns: (changedColumnIndex: number, changedCellTranslateX: number) => void,
    private readonly toggleColumnAnchorsVisibility: (show: boolean) => void,
  ) {
    const leftBoundary = this.cellTranslateX + this.leftBoundaryOffset;
    const rightBoundary = this.tableContainer.getBoundingClientRect().right - this.rightBoundaryOffset;

    this.anchorLeftPositionPx = this.cellTranslateX + this.column.width;
    this.boundaries = [leftBoundary, rightBoundary];

    this.setColumnAnchor();
  }

  public get columnAnchorEl(): HTMLDivElement {
    return this._columnAnchorEl;
  }

  public setLeftPosition(leftPositionPx: number) {
    this.anchorLeftPositionPx = leftPositionPx;
    this.columnAnchorEl.style.transform = `translateX(${this.anchorLeftPositionPx}px)`;
    this.cellTranslateX = this.anchorLeftPositionPx - this.column.width;
    this.boundaries[0] = this.cellTranslateX + this.leftBoundaryOffset;
  }

  private setColumnAnchor(): void {
    this.columnAnchorEl.classList.add("column-anchor");
    this.columnAnchorEl.setAttribute("draggable", "true");
    this.columnAnchorEl.style.transform = `translateX(${this.anchorLeftPositionPx}px)`;

    this.listenDragAndDropColumn();

    this.columnHeadersContainer.appendChild(this.columnAnchorEl);
  }

  private listenDragAndDropColumn() {
    this.mouseDownListener = () => {
      this.listenMouseDownEvent();
    }

    this.dragStartListener = (event: DragEvent) => {
      this.listenDragStartEvent(event);
    }

    this.dragEndListener = () => {
      this.listenDragEndEvent();
    }

    this.columnAnchorEl.addEventListener("mousedown", this.mouseDownListener);
    this.columnAnchorEl.addEventListener("dragstart", this.dragStartListener);
    this.columnAnchorEl.addEventListener("dragend", this.dragEndListener);
  }

  private listenMouseDownEvent() {
    this.dragOverListener = (event) => {
      this.listenDragOverTableContainer(event);
    };

    this.mouseUpListener = () => {
      this.listenMouseUpEvent();
    }

    this.columnAnchorEl.addEventListener('mouseup', this.mouseUpListener);

    this.tableContainer.style.overflow = "hidden";
    this.tableContainer.addEventListener('dragover', this.dragOverListener);
  }

  private listenDragStartEvent(event: DragEvent) {
    if (this.mouseUpListener) {
      this.columnAnchorEl.removeEventListener("mouseup", this.mouseUpListener);
      this.mouseUpListener = null;
    }

    this.columnAnchorEl.classList.add("active");
    this.toggleColumnAnchorsVisibility(false);

    const transparentImg = new Image();
    transparentImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';  // пустое изображение 1x1
    event.dataTransfer!.setDragImage(transparentImg, 0, 0);
  }

  private listenDragEndEvent() {
    this.columnAnchorEl.classList.remove("active");
    this.toggleColumnAnchorsVisibility(true);
    this.tableContainer.style.overflow = "auto";

    const cellRightPositionPx = Number(this.columnAnchorEl.style.transform.slice(11).slice(0, -3));
    this.column.width = cellRightPositionPx - this.cellTranslateX;

    if (this.dragOverListener) {
      this.tableContainer.removeEventListener("dragover", this.dragOverListener);
      this.dragOverListener = null;
    }

    this.rerenderColumns(this.columnIndex, this.cellTranslateX);
  }

  private listenMouseUpEvent(): void {
    this.tableContainer.style.overflow = "auto";

    if (this.dragOverListener) {
      this.tableContainer.removeEventListener("dragover", this.dragOverListener);
      this.dragOverListener = null;
    }
  }

  private listenDragOverTableContainer(event: MouseEvent) {
    event.preventDefault();

    const [ leftBoundary, rightBoundary ] = this.boundaries;
    const containerRect = this.tableContainer.getBoundingClientRect();
    const scrollLeft = this.tableContainer.scrollLeft;
    const scrollLeftWithHeaderRowWidth =  scrollLeft + this.rowHeaderCellWidthPx;
    const cellLeftScrollShift = scrollLeftWithHeaderRowWidth > this.cellTranslateX
      ? scrollLeftWithHeaderRowWidth - this.cellTranslateX
      : 0;

    const minTranslateXPx = Math.max(leftBoundary + cellLeftScrollShift, (event.clientX + scrollLeft) - containerRect.left);
    const translateXPx = Math.min(rightBoundary + scrollLeft, minTranslateXPx);

    this.columnAnchorEl.style.transform = `translateX(${translateXPx}px)`;
    this.columnAnchorEl.style.top = '0px';
  }

  public destroy(): void {
    if (this.mouseDownListener) {
      this.columnAnchorEl.removeEventListener("mousedown", this.mouseDownListener);
      this.mouseDownListener = null;
    }

    if (this.dragStartListener) {
      this.columnAnchorEl.removeEventListener("dragstart", this.dragStartListener);
      this.dragStartListener = null;
    }

    if (this.dragEndListener) {
      this.columnAnchorEl.removeEventListener("dragend", this.dragEndListener);
      this.dragEndListener = null;
    }

    if (this.mouseUpListener) {
      this.columnAnchorEl.removeEventListener("mouseup", this.mouseUpListener);
      this.mouseUpListener = null;
    }

    if (this.dragOverListener) {
      this.tableContainer.removeEventListener("dragover", this.dragOverListener);
      this.dragOverListener = null;
    }
  }
}
