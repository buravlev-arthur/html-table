import type { Row } from './types';
import type { Table } from './table.class';

export const getIntersectionObserver = (
  table: Table,
  tableEl: HTMLDivElement
): IntersectionObserver => {
  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const rootHeight = entry.rootBounds?.height ?? 0;
        const directionThreshold = rootHeight / 2;
        const direction =
          entry.intersectionRect.top <= directionThreshold
            ? 'up'
            : entry.intersectionRect.bottom > directionThreshold
              ? 'down'
              : 'unknown';
        const currentRowIndex = Number(entry.target.getAttribute('data-index'));
        const currentRowArrayIndex = Number(entry.target.getAttribute('data-rows-array-index'));

        if (direction === 'unknown') {
          return
        }

        replaceRows(table, tableEl, currentRowIndex, currentRowArrayIndex, direction);
      }
    })
  },
  {
    threshold: 0.1,
  });
}

export const setColumnHeaders = (table: Table) => {
  const columnHeadersContainerEl = document.getElementById('column-headers-container')!;
  let columnHeadersContainerWidth = 0;

  table.columns.forEach(({ width }) => columnHeadersContainerWidth += width);
  columnHeadersContainerEl.style.width = `${columnHeadersContainerWidth + table.numberRowWidth}px`;

  table.columns.forEach((column) => {
    const cellHeaderEl = document.createElement('div');
    cellHeaderEl.classList.add('cell', 'column-header-cell');
    cellHeaderEl.style.flexBasis = `${column.width}px`;
    cellHeaderEl.textContent = column.title;

    columnHeadersContainerEl.appendChild(cellHeaderEl);
  });
}

const replaceRows = (
  table: Table,
  tableEl: HTMLDivElement,
  currentRowIndex: number,
  currentRowArrayIndex: number,
  direction: 'up' | 'down'
): void => {
  const isUp = direction === 'up';
  const isDown = direction === 'down';
  const lastRowsIndex = table.rowsCount - 1;
  const isFirstRowHasZeroIndex = table.rows[0].index === 0;
  const hasTableRowsBeforeCurrentRow = table.rows[0].index < currentRowIndex;
  const isLastRowHasMaxIndex = table.rows[lastRowsIndex].index === table.maxRows;
  const hasTableRowsAfterCurrentRow = table.rows[lastRowsIndex].index > currentRowIndex;
  const isNotNeedReplaceToTop = isFirstRowHasZeroIndex || hasTableRowsBeforeCurrentRow;
  const isNotNeedReplaceToBottom = isLastRowHasMaxIndex || hasTableRowsAfterCurrentRow;
  const rowsFromStartIndex = isUp
    ? table.rowsCount - table.pageSize
    : 0;

  if ((isUp && isNotNeedReplaceToTop) || (isDown && isNotNeedReplaceToBottom)) {
    return;
  }

  table.spaceTableTop = direction;
  tableEl.style.marginTop = `${table.spaceTableTop}px`;

  table.replaceRows(rowsFromStartIndex, table.pageSize - 1, direction);

  let reservedHeight = 0;

  table.rows.forEach((row, index) => {
    const rowEl = tableEl.querySelector(`[data-rows-array-index='${index}']`) as HTMLDivElement;
    setRowData(rowEl, row, table, reservedHeight);
    reservedHeight += row.height;
  });
}

const getRowsTotalHeight = (
  table: Table,
  startIndex: number,
  rowsCount: number
): number => {
  return table.rows.slice(startIndex, rowsCount + 1)
    .reduce(
      ((totalHeight, { height }) => totalHeight + height),
      0
    );
}

const setRowData = (
  rowEl: HTMLDivElement,
  row: Row,
  table: Table,
  reservedHeight: number,
) => {
  rowEl.style.transform = `translateY(${reservedHeight}px)`;
  rowEl.style.height = `${row.height}px`;
  rowEl.setAttribute("data-index", String(row.index));
  rowEl.setAttribute("data-rows-array-index", String(table.getRowIndexInRowsArray(row.index)));

  const rowNumberCell = document.createElement("div");
  rowNumberCell.classList.add('cell', 'row-number-cell');
  rowNumberCell.textContent = String(row.title);
  rowEl.appendChild(rowNumberCell);
};

const setRowCells = (
  rowEl: HTMLDivElement,
  row: Row,
  table: Table
) => {
  let translateY = table.numberRowWidth;

  table.columns.forEach((col, index) => {
    const cellRowIndex = String(row.index);
    const cellIndex = String(index);
    const cellEl = document.createElement("div");
    const cellText = table.cells.get(`${cellRowIndex}_${cellIndex}`)?.calculatedValue ?? '';

    cellEl.classList.add('cell');
    cellEl.setAttribute("data-row", cellRowIndex);
    cellEl.setAttribute("data-cell", cellIndex);
    cellEl.style.transform = `translateX(${translateY}px)`;
    cellEl.style.width = `${col.width}px`;
    cellEl.textContent = cellText;

    rowEl.appendChild(cellEl);

    translateY = translateY + col.width;
  })
};

export const addRowsToTable = (
  table: Table,
  tableEl: HTMLDivElement,
  intersectionObserver: IntersectionObserver,
): void => {
  let reservedHeight = 0;
  let tableWidth = 0;



  table.columns.forEach(({ width }) => tableWidth += width);
  tableEl.style.width = `${tableWidth + table.numberRowWidth}px`;

  const rowsNodes: HTMLDivElement[] = table.rows.map((row: Row): HTMLDivElement => {
    const rowEl = document.createElement("div");
    rowEl.classList.add("row");
    setRowData(rowEl, row, table, reservedHeight);
    setRowCells(rowEl, row, table);

    reservedHeight = reservedHeight + row.height;

    return rowEl;
  });

  for (let pageIndex = 0; pageIndex < table.pageCount; pageIndex += 1) {
    const firstRowOnPageIndex = table.pageSize * pageIndex;
    const lastRowOnPageIndex = firstRowOnPageIndex + table.pageSize - 1;

    intersectionObserver.observe(rowsNodes[firstRowOnPageIndex]);
    intersectionObserver.observe(rowsNodes[lastRowOnPageIndex]);
  }

  tableEl.append(...rowsNodes);
  tableEl.style.height = `${reservedHeight}px`;
}
