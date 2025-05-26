import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionTypeIconComponent } from './transaction-type-icon.component';

describe('TransactionTypeIconComponent', () => {
	let component: TransactionTypeIconComponent;
	let fixture: ComponentFixture<TransactionTypeIconComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TransactionTypeIconComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(TransactionTypeIconComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
