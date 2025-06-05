import type TableCell from './cell.class';

export default class ActionsPanel {
  private addRowTopBtnEl: HTMLDivElement = document.querySelector('#add-row-top')!;
  private addRowBottomBtnEl: HTMLDivElement = document.querySelector('#add-row-bottom')!;
  private addColumnLeftBtnEl: HTMLDivElement = document.querySelector('#add-column-left')!;
  private addColumnRightBtnEl: HTMLDivElement = document.querySelector('#add-column-right')!;
  private removeRowBtnEl: HTMLDivElement = document.querySelector('#remove-row')!;
  private removeColumnBtnEl: HTMLDivElement = document.querySelector('#remove-column')!;

  private addRowTopListener: ((event: MouseEvent) => void) | null = null;
  private addRowBottomListener: ((event: MouseEvent) => void) | null = null;
  private addColumnLeftListener: ((event: MouseEvent) => void) | null = null;
  private addColumnRightListener: ((event: MouseEvent) => void) | null = null;
  private removeRowListener: ((event: MouseEvent) => void) | null = null;
  private removeColumnListener: ((event: MouseEvent) => void) | null = null;

  constructor(
    private readonly addRow: (position: 'before' | 'after') => void,
    private readonly removeRow: () => void,
    private readonly addColumn: (position: 'before' | 'after') => void,
    private readonly removeColumn: () => void,
  ) {
    this.addRowTopListener = () => this.addRow('before');
    this.addRowTopBtnEl.addEventListener('click', this.addRowTopListener);
    this.addRowBottomListener = () => this.addRow('after');
    this.addRowBottomBtnEl.addEventListener('click', this.addRowBottomListener);
    this.addColumnLeftListener = () => this.addColumn('before');
    this.addColumnLeftBtnEl.addEventListener('click', this.addColumnLeftListener);
    this.addColumnRightListener = () => this.addColumn('after');
    this.addColumnRightBtnEl.addEventListener('click', this.addColumnRightListener);
    this.removeRowListener = () => this.removeRow();
    this.removeRowBtnEl.addEventListener('click', this.removeRowListener);
    this.removeColumnListener = () => this.removeColumn();
    this.removeColumnBtnEl.addEventListener('click', this.removeColumnListener);

    this.setButtonsDisabled();
  }

  public setButtonsDisabled(): void {
    this.addRowTopBtnEl.setAttribute('disabled', 'disabled');
    this.addRowBottomBtnEl.setAttribute('disabled', 'disabled');
    this.addColumnLeftBtnEl.setAttribute('disabled', 'disabled');
    this.addColumnRightBtnEl.setAttribute('disabled', 'disabled');
    this.removeRowBtnEl.setAttribute('disabled', 'disabled');
    this.removeColumnBtnEl.setAttribute('disabled', 'disabled');
  }

  public setButtonsAvailable(isRowsCountMoreThanOne: boolean, isColumnsCountMoreThanOne: boolean): void {
    this.addRowTopBtnEl.removeAttribute('disabled');
    this.addRowBottomBtnEl.removeAttribute('disabled');
    this.addColumnLeftBtnEl.removeAttribute('disabled');
    this.addColumnRightBtnEl.removeAttribute('disabled');

    if (isRowsCountMoreThanOne) {
      this.removeRowBtnEl.removeAttribute('disabled');
    }

    if (isColumnsCountMoreThanOne) {
      this.removeColumnBtnEl.removeAttribute('disabled');
    }
  }

  destroy(): void {
    if (this.addRowTopListener) {
      this.addRowTopBtnEl.removeEventListener('click', this.addRowTopListener);
      this.addRowTopListener = null;
    }

    if (this.addRowBottomListener) {
      this.addRowBottomBtnEl.removeEventListener('click', this.addRowBottomListener);
      this.addRowBottomListener = null;
    }

    if (this.addColumnLeftListener) {
      this.addColumnLeftBtnEl.removeEventListener('click', this.addColumnLeftListener);
      this.addColumnLeftListener = null;
    }

    if (this.addColumnRightListener) {
      this.addColumnRightBtnEl.removeEventListener('click', this.addColumnRightListener);
      this.addColumnRightListener = null;
    }

    if (this.removeRowListener) {
      this.removeRowBtnEl.removeEventListener('click', this.removeRowListener);
      this.removeRowListener = null;
    }

    if (this.removeColumnListener) {
      this.removeColumnBtnEl.removeEventListener('click', this.removeColumnListener);
      this.removeColumnListener = null;
    }
  }
}
