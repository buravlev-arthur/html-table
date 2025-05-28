import VirtualScroll from "./virtual-scroll.class";

const container = document.getElementById('viewport') as HTMLDivElement;
const rowsCount = 10000;
const rowHeightPx = 28;

const virtualScroll = new VirtualScroll(container, rowsCount, rowHeightPx);
