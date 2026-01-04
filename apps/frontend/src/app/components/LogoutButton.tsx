"use client";

import { clearAuthToken } from "../../lib/api";

export default function LogoutButton() {
  return (
    <button
      className="button-danger"
      type="button"
      onClick={() => {
        clearAuthToken();
        window.location.href = "/login";
      }}
    >
      Log out
    </button>
  );
}
