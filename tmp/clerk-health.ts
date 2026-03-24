import { createClerkClient } from '@clerk/backend';

const publishableKey = "pk_test_cHJlY2lzZS1sYWR5YmlyZC01Ny5jbGVyay5hY2NvdW50cy5kZXYk";
const secretKey = "sk_test_xs33kDGCw9YI82xPwsOzDm6DiBsJ4cymHi9G7t0FHJ";

const clerk = createClerkClient({ secretKey, publishableKey });

async function test() {
    try {
        console.log("--- Clerk Health Check ---");
        console.log("Publishable Key (masked):", publishableKey.slice(0, 10) + "...");
        console.log("Secret Key (masked):", secretKey.slice(0, 10) + "...");

        const userList = await clerk.users.getUserList({ limit: 1 });
        console.log("Successfully reached Clerk API!");
        console.log("User Count (last 1):", userList.data.length);
        console.log("--- OK ---");
    } catch (error: any) {
        console.error("!!! CLERK API FAILURE !!!");
        console.error("Message:", error.message);
        console.error("Status:", error.status);
        console.error("Response:", JSON.stringify(error.errors, null, 2));
        console.log("--- FAILED ---");
    }
}

test();
