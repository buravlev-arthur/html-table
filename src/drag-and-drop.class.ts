import type { Column } from "./types";

export default class DragAndDrop {
  private columnAnchorEl: HTMLElement = document.createElement("div");
  private dragOverListener: ((event: DragEvent) => void) | null = null;
  private anchorLeftPositionPx: number = 0;
  private boundaries: number[] = [];

  constructor(
    private readonly tableContainer: HTMLDivElement,
    private readonly columnHeadersContainer: HTMLDivElement,
    private readonly cellTranslateX: number,
    private column: Column
  ) {
    const boundaryOffset = 30;
    const leftBoundary = this.cellTranslateX + boundaryOffset;
    const rightBoundary = this.tableContainer.getBoundingClientRect().right - boundaryOffset;

    this.anchorLeftPositionPx = this.cellTranslateX + this.column.width;
    this.boundaries = [leftBoundary, rightBoundary];
  }

  public setColumnAnchor(): void {
    this.columnAnchorEl.classList.add("column-anchor");
    this.columnAnchorEl.setAttribute("draggable", "true");
    this.columnAnchorEl.style.transform = `translateX(${this.anchorLeftPositionPx}px)`;

    this.listenDragAndDropColumn();

    this.columnHeadersContainer.appendChild(this.columnAnchorEl);
  }

  private listenDragAndDropColumn() {
    this.columnAnchorEl.addEventListener("mousedown", this.mouseDown.bind(this));
    this.columnAnchorEl.addEventListener("dragstart", this.dragStartListener.bind(this));
    this.columnAnchorEl.addEventListener("dragend", this.dragEndListener.bind(this));
  }

  private mouseDown() {
    this.dragOverListener = (event) => {
      this.listenDragOverTableContainer(event);
    };

    this.tableContainer.style.overflow = "hidden";
    this.tableContainer.addEventListener('dragover', this.dragOverListener);
  }

  private dragStartListener() {
    this.columnAnchorEl.classList.add("active");
  }

  private dragEndListener() {
    this.columnAnchorEl.classList.remove("active");
    this.tableContainer.style.overflow = "auto";

    const cellRightPositionPx = Number(this.columnAnchorEl.style.transform.slice(11).slice(0, -3));
    this.column.width = cellRightPositionPx - this.cellTranslateX;
    console.log(this.column);

    if (this.dragOverListener) {
      this.tableContainer.removeEventListener("dragover", this.dragOverListener);
    }
  }

  private listenDragOverTableContainer(event: MouseEvent) {
      event.preventDefault();

      const [ leftBoundary, rightBoundary ] = this.boundaries;
      const containerRect = this.tableContainer.getBoundingClientRect();
      const minTranslateXPx = Math.max(leftBoundary, event.clientX - containerRect.left);
      const translateXPx = Math.min(rightBoundary, minTranslateXPx);

      this.columnAnchorEl.style.transform = `translateX(${translateXPx}px)`;
      this.columnAnchorEl.style.top = `${containerRect.top}px`;
    }
}
