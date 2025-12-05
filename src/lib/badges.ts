export type Badge = {
    id: string;
    name: string;
    description: string;
    icon: string; // Lucide icon name or emoji
    category: "savings" | "spending" | "budget" | "streak" | "general";
    check: (data: any) => boolean;
};

export const BADGES: Badge[] = [
    // --- General / Onboarding ---
    {
        id: "first_step",
        name: "First Step",
        description: "Add your first transaction.",
        icon: "👣",
        category: "general",
        check: (data) => data.transactions.length >= 1
    },
    {
        id: "tracker_novice",
        name: "Tracker Novice",
        description: "Track 10 transactions.",
        icon: "📝",
        category: "general",
        check: (data) => data.transactions.length >= 10
    },
    {
        id: "tracker_pro",
        name: "Tracker Pro",
        description: "Track 50 transactions.",
        icon: "📊",
        category: "general",
        check: (data) => data.transactions.length >= 50
    },
    {
        id: "tracker_master",
        name: "Tracker Master",
        description: "Track 100 transactions.",
        icon: "🏆",
        category: "general",
        check: (data) => data.transactions.length >= 100
    },

    // --- Savings ---
    {
        id: "saver_bronze",
        name: "Bronze Saver",
        description: "Save ₹1,000 in a month (Income - Expense).",
        icon: "🥉",
        category: "savings",
        check: (data) => {
            // Check current month savings
            const now = new Date();
            const currentMonthTxns = data.transactions.filter((t: any) => {
                const d = new Date(t.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
            const income = currentMonthTxns.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
            const expense = currentMonthTxns.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
            return (income - expense) >= 1000;
        }
    },
    {
        id: "saver_silver",
        name: "Silver Saver",
        description: "Save ₹5,000 in a month.",
        icon: "🥈",
        category: "savings",
        check: (data) => {
            const now = new Date();
            const currentMonthTxns = data.transactions.filter((t: any) => {
                const d = new Date(t.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
            const income = currentMonthTxns.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
            const expense = currentMonthTxns.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
            return (income - expense) >= 5000;
        }
    },
    {
        id: "saver_gold",
        name: "Gold Saver",
        description: "Save ₹10,000 in a month.",
        icon: "🥇",
        category: "savings",
        check: (data) => {
            const now = new Date();
            const currentMonthTxns = data.transactions.filter((t: any) => {
                const d = new Date(t.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
            const income = currentMonthTxns.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
            const expense = currentMonthTxns.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
            return (income - expense) >= 10000;
        }
    },
    {
        id: "saver_platinum",
        name: "Platinum Saver",
        description: "Save ₹50,000 in a month.",
        icon: "💎",
        category: "savings",
        check: (data) => {
            const now = new Date();
            const currentMonthTxns = data.transactions.filter((t: any) => {
                const d = new Date(t.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
            const income = currentMonthTxns.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
            const expense = currentMonthTxns.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
            return (income - expense) >= 50000;
        }
    },

    // --- Streaks ---
    {
        id: "streak_3",
        name: "Consistency Is Key",
        description: "Track expenses for 3 days in a row.",
        icon: "🔥",
        category: "streak",
        check: (data) => calculateStreak(data.transactions) >= 3
    },
    {
        id: "streak_7",
        name: "Week Warrior",
        description: "Track expenses for 7 days in a row.",
        icon: "🗓️",
        category: "streak",
        check: (data) => calculateStreak(data.transactions) >= 7
    },
    {
        id: "streak_14",
        name: "Two Week Streak",
        description: "Track expenses for 14 days in a row.",
        icon: "🚀",
        category: "streak",
        check: (data) => calculateStreak(data.transactions) >= 14
    },
    {
        id: "streak_30",
        name: "Monthly Master",
        description: "Track expenses for 30 days in a row.",
        icon: "👑",
        category: "streak",
        check: (data) => calculateStreak(data.transactions) >= 30
    },

    // --- Budgeting ---
    {
        id: "budget_setter",
        name: "Planner",
        description: "Set a monthly budget.",
        icon: "📐",
        category: "budget",
        check: (data) => data.budgets.length > 0
    },
    {
        id: "under_budget",
        name: "Under Control",
        description: "Stay under your total budget for the month.",
        icon: "🛡️",
        category: "budget",
        check: (data) => {
            // Simplified check: if any budget exists and is not exceeded
            // Ideally needs historical budget data, but let's check current month status
            // This is tricky without historical snapshots. 
            // Let's check: if today is > 25th and total spend < total budget
            const now = new Date();
            if (now.getDate() < 25) return false; // Only award near end of month

            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const budget = data.budgets.find((b: any) => b.month === currentMonth && !b.category);
            if (!budget) return false;

            const spent = data.transactions
                .filter((t: any) => t.type === 'expense' && t.date.startsWith(currentMonth)) // Assuming date is ISO string or Date object handled
                .reduce((s: number, t: any) => s + t.amount, 0);

            return spent <= budget.amount;
        }
    },

    // --- Spending Habits ---
    {
        id: "no_spend_day",
        name: "No Spend Day",
        description: "Have a day with 0 expenses.",
        icon: "🧘",
        category: "spending",
        check: (data) => {
            // Check if there's any day in the past (not today) with 0 expenses
            // This logic is hard to prove "0 expenses" vs "forgot to track".
            // Let's assume: if there are transactions on Day X and Day X+2, but none on Day X+1, that's a no spend day.
            // Or simpler: User explicitly marks it? No, let's infer.
            // Let's check gaps between expense dates.
            const expenses = data.transactions
                .filter((t: any) => t.type === 'expense')
                .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

            if (expenses.length < 2) return false;

            for (let i = 0; i < expenses.length - 1; i++) {
                const d1 = new Date(expenses[i].date);
                const d2 = new Date(expenses[i + 1].date);
                const diffTime = Math.abs(d2.getTime() - d1.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > 1) return true; // Gap of at least 1 day
            }
            return false;
        }
    },
    {
        id: "frugal_foodie",
        name: "Frugal Foodie",
        description: "Spend less than ₹200 on Food in a transaction.",
        icon: "🥗",
        category: "spending",
        check: (data) => data.transactions.some((t: any) => t.type === 'expense' && t.category?.toLowerCase() === 'food' && t.amount < 200)
    },
    {
        id: "big_spender",
        name: "Big Spender",
        description: "Log an expense over ₹10,000.",
        icon: "💸",
        category: "spending",
        check: (data) => data.transactions.some((t: any) => t.type === 'expense' && t.amount > 10000)
    },

    // --- Categories ---
    {
        id: "tech_enthusiast",
        name: "Tech Enthusiast",
        description: "Track 5 expenses in Electronics/Gadgets.",
        icon: "💻",
        category: "spending",
        check: (data) => data.transactions.filter((t: any) => ['electronics', 'gadgets', 'tech'].includes(t.category?.toLowerCase())).length >= 5
    },
    {
        id: "health_nut",
        name: "Health Nut",
        description: "Track 5 expenses in Health/Fitness.",
        icon: "💪",
        category: "spending",
        check: (data) => data.transactions.filter((t: any) => ['health', 'fitness', 'gym', 'medical'].includes(t.category?.toLowerCase())).length >= 5
    },
    {
        id: "traveler",
        name: "Globetrotter",
        description: "Track 5 expenses in Travel.",
        icon: "✈️",
        category: "spending",
        check: (data) => data.transactions.filter((t: any) => ['travel', 'vacation', 'flight', 'hotel'].includes(t.category?.toLowerCase())).length >= 5
    },

    // --- Smart Features ---
    {
        id: "goal_setter",
        name: "Goal Setter",
        description: "Create a savings goal.",
        icon: "🎯",
        category: "general",
        check: (data) => {
            // Need goals data, but user object might not have it populated in this context usually.
            // We'll assume data passed includes goals if possible, or skip this check for now if complex.
            // Let's assume we fetch goals separately or attach them.
            // For now, return false to be safe unless we update the fetch logic.
            return false;
        }
    },

    // --- More Streaks/Volume ---
    {
        id: "weekend_warrior",
        name: "Weekend Tracker",
        description: "Track expenses on a Saturday and Sunday.",
        icon: "🎉",
        category: "streak",
        check: (data) => {
            const hasSat = data.transactions.some((t: any) => new Date(t.date).getDay() === 6);
            const hasSun = data.transactions.some((t: any) => new Date(t.date).getDay() === 0);
            return hasSat && hasSun;
        }
    },
    {
        id: "early_bird",
        name: "Early Bird",
        description: "Track a transaction before 8 AM.",
        icon: "🌅",
        category: "general",
        check: (data) => data.transactions.some((t: any) => new Date(t.date).getHours() < 8)
    },
    {
        id: "night_owl",
        name: "Night Owl",
        description: "Track a transaction after 10 PM.",
        icon: "🦉",
        category: "general",
        check: (data) => data.transactions.some((t: any) => new Date(t.date).getHours() >= 22)
    },

    // --- Currency ---
    {
        id: "international",
        name: "International",
        description: "Track a transaction in a foreign currency.",
        icon: "🌍",
        category: "general",
        check: (data) => data.transactions.some((t: any) => t.originalCurrency && t.originalCurrency !== 'INR')
    },

    // --- Recurring ---
    {
        id: "subscriber",
        name: "Subscriber",
        description: "Add a recurring transaction.",
        icon: "🔄",
        category: "general",
        check: (data) => data.transactions.some((t: any) => t.isRecurring)
    }
];

function calculateStreak(transactions: any[]): number {
    const expenseDates = new Set(
        transactions
            .filter((t: any) => t.type === "expense")
            .map((t: any) => new Date(t.date).toISOString().split('T')[0])
    );

    const today = new Date();
    let streak = 0;
    let currentCheck = new Date(today);

    let checkStr = currentCheck.toISOString().split('T')[0];
    if (!expenseDates.has(checkStr)) {
        currentCheck.setDate(currentCheck.getDate() - 1);
        checkStr = currentCheck.toISOString().split('T')[0];
        if (!expenseDates.has(checkStr)) {
            return 0;
        } else {
            streak = 1;
            currentCheck.setDate(currentCheck.getDate() - 1);
        }
    } else {
        streak = 1;
        currentCheck.setDate(currentCheck.getDate() - 1);
    }

    while (true) {
        const str = currentCheck.toISOString().split('T')[0];
        if (expenseDates.has(str)) {
            streak++;
            currentCheck.setDate(currentCheck.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}
