"use client"

export function getOwnerToken() {
  let token = localStorage.getItem("booking_owner_token");

  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("booking_owner_token", token);
  }

  return token;
}