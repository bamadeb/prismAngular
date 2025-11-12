import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './templates/header/header.component';
import { FooterComponent } from './templates/footer/footer.component';
import { MenuComponent } from './templates/menu/menu.component';
import { HttpClientModule } from '@angular/common/http';
import { Login } from "./views/login/login";
import { LoaderComponent } from "./shared/loader/loader";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, MenuComponent, HttpClientModule, Login, LoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('prism-outreach');
}
