import { Component, ViewEncapsulation } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-sidebars',
  imports: [RouterModule],
  templateUrl: './admin-sidebars.html',
  styleUrl: './admin-sidebars.css',
  encapsulation: ViewEncapsulation.None,
})
export class AdminSidebars {}
