import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface DigestTemplateProps {
    userName: string;
    type: "daily" | "weekly" | "monthly" | "yearly";
    totalSpend: number;
    topExpenses: Array<{ name: string; amount: number; date: string }>;
    upcomingBills: Array<{ name: string; amount: number; date: string }>;
    aiTip: string;
}

export const DigestTemplate = ({
    userName = "User",
    type = "weekly",
    totalSpend = 0,
    topExpenses = [],
    upcomingBills = [],
    aiTip = "Track your expenses daily to stay on top of your finances!",
}: DigestTemplateProps) => {
    const title = `${type.charAt(0).toUpperCase() + type.slice(1)} Financial Digest`;

    return (
        <Html>
            <Head />
            <Preview>{title} - Your spending summary</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            {title}
                        </Heading>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Hello {userName},
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Here is your {type} summary. You spent a total of{" "}
                            <span className="font-bold">₹{totalSpend.toLocaleString()}</span> during this period.
                        </Text>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                        <Section>
                            <Heading as="h3" className="text-black text-[18px] font-bold m-0 mb-4">
                                Top Expenses
                            </Heading>
                            {topExpenses.length > 0 ? (
                                topExpenses.map((expense, index) => (
                                    <div key={index} className="flex justify-between mb-2">
                                        <Text className="text-black text-[14px] m-0">
                                            {expense.name}
                                        </Text>
                                        <Text className="text-black text-[14px] font-bold m-0">
                                            ₹{expense.amount.toLocaleString()}
                                        </Text>
                                    </div>
                                ))
                            ) : (
                                <Text className="text-[#666666] text-[14px]">
                                    No expenses recorded for this period.
                                </Text>
                            )}
                        </Section>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                        <Section>
                            <Heading as="h3" className="text-black text-[18px] font-bold m-0 mb-4">
                                Upcoming Bills
                            </Heading>
                            {upcomingBills.length > 0 ? (
                                upcomingBills.map((bill, index) => (
                                    <div key={index} className="flex justify-between mb-2">
                                        <Text className="text-black text-[14px] m-0">
                                            {bill.name} (Due: {new Date(bill.date).toLocaleDateString()})
                                        </Text>
                                        <Text className="text-black text-[14px] font-bold m-0">
                                            ₹{bill.amount.toLocaleString()}
                                        </Text>
                                    </div>
                                ))
                            ) : (
                                <Text className="text-[#666666] text-[14px]">
                                    No upcoming bills detected.
                                </Text>
                            )}
                        </Section>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                        <Section className="bg-indigo-50 p-4 rounded-lg">
                            <Heading as="h3" className="text-indigo-700 text-[16px] font-bold m-0 mb-2">
                                💡 AI Tip of the Week
                            </Heading>
                            <Text className="text-indigo-900 text-[14px] m-0 leading-[24px]">
                                {aiTip}
                            </Text>
                        </Section>

                        <Text className="text-[#666666] text-[12px] leading-[24px] mt-[32px] text-center">
                            This email was sent automatically by Spends.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default DigestTemplate;
