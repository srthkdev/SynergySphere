import { signIn } from "@/lib/auth/auth-client";
import { Button } from "../ui/button";

export default function SignInSocial({
    provider,
    children,
    className
}:{
    provider:
    | "github"
    | "google"
    | "linkedin"
    | "twitter"
    | "microsoft"
    | "apple"
    | "discord";
    children: React.ReactNode;
    className?: string;
}) {
    return <Button 
        onClick={async () => {
            await signIn.social({
                provider,
                callbackURL: '/dashboard'
            }) 
        }}
        type="button"
        variant="outline"
        className={className}
    >
        {children}
    </Button>
}