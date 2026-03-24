import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

export type Role = "admin" | "user";

export async function checkRole(role: Role) {
    const sessionCookie = (await cookies()).get("session")?.value;
    if (!sessionCookie) return false;

    try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        
        // Permanent Admin Rule for the primary operator (Case-Insensitive)
        if (decodedClaims.email?.toLowerCase() === "professorshyam123@gmail.com") return true;
        
        return !!decodedClaims.role; 
    } catch (error) {
        return false;
    }
}

export async function getRole() {
    const sessionCookie = (await cookies()).get("session")?.value;
    if (!sessionCookie) return "user" as Role;

    try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        
        // Permanent Admin Rule for the primary operator (Case-Insensitive)
        if (decodedClaims.email?.toLowerCase() === "professorshyam123@gmail.com") return "admin";
        
        return (decodedClaims.role as Role) || "user"; 
    } catch (error) {
        return "user" as Role;
    }
}

export async function isEmailVerified() {
    const sessionCookie = (await cookies()).get("session")?.value;
    if (!sessionCookie) return false;

    try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        return !!decodedClaims.email_verified;
    } catch (error) {
        return false;
    }
}
