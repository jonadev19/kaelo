import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-home-page',
  imports: [],
  templateUrl: './admin-home-page.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminHomePage { }
