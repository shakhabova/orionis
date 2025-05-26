import { CommonModule } from '@angular/common';
import { Component, input, model, type TemplateRef } from '@angular/core';

@Component({
	selector: 'app-select-list',
	imports: [CommonModule],
	templateUrl: './select-list.component.html',
	styleUrl: './select-list.component.css',
})
export class SelectListComponent<T> {
	items = input<T[] | null>();
	valueTemp = input.required<TemplateRef<{ $implicit: T }>>();

	selected = model<T>();

	radioIcons: Map<boolean, string> = new Map([
		[true, 'assets/icons/radio-active.svg'],
		[false, 'assets/icons/radio-inactive.svg'],
	]);
}
