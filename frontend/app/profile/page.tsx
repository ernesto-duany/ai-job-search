import { ProfileForm } from "@/components/ProfileForm/ProfileForm";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold">Profile</h1>
      <p className="mt-2 mb-4 text-sm text-neutral-500 dark:text-neutral-400">
        Edits write directly to CLAUDE.md and 01-candidate-profile.md — no Claude session runs for
        this page.
      </p>
      <ProfileForm />
    </div>
  );
}
