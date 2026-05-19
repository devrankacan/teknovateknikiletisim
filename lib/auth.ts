import { MOCK_USER } from "./mockData";

export function authenticate(username: string, password: string): boolean {
  return username === MOCK_USER.username && password === MOCK_USER.password;
}

export function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Şimdi";
  if (minutes < 60) return `${minutes} dk`;
  if (hours < 24) return `${hours} sa`;
  return `${days} gün`;
}

export function formatFullTime(date: Date): string {
  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
