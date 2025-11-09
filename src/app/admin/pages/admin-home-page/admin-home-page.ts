import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-home-page',
  standalone: true,
  templateUrl: './admin-home-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminHomePage {}
