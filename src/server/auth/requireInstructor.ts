import { getServerSession } from "next-auth";
import { authOptions } from "../../app/api/auth/[...nextauth]/options";
import { ApiError } from "../http/errors";

export async function requireInstructor() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new ApiError("Unauthorized", 401);
  }
  return session;
}
