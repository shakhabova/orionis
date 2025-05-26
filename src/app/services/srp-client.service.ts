import { Injectable } from '@angular/core';
import thinbusSRP from 'thinbus-srp/browser.js';
import { environment } from '../../environment/environment';

@Injectable({
	providedIn: 'root',
})
export class SrpClientService {
	public srpClient() {
		const SrpClientConstructor = thinbusSRP(
			environment.srp6.N_base10,
			environment.srp6.g_base10,
			environment.srp6.k_base16,
		);
		const client = new SrpClientConstructor();
		return client;
	}
}
