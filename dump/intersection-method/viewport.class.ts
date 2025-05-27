export class Viewport {
  public width: number = 0;
  public height: number = 0;
  public zoom: number = 0;
  public readonly zoomDefault: number = 100;

  private readonly zoomThreshold: number = 10;
  private readonly minZoom: number = 50;
  private readonly maxZoom: number = 200;

  constructor() {
    this.setClientSizes();
    this.listenForWindowResize();
    this.setZoom(this.zoomDefault);
  }

  public get zoomCoefficient(): number {
    return this.zoom / this.zoomDefault;
  }

  public increaseZoom() {
    if (this.zoom >= this.maxZoom) {
      return;
    }

    this.zoom += this.zoomThreshold;
  }

  public decreaseZoom() {
    if (this.zoom <= this.minZoom) {
      return;
    }

    this.zoom -= this.zoomThreshold;
  }

  public setZoom(zoom: number) {
    this.zoom = zoom;
  }

  private listenForWindowResize() {
    window.addEventListener('resize', () => {
      this.setClientSizes();
    });
  }

  private setClientSizes() {
    this.width = document.documentElement.clientWidth;
    this.height = document.documentElement.clientHeight;
  }
}
