export interface PageableParams {
	size?: number;
	page?: number;
	sort?: string;
}

export interface PageableResponse<T> {
	data: T[];
	pageNumber: number;
	pageSize: number;
	totalElements: number;
}
