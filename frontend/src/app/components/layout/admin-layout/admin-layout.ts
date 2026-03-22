import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebars } from '../../../admins/components/admin-sidebars/admin-sidebars';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, AdminSidebars],
  standalone: true,
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {}
