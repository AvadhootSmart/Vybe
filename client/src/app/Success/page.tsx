"use client";
import { useEffect } from "react";
import PageLoader from "@/components/PageLoader";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
    const router = useRouter();

    useEffect(() => {
        try {
            const url = new URL(window.location.href);
            const token = url.searchParams.get("googleAccessToken");
            if (token) {
                localStorage.setItem("googleAccessToken", token);
                // Clean URL
                url.searchParams.delete("googleAccessToken");
                const newQuery = url.searchParams.toString();
                const newUrl = `${url.pathname}${newQuery ? `?${newQuery}` : ""}${url.hash
                    }`;
                window.history.replaceState({}, "", newUrl);
            }
        } catch (e) {
            console.error("Error setting google token", e)
            // no-op
        } finally {
            setTimeout(() => {
                router.replace("/Explore");
            }, 600);
        }
    }, [router]);

    return <PageLoader />;
}


