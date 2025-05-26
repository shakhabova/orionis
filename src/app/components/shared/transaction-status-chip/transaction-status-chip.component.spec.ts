import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionStatusChipComponent } from './transaction-status-chip.component';

describe('TransactionStatusChipComponent', () => {
	let component: TransactionStatusChipComponent;
	let fixture: ComponentFixture<TransactionStatusChipComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TransactionStatusChipComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(TransactionStatusChipComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
