import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
	selector: 'app-contact-page',
	imports: [FormsModule],
	templateUrl: './contact-page.component.html',
	styleUrl: './contact-page.component.scss',
})
export class ContactPageComponent {
	comment = '';
}
