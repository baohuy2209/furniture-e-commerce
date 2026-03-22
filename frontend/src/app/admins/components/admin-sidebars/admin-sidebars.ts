import { Component, ViewEncapsulation } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'admin-sidebars',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './admin-sidebars.html',
  styleUrl: './admin-sidebars.css',
  encapsulation: ViewEncapsulation.None
})
export class AdminSidebars {}
