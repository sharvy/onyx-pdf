export interface TextItem {
    str: string;
    transform: number[]; // [scaleX, skewY, skewX, scaleY, tx, ty]
    width: number;
    height: number;
}

// Simple heuristic context analyzer
export function findPositionsForKeywords(
    textItems: TextItem[],
    clickX: number,
    clickY: number,
    pageHeight: number,
    keywords: string[]
): { keyword: string; x: number; y: number }[] {
    const results: { keyword: string; x: number; y: number }[] = [];

    // Search radius (in PDF points) - look around the click
    const SEARCH_RADIUS = 200;

    console.log('Analyzing context around', clickX, clickY);

    // Helper to find best match
    const findMatch = (keyword: string) => {
        const lowerKeyword = keyword.toLowerCase();

        // 1. First Pass: Local Search
        const nearbyItems = textItems.filter(item => {
            const x = item.transform[4];
            const y = item.transform[5];
            const dist = Math.sqrt(Math.pow(x - clickX, 2) + Math.pow(y - clickY, 2));
            return dist < SEARCH_RADIUS;
        });

        let match = nearbyItems.find(item => item.str.toLowerCase().includes(lowerKeyword));

        // 2. Second Pass: Global Search (if specific keyword like "signature")
        if (!match) {
            // Find closest match on entire page
            let minDist = Infinity;
            textItems.forEach(item => {
                if (item.str.toLowerCase().includes(lowerKeyword)) {
                    const x = item.transform[4];
                    const y = item.transform[5];
                    const dist = Math.sqrt(Math.pow(x - clickX, 2) + Math.pow(y - clickY, 2));
                    if (dist < minDist) {
                        minDist = dist;
                        match = item;
                    }
                }
            });
        }

        return match;
    };

    keywords.forEach(keyword => {
        const match = findMatch(keyword);

        if (match) {
            const x = match.transform[4];
            const y = match.transform[5];

            // Smart Placement Logic
            let resultX = x;
            let resultY = y;

            if (keyword === 'signature' || keyword === 'sign') {
                // Place ON TOP or slightly above the text (assuming text is "Signature: ______")
                // PDF Y coordinates: Higher value is Higher on page? 
                // No, usually PDF Y=0 is bottom-left. Increasing Y goes UP.
                // Text baseline is 'y'.
                // We want signature slightly ABOVE the text baseline? Or sitting on it?
                // Usually signatures are tall. We want the bottom of signature to be near baseline.
                resultX = x; // Aligned left
                resultY = y; // Baseline
            } else if (keyword === 'date') {
                // Place to the RIGHT of text
                resultX = x + match.width + 10;
                resultY = y;
            } else {
                // Default
                resultX = x;
                resultY = y + 20; // Slightly above? (Y+ is up)
            }

            results.push({
                keyword,
                x: resultX,
                y: resultY
            });
        } else {
            // Fallback: Click position
            results.push({
                keyword,
                x: clickX,
                y: clickY - (results.length * 20)
            });
        }
    });

    return results;
}
