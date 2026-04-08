import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";

export type Role = "admin" | "user";

export async function checkRole(role: Role) {
    const sessionCookie = (await cookies()).get("session")?.value;
    if (!sessionCookie) return false;

    try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        
        // Dynamic Role Validation (Case-Insensitive)
        const userRole = (decodedClaims.role as string)?.toLowerCase();
        return userRole === role.toLowerCase(); 
    } catch (error) {
        return false;
    }
}

export async function getRole() {
    const sessionCookie = (await cookies()).get("session")?.value;
    if (!sessionCookie) return "user" as Role;

    try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        
        // Extract Dynamic Role from Claims
        const userRole = (decodedClaims.role as string)?.toLowerCase();
        if (userRole === "admin") return "admin";
        
        return "user" as Role; 
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
