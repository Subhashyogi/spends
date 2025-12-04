import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireUser() {
  try {
    const session = await getServerSession(authOptions as any);
    const s = session as any;
    const id = s?.user?.id as string | undefined;
    if (!id) {
      const err: any = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    return id;
  } catch (e: any) {
    const msg = e?.message || "";
    if (e?.name === "JWEDecryptionFailed" || msg.includes("decryption operation failed")) {
      const err: any = new Error("Invalid session");
      err.status = 401;
      throw err;
    }
    throw e;
  }
}
