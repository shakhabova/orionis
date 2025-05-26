import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketInfoItemComponent } from './market-info-item.component';

describe('MarketInfoItemComponent', () => {
	let component: MarketInfoItemComponent;
	let fixture: ComponentFixture<MarketInfoItemComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MarketInfoItemComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(MarketInfoItemComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
