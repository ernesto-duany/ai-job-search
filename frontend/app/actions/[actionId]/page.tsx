import { notFound } from "next/navigation";
import Link from "next/link";
import { getAction, toClientAction } from "@/lib/actions";
import { ChatRunner } from "@/components/ChatRunner";

export default async function ActionPage({
  params,
}: {
  params: Promise<{ actionId: string }>;
}) {
  const { actionId } = await params;
  const action = getAction(actionId);
  if (!action) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <Link href="/" className="text-sm text-neutral-500 hover:underline">
        ← Dashboard
      </Link>
      <div>
        <h1 className="text-xl font-semibold">{action.title}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{action.description}</p>
      </div>
      <ChatRunner action={toClientAction(action)} />
    </div>
  );
}
