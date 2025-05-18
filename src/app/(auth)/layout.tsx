// import { Goku } from "@/app/(landing)/page"; // Goku import removed

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="w-full md:w-1/2 lg:w-1/3 h-full flex items-center justify-center px-2 md:px-0">
                {children}
            </div>
        </div>
    );
}