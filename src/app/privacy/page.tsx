import Link from 'next/link';
export default function Privacy() {
  return (
    <main className="shell max-w-3xl py-16">
      <Link href="/" className="text-violet-300">
        ← Knowledge AI
      </Link>
      <h1 className="my-8 text-4xl font-semibold">Privacy & demo terms</h1>
      <div className="space-y-6 leading-8 text-zinc-300">
        <p>
          This is an evaluation MVP. Billing is simulated: no card details are collected and no
          money is charged. Plan prices illustrate the product’s proposed commercial model.
        </p>
        <h2 className="text-xl text-white">Your data</h2>
        <p>
          Account details, uploaded files and chat history are stored in Supabase. Document text and
          questions are sent to Mistral to generate embeddings and answers. Do not upload sensitive
          personal information, credentials or documents you are not authorized to use.
        </p>
        <h2 className="text-xl text-white">Public widgets</h2>
        <p>
          Assistants start private. Enabling a website widget allows anyone with its public link to
          ask questions about the uploaded knowledge. Original files are not served through the
          widget. Disable the widget to stop new public conversations.
        </p>
        <h2 className="text-xl text-white">Retention and controls</h2>
        <p>
          Files and chats remain until the owner removes the document or chatbot. Removing a
          document stops future retrieval from it; answers already saved in chat history remain
          until the chatbot is deleted. Visitor chat sessions last seven days. The application
          stores only the session token in browser storage.
        </p>
        <h2 className="text-xl text-white">Limits</h2>
        <p>
          AI can make mistakes. Verify important answers. This demo does not offer a service-level
          guarantee and is not intended for sensitive or regulated production data.
        </p>
      </div>
    </main>
  );
}
