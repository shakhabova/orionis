import { Component, computed, input } from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';
import type { TransactionDto } from 'services/transactions.service';

const ICON_TYPE_MAP: Record<TransactionDto['type'], string> = {
	IN: '@tui.arrow-down',
	F2C: '@tui.arrow-down',
	C2C: '@tui.arrow-down',
	CSTD_IN: '@tui.arrow-down',

	OUT: '@tui.arrow-up',
	C2F: '@tui.arrow-up',
	CSTD_OUT: '@tui.arrow-up',
};

@Component({
	selector: 'app-transaction-type-icon',
	imports: [TuiIcon],
	templateUrl: './transaction-type-icon.component.html',
	styleUrl: './transaction-type-icon.component.css',
})
export class TransactionTypeIconComponent {
	type = input.required<TransactionDto['type']>();

	typeIcon = computed(() => ICON_TYPE_MAP[this.type()]);
}
