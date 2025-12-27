export interface InboundScanPayload {
    qr_code: string;
    condition: 'GREEN' | 'ORANGE' | 'RED';
    notes?: string;
    photos?: string[];
    refurb_days_estimate?: number;
    discrepancy_reason?: 'BROKEN' | 'LOST' | 'OTHER';
    quantity?: number; // For BATCH assets
}

export interface ScanProgressResponse {
    items_scanned: number;
    total_items: number;
    percent_complete: number;
}

export interface InboundScanResponse {
    message: string;
    asset: any;
    progress: ScanProgressResponse;
}
