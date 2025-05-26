import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, TemplateRef } from '@angular/core';

@Component({
	selector: 'app-empty-display',
	imports: [CommonModule],
	templateUrl: './empty-display.component.html',
	styleUrl: './empty-display.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyDisplayComponent {
	text = input<string>();
	action = input<TemplateRef<unknown>>();
}
