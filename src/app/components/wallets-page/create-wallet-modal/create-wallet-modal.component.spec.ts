import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateWalletModalComponent } from './create-wallet-modal.component';

describe('CreateWalletModalComponent', () => {
	let component: CreateWalletModalComponent;
	let fixture: ComponentFixture<CreateWalletModalComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [CreateWalletModalComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(CreateWalletModalComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
