import { ChatInterface } from '@/components/ChatInterface';
export function ChatPlayground({
  botId,
  botName,
  hasKnowledge,
}: {
  botId: string;
  botName: string;
  hasKnowledge: boolean;
}) {
  return <ChatInterface botId={botId} name={botName} ready={hasKnowledge} />;
}
