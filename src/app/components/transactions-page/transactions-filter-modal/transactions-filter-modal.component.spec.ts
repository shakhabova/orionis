import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionsFilterModalComponent } from './transactions-filter-modal.component';

describe('TransactionsFilterModalComponent', () => {
	let component: TransactionsFilterModalComponent;
	let fixture: ComponentFixture<TransactionsFilterModalComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TransactionsFilterModalComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(TransactionsFilterModalComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
