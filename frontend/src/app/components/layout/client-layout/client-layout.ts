import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-client-layout',
  imports: [Header, Footer, RouterOutlet],
  templateUrl: './client-layout.html',
  styleUrl: './client-layout.css',
})
export class ClientLayout {}
