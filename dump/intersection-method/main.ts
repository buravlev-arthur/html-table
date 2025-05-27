import { Viewport } from "./viewport.class";
import { Table } from "./table.class";
import { addRowsToTable, getIntersectionObserver, setColumnHeaders } from './table.view';

const tableEl = document.getElementById("table") as HTMLDivElement;

const viewport: Viewport = new Viewport();
const table = new Table(viewport);

const intersectionObserver = getIntersectionObserver(table, tableEl);

setColumnHeaders(table);
addRowsToTable(table, tableEl, intersectionObserver);
