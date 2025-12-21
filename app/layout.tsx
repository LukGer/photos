import { Geist_Mono, Nothing_You_Could_Do } from "next/font/google";
import "./index.css";

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const nothingYouCouldDo = Nothing_You_Could_Do({
	variable: "--font-handwritten",
	subsets: ["latin"],
	weight: "400",
});

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body
				className={`${geistMono.variable} ${nothingYouCouldDo.variable} flex h-screen flex-col bg-muted`}
			>
				{children}
			</body>
		</html>
	);
}
