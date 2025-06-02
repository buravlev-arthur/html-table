import VirtualScroll from "./virtual-scroll.class";

const container = document.getElementById('viewport') as HTMLDivElement;
const rowsCount = 10000;
const rowHeightPx = 28;
let resizeTimeout: number | null = null;
const resizeDebounceMs: number = 500;

let virtualScroll: VirtualScroll | null = new VirtualScroll(container, rowsCount, rowHeightPx);

window.addEventListener('resize', () => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }

  resizeTimeout = setTimeout(() => {
    if (virtualScroll) {
      virtualScroll.destroy();
      virtualScroll = null;
    }

    virtualScroll = new VirtualScroll(container, rowsCount, rowHeightPx);
  }, resizeDebounceMs);
});
