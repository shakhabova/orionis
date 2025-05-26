import { Component } from '@angular/core';
import { MissionComponent } from './mission/mission.component';
import { ServicesCardComponent } from './services-card/services-card.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { RouterModule } from '@angular/router';

@Component({
	selector: 'app-home-page',
	imports: [MissionComponent, ServicesCardComponent, ContactUsComponent, RouterModule],
	templateUrl: './home-page.component.html',
	styleUrl: './home-page.component.scss',
})
export class HomePageComponent {}
