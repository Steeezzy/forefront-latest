
export interface GoogleReview {
    reviewId: string;
    reviewer: {
        displayName: string;
        profilePhotoUri?: string;
    };
    starRating: string; // 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE'
    comment: string;
    createTime: string;
    updateTime: string;
    reviewReply?: {
        comment: string;
        updateTime: string;
    };
}

export class GoogleReviewsService {
    /**
     * Fetch reviews for a Place ID using Google Places API (New)
     * For full GMB reviews, the Business Information API is needed,
     * but Places API can get the most recent ones.
     */
    async fetchRecentReviews(placeId: string, apiKey: string): Promise<GoogleReview[]> {
        const url = `https://places.googleapis.com/v1/places/${placeId}?fields=reviews&key=${apiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Google Places API error: ${JSON.stringify(error)}`);
        }

        const data: any = await response.json();
        const reviews = data.reviews || [];

        // Normalize to a consistent format
        return reviews.map((r: any) => ({
            reviewId: r.name,
            reviewer: {
                displayName: r.authorAttribution?.displayName || 'Anonymous',
                profilePhotoUri: r.authorAttribution?.photoUri,
            },
            starRating: this.numericToEnum(r.rating),
            comment: r.text?.text || '',
            createTime: r.publishTime,
            updateTime: r.publishTime,
        }));
    }

    private numericToEnum(rating: number): string {
        const map: Record<number, string> = {
            1: 'ONE', 2: 'TWO', 3: 'THREE', 4: 'FOUR', 5: 'FIVE'
        };
        return map[rating] || 'THREE';
    }

    async getReviewStats(placeId: string, apiKey: string) {
        const url = `https://places.googleapis.com/v1/places/${placeId}?fields=rating,userRatingCount&key=${apiKey}`;
        const response = await fetch(url);
        const data: any = await response.json();
        
        return {
            averageRating: data.rating || 0,
            totalReviewCount: data.userRatingCount || 0
        };
    }
}

export const googleReviewsService = new GoogleReviewsService();
