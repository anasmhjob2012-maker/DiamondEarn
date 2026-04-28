import { ProfileView } from "@/components/profile/profile-view"

export const metadata = {
  title: "Profile — DiamondEarn",
  description: "Your DiamondEarn account, balance and recent activity.",
}

// Profile is purely client-side because all reads are scoped to the signed-in
// user. The auth gate inside <ProfileView /> opens the auth modal for guests
// instead of redirecting — this avoids any ping-pong between routes.
export default function ProfilePage() {
  return <ProfileView />
}
