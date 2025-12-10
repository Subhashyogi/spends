export const smsParser = {
    parse: (text: string) => {
        let amount = 0;
        let merchant = "";
        let date = new Date().toISOString().split('T')[0]; // Default to today

        const cleanText = text.toLowerCase();

        // 1. Extract Amount
        // Look for "rs. 123", "inr 123", "amt 123"
        const amountRegex = /(?:rs\.?|inr|amt)\s*([\d,]+(?:\.\d{2})?)/i;
        const amountMatch = text.match(amountRegex);
        if (amountMatch) {
            amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        }

        // 2. Extract Merchant / Description
        // Common patterns: "paid to X", "spent at X", "debited for X", "vpa X"
        // UPI: "paid to <merchant>"
        const paidToRegex = /paid to\s+([a-z0-9\s]+?)(?:\s+on|\s+from|\s+via|\.$)/i;
        const spentAtRegex = /spent\s+.*?\s+at\s+([a-z0-9\s]+?)(?:\s+on|\.$)/i;
        const debitedForRegex = /debited\s+.*?\s+for\s+([a-z0-9\s]+?)(?:\s+on|\.$)/i;
        const sentToRegex = /sent\s+.*?\s+to\s+([a-z0-9\s]+?)(?:\s+on|\.$)/i;

        const mergechantMatch = cleanText.match(paidToRegex) ||
            cleanText.match(spentAtRegex) ||
            cleanText.match(debitedForRegex) ||
            cleanText.match(sentToRegex);

        if (mergechantMatch) {
            merchant = mergechantMatch[1].trim(); // Capitalize if possible
            // Simple cleanup
            merchant = merchant.replace(/\b\w/g, l => l.toUpperCase());
        }

        // 3. Extract Date
        // Formats: DD-MM-YY, DD/MM/YY, DD-MMM-YY
        const dateRegex = /(\d{1,2})[-/](\d{1,2}|[a-z]{3})[-/](\d{2,4})/i;
        const dateMatch = text.match(dateRegex);

        if (dateMatch) {
            try {
                // Simplified date parsing
                // Assuming current year if 2 digits provided? 
                // Let's keep it simple: if valid date found, use it, else default today
                // For now, defaulting to Today is safest for "Just arrived" SMS.
            } catch (e) {
                // ignore
            }
        }

        return {
            amount: amount || undefined,
            description: merchant || undefined,
            date: undefined // Default to letting the UI set "Today" if not found
        };
    }
};
