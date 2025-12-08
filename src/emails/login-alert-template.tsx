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

interface LoginAlertTemplateProps {
    userName: string;
    time: string;
    device: string;
    ip: string;
}

export const LoginAlertTemplate = ({
    userName = "User",
    time = new Date().toLocaleString(),
    device = "Unknown Device",
    ip = "Unknown IP",
}: LoginAlertTemplateProps) => {
    return (
        <Html>
            <Head />
            <Preview>New Login Detected</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            New Login Detected
                        </Heading>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Hello {userName},
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            We detected a new login to your Spends account.
                        </Text>

                        <Section className="bg-zinc-50 p-4 rounded-lg my-4 border border-zinc-100">
                            <Text className="text-black text-[14px] m-0 mb-2">
                                <strong>Time:</strong> {time}
                            </Text>
                            <Text className="text-black text-[14px] m-0 mb-2">
                                <strong>Device:</strong> {device}
                            </Text>
                            <Text className="text-black text-[14px] m-0">
                                <strong>IP Address:</strong> {ip}
                            </Text>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            If this was you, you can safely ignore this email. If you did not log in, please secure your account immediately.
                        </Text>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                        <Text className="text-[#666666] text-[12px] leading-[24px] mt-[32px] text-center">
                            This email was sent automatically by Spends.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default LoginAlertTemplate;
