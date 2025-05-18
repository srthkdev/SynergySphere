"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn, signUp, authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { toast } from "sonner"; // For displaying notifications
import { useRouter } from "next/navigation";

// Define Zod schema for form validation
const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type FormData = z.infer<typeof formSchema>;

export default function AuthCard({
  title,
  description,
  mode = "sign-in",
}: {
  title: string;
  description: string;
  mode?: "sign-in" | "sign-up";
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    const toastId = toast.loading(mode === "sign-in" ? "Signing in..." : "Signing up...");
    
    try {
      if (mode === "sign-in") {
        const { error } = await authClient.signIn.email(
          {
            email: data.email,
            password: data.password,
            callbackURL: "/dashboard",
          },
          {
            onSuccess: () => {
              toast.success("Signed in successfully! Redirecting...", { id: toastId });
              router.push("/dashboard");
            },
            onError: (err: any) => {
              console.error("Sign-in error object:", err);
              const message = err?.error?.message || err?.message || "Sign-in failed. Please try again.";
              throw new Error(message);
            },
          }
        );
        if (error) { // Handle potential error returned directly from the call
          throw new Error(error.message || "Sign-in failed");
        }
      } else { // sign-up
        const { error } = await authClient.signUp.email(
          {
            email: data.email,
            password: data.password,
            name: data.email.split("@")[0], // Using email prefix as name, as per original implementation
            callbackURL: "/dashboard", // Assuming better-auth handles redirection or provides a session
          },
          {
            onSuccess: () => {
              toast.success("Account created successfully! Redirecting...", { id: toastId });
              // For sign-up, better-auth might not automatically sign in.
              // If it does, router.push is fine. If not, user might need to sign in after sign-up.
              // For now, assuming sign-up also leads to a session and redirection.
              router.push("/dashboard");
            },
            onError: (err: any) => {
              console.error("Sign-up error object:", err);
              const message = err?.error?.message || err?.message || "Sign-up failed. Please try again.";
              throw new Error(message);
            },
          }
        );
        if (error) { // Handle potential error returned directly from the call
          throw new Error(error.message || "Sign-up failed");
        }
      }
      // If onSuccess callbacks handle redirection and success toast,
      // these lines might be redundant or need adjustment based on better-auth behavior.
      // For now, keeping the structure, assuming onSuccess might not run if an error is thrown before it.
      
    } catch (e: unknown) {
      console.error("Auth submission error:", e);
      let message = "An unexpected error occurred.";
      if (e instanceof Error) {
        message = e.message;
      }
      toast.error(message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const toastId = toast.loading("Redirecting to Google...");
    try {
      await signIn.social(
        {
          provider: "google",
          callbackURL: "/dashboard",
        },
        {
          onSuccess: () => {
            toast.success("Signed in with Google successfully! Redirecting...", { id: toastId });
          },
          onError: (error: any) => {
            console.error("Google Sign-In error object:", error);
            const message = error?.error?.message || error?.message || "Google Sign-In failed. Please try again.";
            toast.error(message, { id: toastId });
          },
        }
      );
    } catch (e: unknown) {
      console.error("Google Sign-In catch error:", e);
      let message = "An unexpected error occurred with Google Sign-In.";
      if (e instanceof Error) {
        message = e.message;
      }
      toast.error(message, { id: toastId });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Card className="max-w-md w-full rounded-none border-dashed">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">{title}</CardTitle>
        <CardDescription className="text-xs md:text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              {...register("email")}
              disabled={isLoading || googleLoading}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              disabled={isLoading || googleLoading}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || googleLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "sign-in" ? "Sign In" : "Sign Up"}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full gap-2 border-dashed"
          onClick={handleGoogleSignIn}
          disabled={isLoading || googleLoading}
        >
          {googleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.Google className="mr-2 h-4 w-4" /> // Assuming Google icon is available and working
          )}
          Google
        </Button>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-dashed pt-4">
        <p className="text-sm text-muted-foreground">
          {mode === "sign-in" ? (
            <>
              Don't have an account?{" "}
              <Link href="/sign-up" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/sign-in" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </CardFooter>
    </Card>
  );
}
