import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { Marquee } from '../marquee/marquee';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, Header, Marquee],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css',
})
export class AuthLayout {}
