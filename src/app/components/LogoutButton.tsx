"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      className="button-danger"
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Log out
    </button>
  );
}
